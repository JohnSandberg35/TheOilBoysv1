import { type Mechanic, type InsertMechanic, type Appointment, type InsertAppointment, type Manager, type InsertManager, type MechanicAvailability, type InsertMechanicAvailability, type MechanicTimeEntry, type InsertMechanicTimeEntry, type MechanicRecurringSchedule, type InsertMechanicRecurringSchedule, type Customer, type InsertCustomer, mechanics, appointments, managers, mechanicAvailability, mechanicTimeEntries, mechanicRecurringSchedule, customers } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql, lte } from "drizzle-orm";

export interface IStorage {
  getManager(id: string): Promise<Manager | undefined>;
  getManagerByEmail(email: string): Promise<Manager | undefined>;
  createManager(manager: InsertManager): Promise<Manager>;
  
  getMechanic(id: string): Promise<Mechanic | undefined>;
  getMechanicByEmail(email: string): Promise<Mechanic | undefined>;
  getMechanics(): Promise<Mechanic[]>;
  getPublicMechanics(): Promise<Mechanic[]>;
  createMechanic(mechanic: InsertMechanic): Promise<Mechanic>;
  updateMechanic(id: string, data: Partial<InsertMechanic>): Promise<Mechanic | undefined>;
  deleteMechanic(id: string): Promise<boolean>;
  
  getAvailabilityByMechanic(mechanicId: string, fromDate?: string): Promise<MechanicAvailability[]>;
  getAvailableSlots(date: string): Promise<MechanicAvailability[]>;
  getAvailableSlotsWithMechanics(date: string): Promise<Array<{ timeSlot: string; mechanics: Mechanic[] }>>;
  setMechanicAvailability(availability: InsertMechanicAvailability): Promise<MechanicAvailability>;
  deleteMechanicAvailability(mechanicId: string, date: string, timeSlot: string): Promise<boolean>;
  
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByMechanic(mechanicId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  assignMechanicToAppointment(appointmentId: string, mechanicId: string): Promise<Appointment | undefined>;
  
  getCurrentTimeEntry(mechanicId: string): Promise<MechanicTimeEntry | undefined>;
  getTimeEntriesByMechanic(mechanicId: string, startDate?: Date, endDate?: Date): Promise<MechanicTimeEntry[]>;
  getAllCurrentTimeEntries(): Promise<(MechanicTimeEntry & { mechanicName: string })[]>;
  getMechanicWeeklyHours(mechanicId: string, weekStart: Date): Promise<number>;
  createTimeEntry(entry: InsertMechanicTimeEntry): Promise<MechanicTimeEntry>;
  updateTimeEntryCheckOut(id: string): Promise<MechanicTimeEntry | undefined>;
  setMechanicAvailabilityBatch(availabilities: InsertMechanicAvailability[]): Promise<MechanicAvailability[]>;
  getAvailableMechanicsForSlot(date: string, timeSlot: string): Promise<Mechanic[]>;
  
  // Recurring schedule methods
  getRecurringScheduleByMechanic(mechanicId: string): Promise<MechanicRecurringSchedule[]>;
  setRecurringScheduleBatch(mechanicId: string, schedules: InsertMechanicRecurringSchedule[]): Promise<MechanicRecurringSchedule[]>;
  deleteRecurringSchedule(mechanicId: string, dayOfWeek: number, timeSlot: string): Promise<boolean>;
  
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createOrGetCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  getAppointmentsByCustomer(customerId: string): Promise<Appointment[]>;
  
  // Appointment updates for payment tracking
  updateAppointmentPayment(id: string, data: { dateBilled?: string; dateReceived?: string; isPaid?: boolean; collector?: string; paymentMethod?: string; stripePaymentIntentId?: string; stripeChargeId?: string; paymentStatus?: string }): Promise<Appointment | undefined>;
  updateAppointmentNotes(id: string, notes: string): Promise<Appointment | undefined>;
  updateAppointmentFollowUp(id: string, followUpDate: string): Promise<Appointment | undefined>;
  getNextJobNumber(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getManager(id: string): Promise<Manager | undefined> {
    const [manager] = await db.select().from(managers).where(eq(managers.id, id));
    return manager || undefined;
  }

  async getManagerByEmail(email: string): Promise<Manager | undefined> {
    const [manager] = await db.select().from(managers).where(eq(managers.email, email));
    return manager || undefined;
  }

  async createManager(insertManager: InsertManager): Promise<Manager> {
    const [manager] = await db
      .insert(managers)
      .values(insertManager)
      .returning();
    return manager;
  }

  async getMechanic(id: string): Promise<Mechanic | undefined> {
    const [mechanic] = await db.select().from(mechanics).where(eq(mechanics.id, id));
    return mechanic || undefined;
  }

  async getMechanicByEmail(email: string): Promise<Mechanic | undefined> {
    const [mechanic] = await db.select().from(mechanics).where(eq(mechanics.email, email));
    return mechanic || undefined;
  }

  async getMechanics(): Promise<Mechanic[]> {
    return await db.select().from(mechanics);
  }

  async getPublicMechanics(): Promise<Mechanic[]> {
    return await db.select().from(mechanics).where(eq(mechanics.isPublic, true));
  }

  async createMechanic(insertMechanic: InsertMechanic): Promise<Mechanic> {
    const [mechanic] = await db
      .insert(mechanics)
      .values(insertMechanic)
      .returning();
    return mechanic;
  }

  async updateMechanic(id: string, data: Partial<InsertMechanic>): Promise<Mechanic | undefined> {
    const [mechanic] = await db
      .update(mechanics)
      .set(data)
      .where(eq(mechanics.id, id))
      .returning();
    return mechanic || undefined;
  }

  async deleteMechanic(id: string): Promise<boolean> {
    const result = await db.delete(mechanics).where(eq(mechanics.id, id));
    return true;
  }

  async getAvailabilityByMechanic(mechanicId: string, fromDate?: string): Promise<MechanicAvailability[]> {
    if (fromDate) {
      return await db.select().from(mechanicAvailability)
        .where(and(eq(mechanicAvailability.mechanicId, mechanicId), gte(mechanicAvailability.date, fromDate)));
    }
    return await db.select().from(mechanicAvailability).where(eq(mechanicAvailability.mechanicId, mechanicId));
  }

  async getAvailableSlots(date: string): Promise<MechanicAvailability[]> {
    return await db.select().from(mechanicAvailability)
      .where(and(eq(mechanicAvailability.date, date), eq(mechanicAvailability.isAvailable, true)));
  }

  async getAvailableSlotsWithMechanics(date: string): Promise<Array<{ timeSlot: string; mechanics: Mechanic[] }>> {
    // Get day of week (0=Sunday, 1=Monday, etc.)
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    
    // Get all mechanics with their recurring schedules for this day of week
    const recurringSchedules = await db.select({
      timeSlot: mechanicRecurringSchedule.timeSlot,
      mechanicId: mechanicRecurringSchedule.mechanicId,
      mechanicIdField: mechanics.id,
      mechanicName: mechanics.name,
      mechanicEmail: mechanics.email,
      mechanicPhone: mechanics.phone,
      mechanicPhotoUrl: mechanics.photoUrl,
      mechanicBio: mechanics.bio,
      mechanicOilChangeCount: mechanics.oilChangeCount,
      mechanicBackgroundCheckVerified: mechanics.backgroundCheckVerified,
      mechanicIsPublic: mechanics.isPublic,
    })
      .from(mechanicRecurringSchedule)
      .innerJoin(mechanics, eq(mechanicRecurringSchedule.mechanicId, mechanics.id))
      .where(and(
        eq(mechanicRecurringSchedule.dayOfWeek, dayOfWeek),
        eq(mechanicRecurringSchedule.isAvailable, true)
      ));
    
    // Also get specific date overrides (if any exist)
    const dateOverrides = await db.select({
      timeSlot: mechanicAvailability.timeSlot,
      mechanicId: mechanicAvailability.mechanicId,
      mechanicIdField: mechanics.id,
      mechanicName: mechanics.name,
      mechanicEmail: mechanics.email,
      mechanicPhone: mechanics.phone,
      mechanicPhotoUrl: mechanics.photoUrl,
      mechanicBio: mechanics.bio,
      mechanicOilChangeCount: mechanics.oilChangeCount,
      mechanicBackgroundCheckVerified: mechanics.backgroundCheckVerified,
      mechanicIsPublic: mechanics.isPublic,
    })
      .from(mechanicAvailability)
      .innerJoin(mechanics, eq(mechanicAvailability.mechanicId, mechanics.id))
      .where(and(eq(mechanicAvailability.date, date), eq(mechanicAvailability.isAvailable, true)));
    
    // Combine recurring schedules and date overrides
    const availabilities = [...recurringSchedules, ...dateOverrides];

    // Normalize time slot format function
    const normalizeSlot = (slot: string) => {
      const match = slot.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
      if (match) {
        const hour = match[1].padStart(2, '0');
        const minute = match[2];
        const period = match[3].toUpperCase();
        return `${hour}:${minute} ${period}`;
      }
      return slot;
    };

    // Group by normalized time slot and collect unique mechanics
    const slotMap = new Map<string, Map<string, Mechanic>>();
    
    for (const avl of availabilities) {
      const normalized = normalizeSlot(avl.timeSlot);
      if (!slotMap.has(normalized)) {
        slotMap.set(normalized, new Map());
      }
      const mechanicMap = slotMap.get(normalized)!;
      if (!mechanicMap.has(avl.mechanicId)) {
        // Build mechanic object from joined data
        const mechanic: Mechanic = {
          id: avl.mechanicIdField,
          email: avl.mechanicEmail,
          password: null, // Don't include password
          name: avl.mechanicName,
          phone: avl.mechanicPhone,
          photoUrl: avl.mechanicPhotoUrl,
          bio: avl.mechanicBio,
          oilChangeCount: avl.mechanicOilChangeCount,
          backgroundCheckVerified: avl.mechanicBackgroundCheckVerified,
          isPublic: avl.mechanicIsPublic,
        };
        mechanicMap.set(avl.mechanicId, mechanic);
      }
    }

    return Array.from(slotMap.entries()).map(([timeSlot, mechanicMap]) => ({
      timeSlot,
      mechanics: Array.from(mechanicMap.values())
    }));
  }

  async setMechanicAvailability(availability: InsertMechanicAvailability): Promise<MechanicAvailability> {
    const existing = await db.select().from(mechanicAvailability)
      .where(and(
        eq(mechanicAvailability.mechanicId, availability.mechanicId),
        eq(mechanicAvailability.date, availability.date),
        eq(mechanicAvailability.timeSlot, availability.timeSlot)
      ));
    
    if (existing.length > 0) {
      const [updated] = await db.update(mechanicAvailability)
        .set({ isAvailable: availability.isAvailable })
        .where(eq(mechanicAvailability.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(mechanicAvailability).values(availability).returning();
    return created;
  }

  async deleteMechanicAvailability(mechanicId: string, date: string, timeSlot: string): Promise<boolean> {
    await db.delete(mechanicAvailability)
      .where(and(
        eq(mechanicAvailability.mechanicId, mechanicId),
        eq(mechanicAvailability.date, date),
        eq(mechanicAvailability.timeSlot, timeSlot)
      ));
    return true;
  }

  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }

  async getAppointmentsByMechanic(mechanicId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.mechanicId, mechanicId));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async getNextJobNumber(): Promise<number> {
    const result = await db.execute(sql`SELECT nextval('job_number_seq') as next_num`);
    return parseInt(result.rows[0]?.next_num || '1');
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer || undefined;
  }

  async createOrGetCustomer(customerData: InsertCustomer): Promise<Customer> {
    // Try to find existing customer by email
    const existing = await this.getCustomerByEmail(customerData.email);
    
    if (existing) {
      // Update existing customer with new data
      const [updated] = await db
        .update(customers)
        .set({
          name: customerData.name,
          phone: customerData.phone,
          preferredContactMethod: customerData.preferredContactMethod || existing.preferredContactMethod,
          address: customerData.address || existing.address,
        })
        .where(eq(customers.id, existing.id))
        .returning();
      return updated || existing;
    }
    
    // Create new customer
    const [newCustomer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set(data)
      .where(eq(customers.id, id))
      .returning();
    return updated || undefined;
  }

  async getAppointmentsByCustomer(customerId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.customerId, customerId))
      .orderBy(desc(appointments.date));
  }

  // Appointment update methods for payment tracking
  async updateAppointmentPayment(
    id: string,
    data: { dateBilled?: string; dateReceived?: string; isPaid?: boolean; collector?: string; paymentMethod?: string; stripePaymentIntentId?: string; stripeChargeId?: string; paymentStatus?: string }
  ): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set(data)
      .where(eq(appointments.id, id))
      .returning();
    return updated || undefined;
  }

  async updateAppointmentNotes(id: string, notes: string): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ notes })
      .where(eq(appointments.id, id))
      .returning();
    return updated || undefined;
  }

  async updateAppointmentFollowUp(id: string, followUpDate: string): Promise<Appointment | undefined> {
    const [updated] = await db
      .update(appointments)
      .set({ followUpDate })
      .where(eq(appointments.id, id))
      .returning();
    return updated || undefined;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    // Get next job number if not provided
    let jobNumber = insertAppointment.jobNumber;
    if (!jobNumber) {
      jobNumber = await this.getNextJobNumber();
    }
    
    const [appointment] = await db
      .insert(appointments)
      .values({ ...insertAppointment, jobNumber })
      .returning();
    return appointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async assignMechanicToAppointment(appointmentId: string, mechanicId: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ mechanicId })
      .where(eq(appointments.id, appointmentId))
      .returning();
    return appointment || undefined;
  }

  async getCurrentTimeEntry(mechanicId: string): Promise<MechanicTimeEntry | undefined> {
    const [entry] = await db.select().from(mechanicTimeEntries)
      .where(and(
        eq(mechanicTimeEntries.mechanicId, mechanicId),
        sql`${mechanicTimeEntries.checkOutTime} IS NULL`
      ))
      .orderBy(desc(mechanicTimeEntries.checkInTime))
      .limit(1);
    return entry || undefined;
  }

  async createTimeEntry(entry: InsertMechanicTimeEntry): Promise<MechanicTimeEntry> {
    const [created] = await db.insert(mechanicTimeEntries).values(entry).returning();
    return created;
  }

  async updateTimeEntryCheckOut(id: string): Promise<MechanicTimeEntry | undefined> {
    const [updated] = await db.update(mechanicTimeEntries)
      .set({ checkOutTime: new Date() })
      .where(eq(mechanicTimeEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async setMechanicAvailabilityBatch(availabilities: InsertMechanicAvailability[]): Promise<MechanicAvailability[]> {
    const results: MechanicAvailability[] = [];
    for (const availability of availabilities) {
      const result = await this.setMechanicAvailability(availability);
      results.push(result);
    }
    return results;
  }

  async getTimeEntriesByMechanic(mechanicId: string, startDate?: Date, endDate?: Date): Promise<MechanicTimeEntry[]> {
    let query = db.select().from(mechanicTimeEntries)
      .where(eq(mechanicTimeEntries.mechanicId, mechanicId));
    
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) {
        conditions.push(gte(mechanicTimeEntries.checkInTime, startDate));
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        conditions.push(lte(mechanicTimeEntries.checkInTime, endDateTime));
      }
      query = query.where(and(eq(mechanicTimeEntries.mechanicId, mechanicId), ...conditions)) as any;
    }
    
    return await query.orderBy(desc(mechanicTimeEntries.checkInTime));
  }

  async getAllCurrentTimeEntries(): Promise<(MechanicTimeEntry & { mechanicName: string })[]> {
    const entries = await db.select({
      id: mechanicTimeEntries.id,
      mechanicId: mechanicTimeEntries.mechanicId,
      checkInTime: mechanicTimeEntries.checkInTime,
      checkOutTime: mechanicTimeEntries.checkOutTime,
      mechanicName: mechanics.name,
    })
      .from(mechanicTimeEntries)
      .innerJoin(mechanics, eq(mechanicTimeEntries.mechanicId, mechanics.id))
      .where(sql`${mechanicTimeEntries.checkOutTime} IS NULL`)
      .orderBy(desc(mechanicTimeEntries.checkInTime));
    
    return entries.map(e => ({
      id: e.id,
      mechanicId: e.mechanicId,
      checkInTime: e.checkInTime,
      checkOutTime: e.checkOutTime,
      mechanicName: e.mechanicName,
    })) as (MechanicTimeEntry & { mechanicName: string })[];
  }

  async getMechanicWeeklyHours(mechanicId: string, weekStart: Date): Promise<number> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const entries = await this.getTimeEntriesByMechanic(mechanicId, weekStart, weekEnd);
    
    let totalHours = 0;
    for (const entry of entries) {
      const checkIn = new Date(entry.checkInTime).getTime();
      const checkOut = entry.checkOutTime 
        ? new Date(entry.checkOutTime).getTime()
        : Date.now(); // If not checked out, use current time
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      totalHours += hours;
    }
    
    return Math.round(totalHours * 100) / 100; // Round to 2 decimal places
  }

  async getAvailableMechanicsForSlot(date: string, timeSlot: string): Promise<Mechanic[]> {
    // Normalize time slot format (handle both "8:00 AM" and "08:00 AM")
    const normalizeSlot = (slot: string) => {
      const match = slot.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
      if (match) {
        const hour = match[1].padStart(2, '0');
        const minute = match[2];
        const period = match[3].toUpperCase();
        return `${hour}:${minute} ${period}`;
      }
      return slot;
    };
    
    const normalizedSlot = normalizeSlot(timeSlot);
    
    // Get day of week (0=Sunday, 1=Monday, etc.)
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    
    // Get mechanics from recurring schedule
    const recurringMechanicIds = await db.select({
      mechanicId: mechanicRecurringSchedule.mechanicId,
    })
      .from(mechanicRecurringSchedule)
      .where(and(
        eq(mechanicRecurringSchedule.dayOfWeek, dayOfWeek),
        eq(mechanicRecurringSchedule.timeSlot, normalizedSlot),
        eq(mechanicRecurringSchedule.isAvailable, true)
      ));
    
    // Get mechanics from specific date overrides
    const overrideMechanicIds = await db.select({
      mechanicId: mechanicAvailability.mechanicId,
    })
      .from(mechanicAvailability)
      .where(and(
        eq(mechanicAvailability.date, date),
        eq(mechanicAvailability.timeSlot, normalizedSlot),
        eq(mechanicAvailability.isAvailable, true)
      ));
    
    // Also try the original format if different (for date overrides)
    let altMechanicIds: { mechanicId: string }[] = [];
    if (normalizedSlot !== timeSlot) {
      altMechanicIds = await db.select({
        mechanicId: mechanicAvailability.mechanicId,
      })
      .from(mechanicAvailability)
      .where(and(
        eq(mechanicAvailability.date, date),
        eq(mechanicAvailability.timeSlot, timeSlot),
        eq(mechanicAvailability.isAvailable, true)
      ));
    }
    
    // Combine and deduplicate mechanic IDs from all sources
    const uniqueIds = new Set<string>();
    for (const m of recurringMechanicIds) {
      uniqueIds.add(m.mechanicId);
    }
    for (const m of overrideMechanicIds) {
      uniqueIds.add(m.mechanicId);
    }
    for (const m of altMechanicIds) {
      uniqueIds.add(m.mechanicId);
    }
    
    if (uniqueIds.size === 0) {
      return [];
    }
    
    // Fetch full mechanic records
    const allMechanics = await db.select().from(mechanics);
    return allMechanics.filter(m => uniqueIds.has(m.id));
  }

  async getRecurringScheduleByMechanic(mechanicId: string): Promise<MechanicRecurringSchedule[]> {
    return await db.select().from(mechanicRecurringSchedule)
      .where(eq(mechanicRecurringSchedule.mechanicId, mechanicId));
  }

  async setRecurringScheduleBatch(mechanicId: string, schedules: InsertMechanicRecurringSchedule[]): Promise<MechanicRecurringSchedule[]> {
    // First, delete all existing schedules for this mechanic
    await db.delete(mechanicRecurringSchedule)
      .where(eq(mechanicRecurringSchedule.mechanicId, mechanicId));
    
    // Then insert the new schedules
    if (schedules.length === 0) {
      return [];
    }
    
    const results = await db.insert(mechanicRecurringSchedule)
      .values(schedules.map(s => ({ ...s, mechanicId })))
      .returning();
    
    return results;
  }

  async deleteRecurringSchedule(mechanicId: string, dayOfWeek: number, timeSlot: string): Promise<boolean> {
    await db.delete(mechanicRecurringSchedule)
      .where(and(
        eq(mechanicRecurringSchedule.mechanicId, mechanicId),
        eq(mechanicRecurringSchedule.dayOfWeek, dayOfWeek),
        eq(mechanicRecurringSchedule.timeSlot, timeSlot)
      ));
    return true;
  }
}

export const storage = new DatabaseStorage();
