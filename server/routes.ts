import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAppointmentSchema, insertMechanicSchema } from "@shared/schema";
import { z } from "zod";
import { sendBookingConfirmation } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Manager login
  app.post("/api/manager/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const manager = await storage.getManagerByEmail(email);
      if (!manager || manager.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      res.json({ 
        id: manager.id, 
        email: manager.email, 
        name: manager.name 
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get public mechanics (for landing page)
  app.get("/api/mechanics/public", async (req, res) => {
    try {
      const mechanics = await storage.getPublicMechanics();
      res.json(mechanics);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all mechanics (for manager dashboard)
  app.get("/api/mechanics", async (req, res) => {
    try {
      const mechanics = await storage.getMechanics();
      res.json(mechanics);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create mechanic
  app.post("/api/mechanics", async (req, res) => {
    try {
      const validatedData = insertMechanicSchema.parse(req.body);
      const mechanic = await storage.createMechanic(validatedData);
      res.status(201).json(mechanic);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update mechanic
  app.patch("/api/mechanics/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const mechanic = await storage.updateMechanic(id, req.body);
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }
      res.json(mechanic);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete mechanic
  app.delete("/api/mechanics/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMechanic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all appointments
  app.get("/api/appointments", async (req, res) => {
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

  // Update appointment status
  app.patch("/api/appointments/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const appointment = await storage.updateAppointmentStatus(id, status);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}
