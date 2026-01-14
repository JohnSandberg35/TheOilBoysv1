# The Oil Boys - Mobile Oil Change Booking Platform

## Overview
A comprehensive web application for "The Oil Boys," a mobile oil change business serving Utah County. The platform enables customers to schedule oil changes at their location, provides a manager dashboard to oversee operations, and includes a technician portal for mechanics to manage their availability and jobs.

## Current State
- Full-stack application with React frontend and Node.js/Express backend
- PostgreSQL database for data persistence
- Customer booking flow with 3-step wizard
- Manager dashboard with secure session-based authentication
- Technician portal for mechanics (availability scheduling, job management)
- "Meet Our Mechanics" public section displaying team profiles
- Black & white branding with classic automotive aesthetic
- Job completion triggers email notification to customer

## Recent Changes
- **2026-01-14**: Unified team portal at /manage - both managers and technicians login from same page
- **2026-01-14**: Technicians see availability scheduler and job management after login
- **2026-01-14**: Job completion sends email notification to customer via Resend
- **2026-01-14**: Added mechanic_availability table for scheduling
- **2026-01-14**: Two-tier authentication: managers (full access) and mechanics (limited portal)
- **2026-01-14**: Test credentials: Manager (truman@oilboys.com / admin), Technician (jake@oilboys.com / mechanic123)
- **2026-01-13**: Added server-side session authentication with password hashing
- **2026-01-13**: Protected all admin API routes with auth middleware
- **2026-01-13**: Added "Meet Our Mechanics" section to homepage
- **2026-01-13**: Separated managers table from mechanics (managers authenticate, mechanics are displayed)
- **2026-01-13**: Manager login credentials: truman@oilboys.com / admin
- **2026-01-09**: Added license plate field to booking form
- **2026-01-09**: Simplified to Full Synthetic only ($85 base, +$15 for 75k+ miles)
- **2026-01-09**: Integrated Resend for email confirmations

## Security
- Session-based authentication using express-session with MemoryStore
- Password hashing with SHA-256 (stored hashed in database)
- Two-tier auth: Managers have full access, mechanics have limited portal access
- Auth middleware protects: /api/mechanics (all except /public), /api/appointments, /api/appointments/:id/status, /api/mechanic/* (mechanic routes)
- Public endpoints: /api/mechanics/public, /api/appointments (POST only), /api/availability/:date
- Zod validation on all API inputs

## Integrations
### Email (Resend)
- API key stored in `RESEND_API_KEY` secret
- Sends booking confirmations to customers
- Notifies business at theoilboysllc@gmail.com for new bookings
- Email sending from: bookings@theoilboys.org (requires domain verification)

## Project Architecture
```
client/           # React frontend (Vite)
  src/
    pages/        # Page components (booking, manager, mechanic, home)
    components/   # Reusable UI components
server/           # Express backend
  routes.ts       # API endpoints with auth middleware
  storage.ts      # Database operations
  email.ts        # Resend email service (booking + completion emails)
  index.ts        # Express app with session middleware
shared/
  schema.ts       # Drizzle ORM schema & types
```

## Database Tables
- **managers**: id, email, password (hashed), name - for authentication
- **mechanics**: id, email, password (hashed), name, phone, photoUrl, bio, oilChangeCount, backgroundCheckVerified, isPublic - for public display and technician login
- **mechanic_availability**: id, mechanicId, date, timeSlot, isAvailable - tracks when mechanics are available
- **appointments**: id, customerName, customerEmail, customerPhone, licensePlate, vehicleYear/Make/Model, serviceType, price, date, timeSlot, address, status, mechanicId

## User Preferences
- Business: The Oil Boys LLC
- Service area: Utah County (Orem, Provo, Lehi and surrounds)
- Contact: (385) 269-1482, theoilboysllc@gmail.com
- Pricing: $95 Full Synthetic, +$15 high mileage (75k+ miles)
- Design: Black (#000) and White (#fff) color scheme, classic automotive aesthetic
- Referral program: 20% off next oil change

## Planned Features
- [ ] Stripe payment processing
- [ ] Twilio SMS alerts
- [ ] License plate API integration (auto-populate vehicle info)
- [ ] GPS tracking for mechanics
- [ ] React Native mobile app
