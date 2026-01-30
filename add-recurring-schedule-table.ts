import "dotenv/config";
import { pool } from "./server/db";

async function addRecurringScheduleTable() {
  const client = await pool.connect();
  try {
    console.log("Creating mechanic_recurring_schedule table...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS mechanic_recurring_schedule (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        mechanic_id VARCHAR NOT NULL REFERENCES mechanics(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        time_slot TEXT NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT true,
        UNIQUE(mechanic_id, day_of_week, time_slot)
      );
    `);
    
    console.log("✅ Successfully created mechanic_recurring_schedule table!");
  } catch (error) {
    console.error("❌ Error creating table:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addRecurringScheduleTable().catch(console.error);
