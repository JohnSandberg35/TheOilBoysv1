import "dotenv/config";
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
  
  // Create manager account (Truman)
  const [manager] = await db.insert(managers).values({
    email: "theoilboysllc@gmail.com",
    password: hashPassword("Oilislife1!"),
    name: "Truman"
  }).onConflictDoNothing().returning();
  
  if (manager) {
    console.log("Created manager:", manager.email);
  } else {
    console.log("Manager theoilboysllc@gmail.com already exists");
  }

  // Create technician account with email and password
  const [technician] = await db.insert(mechanics).values({
    email: "john352@byu.edu",
    password: hashPassword("technician"),
    name: "John (Technician)",
    phone: "801-555-0101"
  }).onConflictDoNothing().returning();
  
  if (technician) {
    console.log("Created technician:", technician.email);
  } else {
    console.log("Technician john352@byu.edu already exists");
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
