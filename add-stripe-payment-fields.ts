import "dotenv/config";
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function addStripePaymentFields() {
  console.log("Adding Stripe payment fields to appointments table...");

  try {
    // Add Stripe payment tracking fields
    await db.execute(sql`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    `);
    console.log("✅ Added Stripe payment fields to appointments table");

    console.log("\n✅ Stripe payment fields setup complete!");
  } catch (error) {
    console.error("❌ Error adding Stripe payment fields:", error);
    throw error;
  }
}

addStripePaymentFields()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  });
