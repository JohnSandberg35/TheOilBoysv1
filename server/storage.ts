import { type Mechanic, type InsertMechanic, type Appointment, type InsertAppointment, type Manager, type InsertManager, type MechanicAvailability, type InsertMechanicAvailability, type MechanicTimeEntry, type InsertMechanicTimeEntry, mechanics, appointments, managers, mechanicAvailability, mechanicTimeEntries } from "@shared/schema";
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
    // Get all available slots for the date with mechanic info in one query
    const availabilities = await db.select({
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

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
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
    
    // Get mechanics available for this slot
    const mechanicIds = await db.select({
      mechanicId: mechanicAvailability.mechanicId,
    })
      .from(mechanicAvailability)
      .where(and(
        eq(mechanicAvailability.date, date),
        eq(mechanicAvailability.timeSlot, normalizedSlot),
        eq(mechanicAvailability.isAvailable, true)
      ));
    
    // Also try the original format if different
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
    
    // Get unique mechanic IDs
    const uniqueIds = new Set([
      ...mechanicIds.map(m => m.mechanicId),
      ...altMechanicIds.map(m => m.mechanicId)
    ]);
    
    if (uniqueIds.size === 0) {
      return [];
    }
    
    // Fetch full mechanic records
    const allMechanics = await db.select().from(mechanics);
    return allMechanics.filter(m => uniqueIds.has(m.id));
  }
}

export const storage = new DatabaseStorage();
