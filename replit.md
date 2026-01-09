# The Oil Boys - Mobile Oil Change Booking Platform

## Overview
A comprehensive web application for "The Oil Boys," a mobile oil change business serving Utah County. The platform enables customers to schedule oil changes at their location and provides mechanics with a dashboard to manage their daily appointments.

## Current State
- Full-stack application with React frontend and Node.js/Express backend
- PostgreSQL database for data persistence
- Customer booking flow with 3-step wizard
- Mechanic portal with login authentication and job management

## Recent Changes
- **2026-01-09**: Added license plate field to booking form
- **2026-01-09**: Simplified to Full Synthetic only ($79 base, +$15 for 75k+ miles)
- **2026-01-09**: Integrated Resend for email confirmations (manual API key setup)

## Integrations
### Email (Resend)
- API key stored in `RESEND_API_KEY` secret
- Sends booking confirmations to customers
- Notifies business at theoilboysllc@gmail.com for new bookings
- Currently using Resend sandbox domain (onboarding@resend.dev) for sending

## Project Architecture
```
client/           # React frontend (Vite)
  src/
    pages/        # Page components (booking, mechanic, home)
    components/   # Reusable UI components
server/           # Express backend
  routes.ts       # API endpoints
  storage.ts      # Database operations
  email.ts        # Resend email service
shared/
  schema.ts       # Drizzle ORM schema & types
```

## User Preferences
- Business: The Oil Boys LLC
- Service area: Utah County (Orem, Provo, Lehi and surrounds)
- Contact: 801-555-OILS, theoilboysllc@gmail.com
- Pricing: $79 Full Synthetic, +$15 high mileage (75k+ miles)
- Design: Clean Industrial aesthetic with Blue and Gold color scheme

## Planned Features
- [ ] Stripe payment processing
- [ ] Twilio SMS alerts
- [ ] License plate API integration (auto-populate vehicle info)
- [ ] GPS tracking for mechanics
- [ ] React Native mobile app
