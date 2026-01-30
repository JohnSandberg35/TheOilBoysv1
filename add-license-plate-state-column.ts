import "dotenv/config";
import { pool } from "./server/db";

async function addLicensePlateStateColumn() {
  const client = await pool.connect();
  try {
    console.log("Adding license_plate_state column to appointments table...");
    
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS license_plate_state TEXT;
    `);
    
    console.log("✅ Successfully added license_plate_state column!");
  } catch (error) {
    console.error("❌ Error adding column:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addLicensePlateStateColumn().catch(console.error);
