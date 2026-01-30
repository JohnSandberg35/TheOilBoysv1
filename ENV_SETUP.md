# Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/theoilboys

# Session Secret (use a long random string in production)
SESSION_SECRET=theoilboys-session-secret-2026

# Resend API Key for email notifications
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Server Port (default: 5000)
PORT=5000
```

## Getting Started

1. Copy the variables above into a `.env` file
2. Update `DATABASE_URL` with your PostgreSQL connection string
3. Add your `RESEND_API_KEY` from your Resend account
4. Generate a secure `SESSION_SECRET` for production (you can use the default for development)
