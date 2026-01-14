import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const managers = pgTable("managers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
});

export const insertManagerSchema = createInsertSchema(managers).omit({ id: true });
export type InsertManager = z.infer<typeof insertManagerSchema>;
export type Manager = typeof managers.$inferSelect;

export const mechanics = pgTable("mechanics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  password: text("password"),
  name: text("name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  oilChangeCount: integer("oil_change_count").notNull().default(0),
  backgroundCheckVerified: boolean("background_check_verified").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
});

export const insertMechanicSchema = createInsertSchema(mechanics).omit({ id: true });
export type InsertMechanic = z.infer<typeof insertMechanicSchema>;
export type Mechanic = typeof mechanics.$inferSelect;

export const mechanicAvailability = pgTable("mechanic_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mechanicId: varchar("mechanic_id").notNull().references(() => mechanics.id),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertMechanicAvailabilitySchema = createInsertSchema(mechanicAvailability).omit({ id: true });
export type InsertMechanicAvailability = z.infer<typeof insertMechanicAvailabilitySchema>;
export type MechanicAvailability = typeof mechanicAvailability.$inferSelect;

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  licensePlate: text("license_plate"),
  vehicleYear: text("vehicle_year").notNull(),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  serviceType: text("service_type").notNull(),
  price: integer("price").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("scheduled"),
  mechanicId: varchar("mechanic_id").references(() => mechanics.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
