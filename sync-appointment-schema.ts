import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function syncAppointmentSchema() {
  console.log("Syncing appointments table schema...");

  try {
    // Check if appointments table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments'
      )
    `);
    
    if (!tableExists.rows[0]?.exists) {
      console.error("❌ appointments table does not exist!");
      throw new Error("appointments table not found");
    }

    console.log("✅ appointments table exists");

    // Add all columns that might be missing (using IF NOT EXISTS pattern)
    const columnsToAdd = [
      { name: "customer_phone", type: "TEXT", nullable: false, defaultValue: "''" },
      { name: "license_plate_state", type: "TEXT", nullable: true },
      { name: "vehicle_type", type: "TEXT", nullable: true },
      { name: "preferred_contact_method", type: "TEXT", nullable: true },
      { name: "will_be_home", type: "TEXT", nullable: true },
      { name: "job_number", type: "INTEGER", nullable: true },
      { name: "customer_id", type: "VARCHAR", nullable: true },
      { name: "vehicle_number", type: "INTEGER", nullable: true },
      { name: "date_billed", type: "TEXT", nullable: true },
      { name: "date_received", type: "TEXT", nullable: true },
      { name: "is_paid", type: "BOOLEAN", nullable: true, defaultValue: "FALSE" },
      { name: "collector", type: "TEXT", nullable: true },
      { name: "payment_method", type: "TEXT", nullable: true },
      { name: "follow_up_date", type: "TEXT", nullable: true },
      { name: "notes", type: "TEXT", nullable: true },
    ];

    for (const col of columnsToAdd) {
      try {
        // Check if column exists
        const colExists = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'appointments' 
            AND column_name = ${col.name}
          )
        `);

        if (!colExists.rows[0]?.exists) {
          console.log(`  Adding column: ${col.name}`);
          let alterSql = `ALTER TABLE appointments ADD COLUMN ${col.name} ${col.type}`;
          if (col.defaultValue) {
            alterSql += ` DEFAULT ${col.defaultValue}`;
          }
          if (!col.nullable) {
            alterSql += ` NOT NULL`;
          }
          await db.execute(sql.raw(alterSql));
          
          // If it's NOT NULL and we just added it, set default for existing rows
          if (!col.nullable && col.defaultValue) {
            await db.execute(sql.raw(`
              UPDATE appointments 
              SET ${col.name} = ${col.defaultValue} 
              WHERE ${col.name} IS NULL
            `));
          }
          
          console.log(`  ✅ Added ${col.name}`);
        } else {
          console.log(`  ✓ ${col.name} already exists`);
        }
      } catch (error: any) {
        // If column already exists or other error, continue
        if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
          console.log(`  ✓ ${col.name} already exists (caught error)`);
        } else {
          console.warn(`  ⚠️  Error adding ${col.name}:`, error.message);
        }
      }
    }

    // Create sequence for job numbers if it doesn't exist
    try {
      await db.execute(sql`
        CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1
      `);
      console.log("✅ Job number sequence ready");
    } catch (error: any) {
      console.log("  ℹ️  Job number sequence already exists or error:", error.message);
    }

    // Create index for customer_id if it doesn't exist
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id)
      `);
      console.log("✅ Customer ID index ready");
    } catch (error: any) {
      console.log("  ℹ️  Customer ID index already exists or error:", error.message);
    }

    // Check if customers table exists (needed for foreign key)
    const customersTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      )
    `);

    if (!customersTableExists.rows[0]?.exists) {
      console.log("⚠️  customers table does not exist - creating it...");
      await db.execute(sql`
        CREATE TABLE customers (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          preferred_contact_method TEXT,
          address TEXT,
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log("✅ Created customers table");
    } else {
      console.log("✅ customers table exists");
    }

    console.log("\n✅ Schema sync complete!");
    console.log("All required columns should now be present in the appointments table.");
  } catch (error) {
    console.error("❌ Error syncing schema:", error);
    throw error;
  }
}

syncAppointmentSchema()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  });
