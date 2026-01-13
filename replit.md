# The Oil Boys - Mobile Oil Change Booking Platform

## Overview
A comprehensive web application for "The Oil Boys," a mobile oil change business serving Utah County. The platform enables customers to schedule oil changes at their location and provides a manager dashboard to oversee operations and manage team profiles.

## Current State
- Full-stack application with React frontend and Node.js/Express backend
- PostgreSQL database for data persistence
- Customer booking flow with 3-step wizard
- Manager dashboard with secure session-based authentication
- "Meet Our Mechanics" public section displaying team profiles
- Black & white branding with classic automotive aesthetic

## Recent Changes
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
- Auth middleware protects: /api/mechanics (all except /public), /api/appointments, /api/appointments/:id/status
- Public endpoints: /api/mechanics/public (filters by isPublic flag), /api/appointments (POST only)
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
    pages/        # Page components (booking, manager, home)
    components/   # Reusable UI components
server/           # Express backend
  routes.ts       # API endpoints with auth middleware
  storage.ts      # Database operations
  email.ts        # Resend email service
  index.ts        # Express app with session middleware
shared/
  schema.ts       # Drizzle ORM schema & types
```

## Database Tables
- **managers**: id, email, password (hashed), name - for authentication
- **mechanics**: id, name, phone, photoUrl, bio, oilChangeCount, backgroundCheckVerified, isPublic - for public display
- **appointments**: id, customerName, customerEmail, customerPhone, licensePlate, vehicleYear/Make/Model, serviceType, price, date, timeSlot, address, status, mechanicId

## User Preferences
- Business: The Oil Boys LLC
- Service area: Utah County (Orem, Provo, Lehi and surrounds)
- Contact: (385) 269-1482, theoilboysllc@gmail.com
- Pricing: $85 Full Synthetic, +$15 high mileage (75k+ miles)
- Design: Black (#000) and White (#fff) color scheme, classic automotive aesthetic
- Referral program: 20% off next oil change

## Planned Features
- [ ] Stripe payment processing
- [ ] Twilio SMS alerts
- [ ] License plate API integration (auto-populate vehicle info)
- [ ] GPS tracking for mechanics
- [ ] React Native mobile app
