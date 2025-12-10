import { db } from "./db";
import { mechanics } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");
  
  // Create initial mechanic
  const [mechanic] = await db.insert(mechanics).values({
    email: "truman@oilboys.com",
    password: "admin",
    name: "Truman",
    phone: "801-555-0100"
  }).onConflictDoNothing().returning();
  
  if (mechanic) {
    console.log("Created mechanic:", mechanic.email);
  } else {
    console.log("Mechanic already exists");
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
