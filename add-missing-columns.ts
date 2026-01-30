import "dotenv/config";
import { pool } from "./server/db";

async function addMissingColumns() {
  const client = await pool.connect();
  try {
    console.log("Adding missing columns to appointments table...");
    
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
    `);
    
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT;
    `);
    
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS will_be_home TEXT;
    `);
    
    console.log("✅ Successfully added all missing columns!");
    console.log("   - vehicle_type");
    console.log("   - preferred_contact_method");
    console.log("   - will_be_home");
  } catch (error) {
    console.error("❌ Error adding columns:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns().catch(console.error);
