import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertMechanicSchema, insertMechanicAvailabilitySchema } from "@shared/schema";
import { z } from "zod";
import { sendBookingConfirmation, sendCompletionEmail } from "./email";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function sanitizeMechanic<T extends { password?: string | null; email?: string | null }>(mechanic: T, includeEmail = false): Omit<T, 'password'> {
  const { password, ...rest } = mechanic;
  if (!includeEmail) {
    const { email, ...withoutEmail } = rest as any;
    return withoutEmail;
  }
  return rest;
}

function sanitizeMechanics<T extends { password?: string | null; email?: string | null }>(mechanics: T[], includeEmail = false): Omit<T, 'password'>[] {
  return mechanics.map(m => sanitizeMechanic(m, includeEmail));
}

function requireManagerAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.managerId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireMechanicAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.mechanicId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireAnyAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.managerId && !req.session?.mechanicId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const updateMechanicSchema = insertMechanicSchema.partial();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Manager login
  app.post("/api/manager/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const manager = await storage.getManagerByEmail(email);
      const hashedPassword = hashPassword(password);
      
      if (!manager || manager.password !== hashedPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.managerId = manager.id;
      req.session.managerEmail = manager.email;
      req.session.managerName = manager.name;
      
      res.json({ 
        id: manager.id, 
        email: manager.email, 
        name: manager.name 
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/manager/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/manager/session", (req, res) => {
    if (req.session?.managerId) {
      res.json({
        id: req.session.managerId,
        email: req.session.managerEmail,
        name: req.session.managerName,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Mechanic login
  app.post("/api/mechanic/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const mechanic = await storage.getMechanicByEmail(email);
      const hashedPassword = hashPassword(password);
      
      if (!mechanic || !mechanic.password || mechanic.password !== hashedPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      req.session.mechanicId = mechanic.id;
      req.session.mechanicEmail = mechanic.email || undefined;
      req.session.mechanicName = mechanic.name;
      
      res.json({ 
        id: mechanic.id, 
        email: mechanic.email, 
        name: mechanic.name 
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mechanic/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/mechanic/session", (req, res) => {
    if (req.session?.mechanicId) {
      res.json({
        id: req.session.mechanicId,
        email: req.session.mechanicEmail,
        name: req.session.mechanicName,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Mechanic availability routes
  app.get("/api/mechanic/availability", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const fromDate = req.query.fromDate as string | undefined;
      const availability = await storage.getAvailabilityByMechanic(mechanicId, fromDate);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mechanic/availability", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const validatedData = insertMechanicAvailabilitySchema.parse({
        ...req.body,
        mechanicId
      });
      const availability = await storage.setMechanicAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mechanic/availability/batch", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const availabilities = req.body.availabilities;
      if (!Array.isArray(availabilities)) {
        return res.status(400).json({ error: "availabilities must be an array" });
      }
      const validatedData = availabilities.map((a: any) => 
        insertMechanicAvailabilitySchema.parse({ ...a, mechanicId })
      );
      const results = await storage.setMechanicAvailabilityBatch(validatedData);
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/mechanic/availability", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const { date, timeSlot } = req.body;
      await storage.deleteMechanicAvailability(mechanicId, date, timeSlot);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mechanic jobs routes
  app.get("/api/mechanic/jobs", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const appointments = await storage.getAppointmentsByMechanic(mechanicId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/mechanic/jobs/:id/complete", requireMechanicAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const mechanicId = req.session.mechanicId!;
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      if (appointment.mechanicId !== mechanicId) {
        return res.status(403).json({ error: "Not authorized to complete this job" });
      }
      
      const updated = await storage.updateAppointmentStatus(id, "completed");
      
      if (updated) {
        const mechanic = await storage.getMechanic(mechanicId);
        sendCompletionEmail({
          customerName: updated.customerName,
          customerEmail: updated.customerEmail,
          vehicleYear: updated.vehicleYear,
          vehicleMake: updated.vehicleMake,
          vehicleModel: updated.vehicleModel,
          serviceType: updated.serviceType,
          mechanicName: mechanic?.name,
        }).catch(err => console.error('Completion email failed:', err));
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Public endpoint to get available time slots for a date with mechanics
  app.get("/api/availability/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const slotsWithMechanics = await storage.getAvailableSlotsWithMechanics(date);
      
      // Format response to only include id and name for mechanics
      const result = slotsWithMechanics.map(slot => ({
        timeSlot: slot.timeSlot,
        mechanics: slot.mechanics.map(m => ({
          id: m.id,
          name: m.name
        }))
      }));
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get available mechanics for a specific date and time slot
  app.get("/api/availability/:date/:timeSlot/mechanics", async (req, res) => {
    try {
      const { date, timeSlot } = req.params;
      const mechanics = await storage.getAvailableMechanicsForSlot(date, decodeURIComponent(timeSlot));
      res.json(mechanics.map(m => ({ id: m.id, name: m.name })));
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Time tracking routes
  app.get("/api/mechanic/time-entry/current", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const entry = await storage.getCurrentTimeEntry(mechanicId);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mechanic/time-entry/check-in", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      // Check if there's an active time entry
      const existing = await storage.getCurrentTimeEntry(mechanicId);
      if (existing) {
        return res.status(400).json({ error: "Already checked in" });
      }
      const entry = await storage.createTimeEntry({ mechanicId, checkInTime: new Date() });
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/mechanic/time-entry/check-out", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const entry = await storage.getCurrentTimeEntry(mechanicId);
      if (!entry) {
        return res.status(400).json({ error: "Not checked in" });
      }
      const updated = await storage.updateTimeEntryCheckOut(entry.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get time entries for a mechanic (weekly view)
  app.get("/api/mechanic/time-entries", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const weekStart = req.query.weekStart as string | undefined;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (weekStart) {
        startDate = new Date(weekStart);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      }
      
      const entries = await storage.getTimeEntriesByMechanic(mechanicId, startDate, endDate);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get weekly hours for a mechanic
  app.get("/api/mechanic/weekly-hours", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const weekStart = req.query.weekStart as string;
      if (!weekStart) {
        return res.status(400).json({ error: "weekStart parameter required" });
      }
      const hours = await storage.getMechanicWeeklyHours(mechanicId, new Date(weekStart));
      res.json({ hours });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all employees' current clock status (manager only)
  app.get("/api/manager/employee-time-tracking", requireManagerAuth, async (req, res) => {
    try {
      const currentEntries = await storage.getAllCurrentTimeEntries();
      
      // Get all mechanics with their weekly hours
      const mechanics = await storage.getMechanics();
      const weekStart = req.query.weekStart as string | undefined;
      
      const employees = await Promise.all(mechanics.map(async (mechanic) => {
        const currentEntry = currentEntries.find(e => e.mechanicId === mechanic.id);
        let weeklyHours = 0;
        
        if (weekStart) {
          weeklyHours = await storage.getMechanicWeeklyHours(mechanic.id, new Date(weekStart));
        }
        
        return {
          ...mechanic,
          isClockedIn: !!currentEntry,
          currentCheckInTime: currentEntry?.checkInTime || null,
          weeklyHours,
        };
      }));
      
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get public mechanics (for landing page) - no email/password
  app.get("/api/mechanics/public", async (req, res) => {
    try {
      const mechanics = await storage.getPublicMechanics();
      res.json(sanitizeMechanics(mechanics, false));
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all mechanics (for manager dashboard) - PROTECTED - includes email for management
  app.get("/api/mechanics", requireManagerAuth, async (req, res) => {
    try {
      const mechanics = await storage.getMechanics();
      res.json(sanitizeMechanics(mechanics, true));
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create mechanic - PROTECTED
  app.post("/api/mechanics", requireManagerAuth, async (req, res) => {
    try {
      const validatedData = insertMechanicSchema.parse(req.body);
      const mechanic = await storage.createMechanic(validatedData);
      res.status(201).json(sanitizeMechanic(mechanic, true));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update mechanic - PROTECTED with validation
  app.patch("/api/mechanics/:id", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateMechanicSchema.parse(req.body);
      const mechanic = await storage.updateMechanic(id, validatedData);
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }
      res.json(sanitizeMechanic(mechanic, true));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete mechanic - PROTECTED
  app.delete("/api/mechanics/:id", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMechanic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all appointments - PROTECTED
  app.get("/api/appointments", requireManagerAuth, async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      
      // Send confirmation emails (don't block the response)
      sendBookingConfirmation({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        vehicleYear: appointment.vehicleYear,
        vehicleMake: appointment.vehicleMake,
        vehicleModel: appointment.vehicleModel,
        licensePlate: appointment.licensePlate || undefined,
        serviceType: appointment.serviceType,
        price: appointment.price,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        address: appointment.address,
      }).catch(err => console.error('Email send failed:', err));
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update appointment status - PROTECTED
  app.patch("/api/appointments/:id/status", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const statusSchema = z.object({ 
        status: z.enum(['scheduled', 'in-progress', 'completed']) 
      });
      const validated = statusSchema.parse({ status });
      
      const appointment = await storage.updateAppointmentStatus(id, validated.status);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Assign mechanic to appointment - PROTECTED
  app.patch("/api/appointments/:id/assign", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { mechanicId } = req.body;
      
      const assignSchema = z.object({ mechanicId: z.string() });
      const validated = assignSchema.parse({ mechanicId });
      
      const appointment = await storage.assignMechanicToAppointment(id, validated.mechanicId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
