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

// Recurring weekly schedule template (day of week: 0=Sunday, 1=Monday, etc.)
export const mechanicRecurringSchedule = pgTable("mechanic_recurring_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mechanicId: varchar("mechanic_id").notNull().references(() => mechanics.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6, where 0=Sunday, 1=Monday, etc.
  timeSlot: text("time_slot").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertMechanicRecurringScheduleSchema = createInsertSchema(mechanicRecurringSchedule).omit({ id: true });
export type InsertMechanicRecurringSchedule = z.infer<typeof insertMechanicRecurringScheduleSchema>;
export type MechanicRecurringSchedule = typeof mechanicRecurringSchedule.$inferSelect;

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: integer("job_number"), // Auto-incrementing job number
  customerId: varchar("customer_id").references(() => customers.id), // Link to customer
  customerName: text("customer_name").notNull(), // Keep for backward compatibility
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  licensePlate: text("license_plate"),
  licensePlateState: text("license_plate_state"),
  vehicleYear: text("vehicle_year").notNull(),
  vehicleMake: text("vehicle_make").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  vehicleType: text("vehicle_type"),
  vehicleNumber: integer("vehicle_number"), // Which vehicle # for this customer (1, 2, 3, etc.)
  serviceType: text("service_type").notNull(),
  price: integer("price").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  address: text("address").notNull(),
  preferredContactMethod: text("preferred_contact_method"),
  willBeHome: text("will_be_home"),
  status: text("status").notNull().default("scheduled"),
  mechanicId: varchar("mechanic_id").references(() => mechanics.id),
  // Payment tracking
  dateBilled: text("date_billed"),
  dateReceived: text("date_received"),
  isPaid: boolean("is_paid").default(false),
  collector: text("collector"), // Who collected payment
  paymentMethod: text("payment_method"), // Venmo, Cash, Stripe, etc.
  // Stripe payment tracking
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed
  // Follow-up and notes
  followUpDate: text("follow_up_date"), // Date of next change (6 months from service)
  notes: text("notes"), // Job-specific notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export const mechanicTimeEntries = pgTable("mechanic_time_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mechanicId: varchar("mechanic_id").notNull().references(() => mechanics.id),
  checkInTime: timestamp("check_in_time").notNull().defaultNow(),
  checkOutTime: timestamp("check_out_time"),
});

export const insertMechanicTimeEntrySchema = createInsertSchema(mechanicTimeEntries).omit({ id: true });
export type InsertMechanicTimeEntry = z.infer<typeof insertMechanicTimeEntrySchema>;
export type MechanicTimeEntry = typeof mechanicTimeEntries.$inferSelect;

// Customers table - links multiple appointments/vehicles to one customer
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  preferredContactMethod: text("preferred_contact_method"),
  address: text("address"), // Most recent address
  notes: text("notes"), // General customer notes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;