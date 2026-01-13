import { type Mechanic, type InsertMechanic, type Appointment, type InsertAppointment, type Manager, type InsertManager, mechanics, appointments, managers } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getManager(id: string): Promise<Manager | undefined>;
  getManagerByEmail(email: string): Promise<Manager | undefined>;
  createManager(manager: InsertManager): Promise<Manager>;
  
  getMechanic(id: string): Promise<Mechanic | undefined>;
  getMechanics(): Promise<Mechanic[]>;
  getPublicMechanics(): Promise<Mechanic[]>;
  createMechanic(mechanic: InsertMechanic): Promise<Mechanic>;
  updateMechanic(id: string, data: Partial<InsertMechanic>): Promise<Mechanic | undefined>;
  deleteMechanic(id: string): Promise<boolean>;
  
  getAppointments(): Promise<Appointment[]>;
  getAppointmentsByMechanic(mechanicId: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(id: string, status: string): Promise<Appointment | undefined>;
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
