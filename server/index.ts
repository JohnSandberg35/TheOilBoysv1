import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { sendTechnicianDayOfReminderEmail } from "./email";

const app = express();
const httpServer = createServer(app);

// Required behind Railway's reverse proxy so cookies/sessions work correctly
app.set("trust proxy", 1);

const MemoryStoreSession = MemoryStore(session);
const PgSession = connectPgSimple(session);

// Use PostgreSQL for sessions in production (shared across Railway instances).
// MemoryStore in dev (in-memory, fine for single local process).
const sessionStore =
  process.env.NODE_ENV === "production"
    ? new (PgSession as any)({ pool, createTableIfMissing: true })
    : new MemoryStoreSession({ checkPeriod: 86400000 });

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    managerId?: string;
    managerEmail?: string;
    managerName?: string;
    mechanicId?: string;
    mechanicEmail?: string;
    mechanicName?: string;
  }
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "theoilboys-session-secret-2026",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function sendDayOfReminders() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    log(`Checking for appointments on ${todayStr} to send reminder emails...`, "reminder-job");
    
    // Get all appointments for today
    const allAppointments = await storage.getAppointments();
    const todayAppointments = allAppointments.filter(apt => 
      apt.date === todayStr && 
      apt.status === 'scheduled'
    );
    
    if (todayAppointments.length === 0) {
      log(`No appointments found for ${todayStr}`, "reminder-job");
      return;
    }
    
    log(`Found ${todayAppointments.length} appointment(s) for today`, "reminder-job");
    
    // Import email functions
    const { sendTechnicianDayOfReminderEmail, sendCustomerDayOfReminderEmail } = await import('./email');
    
    // Send reminder emails to technicians and customers
    for (const appointment of todayAppointments) {
      // Send reminder to technician if assigned
      if (appointment.mechanicId) {
        const technician = await storage.getMechanic(appointment.mechanicId);
        if (technician && technician.email) {
          log(`Sending reminder to technician ${technician.name} (${technician.email}) for appointment with ${appointment.customerName}`, "reminder-job");
          
          await sendTechnicianDayOfReminderEmail({
            mechanicName: technician.name,
            mechanicEmail: technician.email,
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
          }).catch(err => {
            log(`❌ Failed to send technician reminder for appointment ${appointment.id}: ${err}`, "reminder-job");
          });
        } else {
          log(`⚠️ Skipping technician reminder for appointment ${appointment.id} - technician has no email`, "reminder-job");
        }
      }
      
      // Send reminder to customer
      log(`Sending reminder to customer ${appointment.customerName} (${appointment.customerEmail})`, "reminder-job");
      
      await sendCustomerDayOfReminderEmail({
        customerName: appointment.customerName,
        customerEmail: appointment.customerEmail,
        vehicleYear: appointment.vehicleYear,
        vehicleMake: appointment.vehicleMake,
        vehicleModel: appointment.vehicleModel,
        serviceType: appointment.serviceType,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        address: appointment.address,
        appointmentId: appointment.id,
      }).catch(err => {
        log(`❌ Failed to send customer reminder for appointment ${appointment.id}: ${err}`, "reminder-job");
      });
    }
    
    log(`✅ Reminder email job completed`, "reminder-job");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("does not exist") || msg.includes("relation")) {
      log(`⚠️ Reminder job skipped: database schema may not be initialized yet. Run init-railway-db if needed.`, "reminder-job");
    } else {
      log(`❌ Error in reminder job: ${msg}`, "reminder-job");
    }
  }
}

function setupDailyReminderJob() {
  // Send reminders immediately if it's after 8 AM, otherwise wait until 8 AM
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Calculate milliseconds until 8 AM (or next 8 AM if before 8 AM)
  let msUntil8AM = 0;
  if (hours < 8 || (hours === 8 && minutes === 0)) {
    // Before 8 AM, wait until 8 AM today
    const target = new Date();
    target.setHours(8, 0, 0, 0);
    msUntil8AM = target.getTime() - now.getTime();
  } else {
    // After 8 AM, wait until 8 AM tomorrow
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(8, 0, 0, 0);
    msUntil8AM = target.getTime() - now.getTime();
  }
  
  log(`Daily reminder job scheduled. First run in ${Math.round(msUntil8AM / 60000)} minutes (at 8:00 AM)`, "reminder-job");
  
  // Send first reminder at 8 AM (or immediately if already past 8 AM today and we haven't run yet)
  setTimeout(() => {
    sendDayOfReminders();
    // Then run every 24 hours
    setInterval(sendDayOfReminders, 24 * 60 * 60 * 1000);
  }, msUntil8AM);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);
  
  // Log email configuration on startup
  console.log('\n📧 Email Configuration:');
  if (process.env.RESEND_API_KEY) {
    const keyPreview = process.env.RESEND_API_KEY.length > 10 
      ? process.env.RESEND_API_KEY.substring(0, 10) + '...' 
      : '***';
    console.log('  ✅ RESEND_API_KEY: Set (' + keyPreview + ')');
    console.log('  📨 From: The Oil Boys <bookings@theoilboys.org>');
    console.log('  📬 To: theoilboysllc@gmail.com');
  } else {
    console.log('  ❌ RESEND_API_KEY: NOT SET');
    console.log('  ⚠️  Emails will NOT be sent. Add RESEND_API_KEY to .env file.');
  }
  console.log('');

  // Setup daily reminder email job (runs once per day at 7 AM)
  setupDailyReminderJob();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  httpServer.listen(
    {
      port,
      host,
      reusePort: process.env.NODE_ENV === "production",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
