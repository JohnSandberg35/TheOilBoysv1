import { type Mechanic, type InsertMechanic, type Appointment, type InsertAppointment, mechanics, appointments } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getMechanic(id: string): Promise<Mechanic | undefined>;
  getMechanicByEmail(email: string): Promise<Mechanic | undefined>;
  createMechanic(mechanic: InsertMechanic): Promise<Mechanic>;
  
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByMechanic(mechanicId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getMechanic(id: string): Promise<Mechanic | undefined> {
    const [mechanic] = await db.select().from(mechanics).where(eq(mechanics.id, id));
    return mechanic || undefined;
  }

  async getMechanicByEmail(email: string): Promise<Mechanic | undefined> {
    const [mechanic] = await db.select().from(mechanics).where(eq(mechanics.email, email));
    return mechanic || undefined;
  }

  async createMechanic(insertMechanic: InsertMechanic): Promise<Mechanic> {
    const [mechanic] = await db
      .insert(mechanics)
      .values(insertMechanic)
      .returning();
    return mechanic;
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
}

export const storage = new DatabaseStorage();
