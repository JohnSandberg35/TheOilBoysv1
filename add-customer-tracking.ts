import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addCustomerTracking() {
  console.log("Adding customer tracking tables and fields...");

  try {
    // Create customers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS customers (
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

    // Add new columns to appointments table
    await db.execute(sql`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS job_number INTEGER,
      ADD COLUMN IF NOT EXISTS customer_id VARCHAR REFERENCES customers(id),
      ADD COLUMN IF NOT EXISTS vehicle_number INTEGER,
      ADD COLUMN IF NOT EXISTS date_billed TEXT,
      ADD COLUMN IF NOT EXISTS date_received TEXT,
      ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS collector TEXT,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS follow_up_date TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    console.log("✅ Added payment tracking and notes fields to appointments");

    // Create sequence for job numbers
    await db.execute(sql`
      CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1
    `);
    console.log("✅ Created job_number sequence");

    // Set default job number for existing appointments (backfill)
    await db.execute(sql`
      UPDATE appointments 
      SET job_number = nextval('job_number_seq')
      WHERE job_number IS NULL
    `);
    console.log("✅ Backfilled job numbers for existing appointments");

    // Create index for faster customer lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id)
    `);
    console.log("✅ Created index on customer_id");

    console.log("\n✅ Customer tracking setup complete!");
  } catch (error) {
    console.error("❌ Error setting up customer tracking:", error);
    throw error;
  }
}

addCustomerTracking()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
