import { type Mechanic, type InsertMechanic, type Appointment, type InsertAppointment, type Manager, type InsertManager, type MechanicAvailability, type InsertMechanicAvailability, mechanics, appointments, managers, mechanicAvailability } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte } from "drizzle-orm";

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
  setMechanicAvailability(availability: InsertMechanicAvailability): Promise<MechanicAvailability>;
  deleteMechanicAvailability(mechanicId: string, date: string, timeSlot: string): Promise<boolean>;
  
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByMechanic(mechanicId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
  assignMechanicToAppointment(appointmentId: string, mechanicId: string): Promise<Appointment | undefined>;
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
}

export const storage = new DatabaseStorage();
