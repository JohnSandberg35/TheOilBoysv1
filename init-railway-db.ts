/**
 * Initializes an empty Railway (or any) PostgreSQL database with the full schema.
 * Use this when the database has no tables (e.g. new Railway Postgres, or db:push failed).
 *
 * Run with: DATABASE_URL=postgresql://... tsx init-railway-db.ts
 */
import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function initDb() {
  console.log("Initializing database schema...\n");

  // Check if appointments already exists (schema likely already set up)
  const { rows } = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'appointments'
    ) as exists
  `);
  if (rows[0]?.exists) {
    console.log("✅ Schema already exists (appointments table found). Nothing to do.");
    process.exit(0);
    return;
  }

  console.log("Creating tables...\n");

  // 1. managers
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS managers (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);
  console.log("  ✓ managers");

  // 2. mechanics
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mechanics (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      password TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      photo_url TEXT,
      bio TEXT,
      oil_change_count INTEGER NOT NULL DEFAULT 0,
      background_check_verified BOOLEAN NOT NULL DEFAULT false,
      is_public BOOLEAN NOT NULL DEFAULT true
    )
  `);
  console.log("  ✓ mechanics");

  // 3. customers (referenced by appointments)
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
  console.log("  ✓ customers");

  // 4. mechanic_availability
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mechanic_availability (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      mechanic_id VARCHAR NOT NULL REFERENCES mechanics(id),
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT true
    )
  `);
  console.log("  ✓ mechanic_availability");

  // 5. mechanic_recurring_schedule
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mechanic_recurring_schedule (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      mechanic_id VARCHAR NOT NULL REFERENCES mechanics(id),
      day_of_week INTEGER NOT NULL,
      time_slot TEXT NOT NULL,
      is_available BOOLEAN NOT NULL DEFAULT true
    )
  `);
  console.log("  ✓ mechanic_recurring_schedule");

  // 6. appointments
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      job_number INTEGER,
      customer_id VARCHAR REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      license_plate TEXT,
      license_plate_state TEXT,
      vehicle_year TEXT NOT NULL,
      vehicle_make TEXT NOT NULL,
      vehicle_model TEXT NOT NULL,
      vehicle_type TEXT,
      vehicle_number INTEGER,
      service_type TEXT NOT NULL,
      price INTEGER NOT NULL,
      date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      address TEXT NOT NULL,
      preferred_contact_method TEXT,
      will_be_home TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      mechanic_id VARCHAR REFERENCES mechanics(id),
      date_billed TEXT,
      date_received TEXT,
      is_paid BOOLEAN DEFAULT false,
      collector TEXT,
      payment_method TEXT,
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      follow_up_date TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("  ✓ appointments");

  // 7. mechanic_time_entries
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS mechanic_time_entries (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      mechanic_id VARCHAR NOT NULL REFERENCES mechanics(id),
      check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
      check_out_time TIMESTAMP
    )
  `);
  console.log("  ✓ mechanic_time_entries");

  // Job number sequence and index
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id)`);

  console.log("\n✅ Database schema initialized!");
  console.log("\nNext steps: npm run db:sync-schema, db:add-stripe-fields, db:seed, db:reset-production");
}

initDb()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  });
