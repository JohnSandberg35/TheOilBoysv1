import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { storage } from "./storage";
import { insertAppointmentSchema, insertMechanicSchema, insertMechanicAvailabilitySchema } from "@shared/schema";
import { z } from "zod";
import { sendBookingConfirmation } from "./email";
import { createPaymentIntent, confirmPaymentIntent } from "./stripe";
import { createManagerToken, verifyManagerToken } from "./managerAuth";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  // ignore
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext.toLowerCase()) ? ext : ".jpg";
      const name = `tech-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
  },
});

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

// Populate req.managerFromToken when Bearer token is valid (before requireManagerAuth)
function parseManagerToken(req: Request, _res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const payload = verifyManagerToken(auth.slice(7));
    if (payload) (req as any).managerFromToken = payload;
  }
  next();
}

function requireManagerAuth(req: Request, res: Response, next: NextFunction) {
  const fromToken = (req as any).managerFromToken;
  if (fromToken) return next(); // Token valid, don't touch req.session
  if (req.session?.managerId) return next();
  return res.status(401).json({ error: "Unauthorized" });
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

  app.use("/uploads", express.static(UPLOADS_DIR));
  app.use(parseManagerToken);

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

      // Force session save (helps with some session stores)
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      // Bearer token - works when cookies fail (Railway, custom domains)
      const token = createManagerToken(manager.id, manager.email, manager.name);
      
      res.json({ 
        id: manager.id, 
        email: manager.email, 
        name: manager.name,
        token,
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

  app.post("/api/upload/technician-photo", requireManagerAuth, (req: Request, res: Response) => {
    upload.single("photo")(req, res, (err: unknown) => {
      if (err) {
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Image must be under 5 MB" });
        }
        return res.status(400).json({
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No photo file provided" });
      }
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  });

  app.get("/api/manager/session", (req, res) => {
    const fromToken = (req as any).managerFromToken;
    if (fromToken) {
      return res.json({ id: fromToken.managerId, email: fromToken.email, name: fromToken.name });
    }
    if (req.session?.managerId) {
      return res.json({
        id: req.session.managerId,
        email: req.session.managerEmail,
        name: req.session.managerName,
      });
    }
    res.status(401).json({ error: "Not authenticated" });
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

  // Manager: Get recurring schedule for a specific technician
  app.get("/api/manager/technicians/:id/recurring-schedule", requireManagerAuth, async (req, res) => {
    try {
      const { id: mechanicId } = req.params;
      const schedule = await storage.getRecurringScheduleByMechanic(mechanicId);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Manager: Set recurring schedule for a specific technician
  app.post("/api/manager/technicians/:id/recurring-schedule", requireManagerAuth, async (req, res) => {
    try {
      const { id: mechanicId } = req.params;
      const { schedules } = req.body;

      if (!Array.isArray(schedules)) {
        return res.status(400).json({ error: "schedules must be an array" });
      }

      for (const schedule of schedules) {
        if (typeof schedule.dayOfWeek !== "number" || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
          return res.status(400).json({ error: "dayOfWeek must be 0-6" });
        }
        if (!schedule.timeSlot || typeof schedule.timeSlot !== "string") {
          return res.status(400).json({ error: "timeSlot is required" });
        }
        if (typeof schedule.isAvailable !== "boolean") {
          return res.status(400).json({ error: "isAvailable must be boolean" });
        }
      }

      const result = await storage.setRecurringScheduleBatch(mechanicId, schedules);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get recurring schedule for logged-in mechanic
  app.get("/api/mechanic/recurring-schedule", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const schedule = await storage.getRecurringScheduleByMechanic(mechanicId);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Set recurring schedule for logged-in mechanic
  app.post("/api/mechanic/recurring-schedule", requireMechanicAuth, async (req, res) => {
    try {
      const mechanicId = req.session.mechanicId!;
      const { schedules } = req.body;
      
      if (!Array.isArray(schedules)) {
        return res.status(400).json({ error: "schedules must be an array" });
      }
      
      // Validate each schedule entry
      for (const schedule of schedules) {
        if (typeof schedule.dayOfWeek !== 'number' || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
          return res.status(400).json({ error: "dayOfWeek must be 0-6" });
        }
        if (!schedule.timeSlot || typeof schedule.timeSlot !== 'string') {
          return res.status(400).json({ error: "timeSlot is required" });
        }
        if (typeof schedule.isAvailable !== 'boolean') {
          return res.status(400).json({ error: "isAvailable must be boolean" });
        }
      }
      
      const result = await storage.setRecurringScheduleBatch(mechanicId, schedules);
      res.json(result);
    } catch (error) {
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
      // Hash password if provided
      if (validatedData.password) {
        validatedData.password = hashPassword(validatedData.password);
      }
      const mechanic = await storage.createMechanic(validatedData);
      res.status(201).json(sanitizeMechanic(mechanic, true));
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const msg = error.errors.map((e) => e.message).join("; ");
        return res.status(400).json({ error: msg || "Validation failed" });
      }
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        return res.status(400).json({ error: "A technician with this email already exists" });
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

  // Get single appointment - PUBLIC (for cancellation page)
  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      console.log('📝 Creating appointment with data:', JSON.stringify(req.body, null, 2));
      const validatedData = insertAppointmentSchema.parse(req.body);
      console.log('✅ Data validated successfully');
      
      // Link to customer (create or get existing)
      const customer = await storage.createOrGetCustomer({
        name: validatedData.customerName,
        email: validatedData.customerEmail,
        phone: validatedData.customerPhone,
        preferredContactMethod: validatedData.preferredContactMethod || undefined,
        address: validatedData.address,
      });
      
      // Get vehicle number for this customer (count existing appointments + 1)
      const customerAppointments = await storage.getAppointmentsByCustomer(customer.id);
      const vehicleNumber = customerAppointments.length + 1;
      
      // Calculate follow-up date (6 months from service date)
      const serviceDate = new Date(validatedData.date);
      const followUpDate = new Date(serviceDate);
      followUpDate.setMonth(followUpDate.getMonth() + 6);
      const followUpDateStr = followUpDate.toISOString().split('T')[0];
      
      const appointment = await storage.createAppointment({
        ...validatedData,
        customerId: customer.id,
        vehicleNumber,
        followUpDate: followUpDateStr,
      });
      console.log('✅ Appointment created with ID:', appointment.id, 'Job #:', appointment.jobNumber);
      
      // Send confirmation emails (don't block the response)
      console.log('📧 About to send booking confirmation email for appointment:', appointment.id);
      sendBookingConfirmation({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone,
        preferredContactMethod: appointment.preferredContactMethod || undefined,
        vehicleYear: appointment.vehicleYear,
        vehicleMake: appointment.vehicleMake,
        vehicleModel: appointment.vehicleModel,
        licensePlate: appointment.licensePlate || undefined,
        serviceType: appointment.serviceType,
        price: appointment.price,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        address: appointment.address,
        appointmentId: appointment.id,
      })
        .then(result => {
          if (result.success) {
            if (result.skipped) {
              console.warn('⚠️ Email sending skipped - RESEND_API_KEY not configured');
            } else {
              console.log('✅ Booking confirmation emails sent successfully');
            }
          } else {
            console.error('❌ Failed to send booking confirmation emails:', result.error);
          }
        })
        .catch(err => {
          console.error('❌ Email send failed with error:', err);
        });
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ error: error.message });
      }
      console.error('Unknown error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update appointment status - PROTECTED
  app.patch("/api/appointments/:id/status", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const statusSchema = z.object({ 
        status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']) 
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

  // Cancel appointment - PUBLIC (customers can cancel)
  app.post("/api/appointments/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      if (appointment.status === 'cancelled') {
        return res.status(400).json({ error: "Appointment is already cancelled" });
      }

      // Check if cancellation is at least 2 hours before appointment
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes, period] = appointment.timeSlot.match(/(\d+):(\d+)\s(AM|PM)/i)?.slice(1) || [];
      if (!hours || !minutes || !period) {
        return res.status(400).json({ error: "Invalid time slot format" });
      }

      let appointmentHour = parseInt(hours);
      const appointmentMinute = parseInt(minutes);
      if (period.toUpperCase() === 'PM' && appointmentHour !== 12) {
        appointmentHour += 12;
      } else if (period.toUpperCase() === 'AM' && appointmentHour === 12) {
        appointmentHour = 0;
      }

      appointmentDate.setHours(appointmentHour, appointmentMinute, 0, 0);
      
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours in milliseconds

      if (appointmentDate < twoHoursFromNow) {
        return res.status(400).json({ 
          error: "Cancellations must be made at least 2 hours before the appointment time" 
        });
      }

      // Update appointment status to cancelled
      const updatedAppointment = await storage.updateAppointmentStatus(id, 'cancelled');
      if (!updatedAppointment) {
        return res.status(500).json({ error: "Failed to cancel appointment" });
      }

      // Send cancellation email to business
      const { sendCancellationEmail } = await import('./email');
      sendCancellationEmail({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        customerPhone: appointment.customerPhone || undefined,
        vehicleYear: appointment.vehicleYear,
        vehicleMake: appointment.vehicleMake,
        vehicleModel: appointment.vehicleModel,
        licensePlate: appointment.licensePlate || undefined,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        address: appointment.address,
        serviceType: appointment.serviceType,
        price: appointment.price,
      })
        .then(result => {
          if (result.success) {
            console.log('✅ Cancellation email sent successfully');
          } else {
            console.error('❌ Failed to send cancellation email:', result.error);
          }
        })
        .catch(err => {
          console.error('❌ Email send failed with error:', err);
        });

      res.json({ success: true, appointment: updatedAppointment });
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
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
      
      // Send email notification to the assigned mechanic
      const mechanic = await storage.getMechanic(validated.mechanicId);
      if (!mechanic) {
        console.warn(`⚠️ Mechanic with ID ${validated.mechanicId} not found when trying to send assignment email`);
      } else if (!mechanic.email) {
        console.warn(`⚠️ Mechanic "${mechanic.name}" (ID: ${mechanic.id}) does not have an email address. Cannot send assignment notification.`);
      } else {
        console.log(`📧 Sending assignment email to mechanic "${mechanic.name}" at ${mechanic.email}`);
        const { sendMechanicAssignmentEmail } = await import('./email');
        sendMechanicAssignmentEmail({
          mechanicName: mechanic.name,
          mechanicEmail: mechanic.email,
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone || undefined,
          preferredContactMethod: appointment.preferredContactMethod || undefined,
          vehicleYear: appointment.vehicleYear,
          vehicleMake: appointment.vehicleMake,
          vehicleModel: appointment.vehicleModel,
          licensePlate: appointment.licensePlate || undefined,
          serviceType: appointment.serviceType,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          address: appointment.address,
        })
          .then(result => {
            if (result.success) {
              if (result.skipped) {
                console.warn('⚠️ Assignment email skipped - RESEND_API_KEY not configured');
              } else {
                console.log('✅ Mechanic assignment email sent successfully');
              }
            } else {
              console.error('❌ Failed to send mechanic assignment email:', result.error);
            }
          })
          .catch(err => {
            console.error('❌ Mechanic assignment email failed with exception:', err);
          });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Email diagnostics endpoint (for debugging)
  app.get("/api/email/diagnostics", async (req, res) => {
    try {
      const hasApiKey = !!process.env.RESEND_API_KEY;
      const apiKeyPreview = hasApiKey 
        ? (process.env.RESEND_API_KEY!.length > 10 
            ? process.env.RESEND_API_KEY!.substring(0, 10) + '...' 
            : '***')
        : 'NOT SET';
      
      res.json({
        hasApiKey,
        apiKeyPreview,
        fromEmail: 'The Oil Boys <bookings@theoilboys.org>',
        businessEmail: 'theoilboysllc@gmail.com',
        message: hasApiKey 
          ? '✅ RESEND_API_KEY is set. If emails still fail, check domain verification in Resend.'
          : '❌ RESEND_API_KEY is not set. Add it to your .env file or environment variables.'
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Customer management endpoints - PROTECTED
  app.get("/api/customers", requireManagerAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/customers/:id", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      const appointments = await storage.getAppointmentsByCustomer(id);
      res.json({ ...customer, appointments });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/customers/:id", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, preferredContactMethod, address, notes } = req.body;
      const customer = await storage.updateCustomer(id, {
        name,
        email,
        phone,
        preferredContactMethod,
        address,
        notes,
      });
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment tracking endpoints - PROTECTED
  app.patch("/api/appointments/:id/payment", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { dateBilled, dateReceived, isPaid, collector, paymentMethod } = req.body;
      const appointment = await storage.updateAppointmentPayment(id, {
        dateBilled,
        dateReceived,
        isPaid,
        collector,
        paymentMethod,
      });
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/appointments/:id/notes", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const appointment = await storage.updateAppointmentNotes(id, notes || '');
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/appointments/:id/follow-up", requireManagerAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { followUpDate } = req.body;
      const appointment = await storage.updateAppointmentFollowUp(id, followUpDate);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Payment endpoints
  // Create payment intent (before creating appointment)
  app.post("/api/payments/create-intent", async (req, res) => {
    try {
      const { amount, appointmentData } = req.body;
      
      if (!amount || !appointmentData) {
        return res.status(400).json({ error: "Amount and appointment data are required" });
      }

      // Validate appointment data
      const validatedData = insertAppointmentSchema.parse(appointmentData);
      
      // Create or get customer
      const customer = await storage.createOrGetCustomer({
        name: validatedData.customerName,
        email: validatedData.customerEmail,
        phone: validatedData.customerPhone,
        preferredContactMethod: validatedData.preferredContactMethod || undefined,
        address: validatedData.address,
      });

      // Create temporary appointment to get an ID for the payment intent
      // We'll update it after payment succeeds
      const tempAppointment = await storage.createAppointment({
        ...validatedData,
        customerId: customer.id,
        vehicleNumber: (await storage.getAppointmentsByCustomer(customer.id)).length + 1,
        followUpDate: (() => {
          const serviceDate = new Date(validatedData.date);
          const followUpDate = new Date(serviceDate);
          followUpDate.setMonth(followUpDate.getMonth() + 6);
          return followUpDate.toISOString().split('T')[0];
        })(),
        paymentStatus: 'pending',
      });

      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        amount: amount * 100, // Convert dollars to cents
        appointmentId: tempAppointment.id,
        customerEmail: validatedData.customerEmail,
        customerName: validatedData.customerName,
      });

      // Update appointment with payment intent ID
      await storage.updateAppointmentPayment(tempAppointment.id, {
        stripePaymentIntentId: paymentIntentId,
      });

      res.json({
        clientSecret,
        appointmentId: tempAppointment.id,
        paymentIntentId,
      });
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Confirm payment and finalize appointment
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      const { paymentIntentId, appointmentId } = req.body;

      if (!paymentIntentId || !appointmentId) {
        return res.status(400).json({ error: "Payment intent ID and appointment ID are required" });
      }

      // Confirm payment with Stripe
      const paymentResult = await confirmPaymentIntent(paymentIntentId);

      if (!paymentResult.success) {
        return res.status(400).json({ 
          error: "Payment not completed", 
          status: paymentResult.status 
        });
      }

      // Update appointment with payment details
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      await storage.updateAppointmentPayment(appointmentId, {
        isPaid: true,
        paymentMethod: 'Stripe',
        paymentStatus: 'paid',
        stripeChargeId: paymentResult.chargeId,
        dateReceived: new Date().toISOString().split('T')[0],
        dateBilled: new Date().toISOString().split('T')[0],
      });

      const updatedAppointment = await storage.getAppointment(appointmentId);
      console.log('✅ Appointment updated with payment:', updatedAppointment?.id);

      // Send confirmation emails
      console.log('📧 Sending booking confirmation email...');
      sendBookingConfirmation({
        customerName: updatedAppointment!.customerName,
        customerEmail: updatedAppointment!.customerEmail,
        customerPhone: updatedAppointment!.customerPhone,
        preferredContactMethod: updatedAppointment!.preferredContactMethod || undefined,
        vehicleYear: updatedAppointment!.vehicleYear,
        vehicleMake: updatedAppointment!.vehicleMake,
        vehicleModel: updatedAppointment!.vehicleModel,
        licensePlate: updatedAppointment!.licensePlate || undefined,
        serviceType: updatedAppointment!.serviceType,
        price: updatedAppointment!.price,
        date: updatedAppointment!.date,
        timeSlot: updatedAppointment!.timeSlot,
        address: updatedAppointment!.address,
        appointmentId: updatedAppointment!.id,
      })
        .then(result => {
          if (result.success && !result.skipped) {
            console.log('✅ Booking confirmation emails sent successfully');
          }
        })
        .catch(err => {
          console.error('❌ Email send failed:', err);
        });

      console.log('✅ Payment confirmation complete, returning appointment');
      res.json({
        success: true,
        appointment: updatedAppointment,
      });
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
