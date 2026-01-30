import "dotenv/config";
import { db } from "./server/db";
import { managers, appointments, customers } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function resetForProduction() {
  console.log("Resetting database for production...\n");

  try {
    // 1. Delete all appointments (must be first - references customers)
    const deletedAppointments = await db.delete(appointments);
    console.log("✅ Deleted all appointments");

    // 2. Delete all customers
    const deletedCustomers = await db.delete(customers);
    console.log("✅ Deleted all customers");

    // 3. Remove old manager accounts
    await db.delete(managers).where(eq(managers.email, "johnsandberg35@gmail.com"));
    console.log("✅ Removed manager: johnsandberg35@gmail.com");

    await db.delete(managers).where(eq(managers.email, "truman@oilboys.com"));
    console.log("✅ Removed manager: truman@oilboys.com");

    // 4. Add Truman as the only manager (remove if exists, then insert fresh)
    await db.delete(managers).where(eq(managers.email, "theoilboysllc@gmail.com"));
    await db.insert(managers).values({
      email: "theoilboysllc@gmail.com",
      password: hashPassword("Oilislife1!"),
      name: "Truman",
    });
    console.log("✅ Added/updated manager: theoilboysllc@gmail.com (Truman)");

    // 5. Reset job number sequence so job #1 starts fresh (if it exists)
    try {
      await db.execute(sql`SELECT setval('job_number_seq', 1)`);
      console.log("✅ Reset job number sequence to 1");
    } catch {
      console.log("⚠️ Job number sequence not found (will be created on first appointment)");
    }

    console.log("\n✅ Reset complete! You can now sign in with:");
    console.log("   Email: theoilboysllc@gmail.com");
    console.log("   Password: Oilislife1!");
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

resetForProduction()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
