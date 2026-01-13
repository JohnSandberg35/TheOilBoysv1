import { db } from "./db";
import { mechanics, managers } from "@shared/schema";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function seed() {
  console.log("Seeding database...");
  
  // Create initial mechanic (no longer needs password - managers handle auth)
  const [mechanic] = await db.insert(mechanics).values({
    name: "Truman",
    phone: "801-555-0100"
  }).onConflictDoNothing().returning();
  
  if (mechanic) {
    console.log("Created mechanic:", mechanic.name);
  } else {
    console.log("Mechanic already exists");
  }
  
  // Create manager account with hashed password
  const [manager] = await db.insert(managers).values({
    email: "truman@oilboys.com",
    password: hashPassword("admin"),
    name: "Truman"
  }).onConflictDoNothing().returning();
  
  if (manager) {
    console.log("Created manager:", manager.email);
  } else {
    console.log("Manager already exists");
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
