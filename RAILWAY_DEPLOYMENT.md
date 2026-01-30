# Deploy The Oil Boys to Railway

This guide walks you through deploying the app to Railway (free tier to start).

## Prerequisites

- [Railway account](https://railway.app) (sign up with GitHub)
- Your code in a GitHub repository (push your project to GitHub first)

## Step 1: Create a New Project on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repository (or connect GitHub and select the Oil Boys repo)
5. Railway will detect it as a Node.js project

## Step 2: Add a PostgreSQL Database

1. In your Railway project dashboard, click **+ New**
2. Select **Database** → **Add PostgreSQL**
3. Railway creates a PostgreSQL instance and provides a connection URL
4. Click on the PostgreSQL service → **Variables** tab
5. Copy the `DATABASE_URL` value (you'll need it for the app)

## Step 3: Configure Your Web Service

The project includes a `railway.toml` that sets the build and start commands automatically. You typically don't need to change anything.

1. Click on your **web service** (the one from your GitHub repo)
2. Under **Networking**, click **Generate Domain** to get a public URL (e.g. `yourapp.up.railway.app`)

## Step 4: Add Environment Variables

In your web service, go to **Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | *(from PostgreSQL service)* | Use the `DATABASE_URL` from your Railway PostgreSQL. You can reference it: `${{Postgres.DATABASE_URL}}` if you named the DB "Postgres" |
| `NODE_ENV` | `production` | Required |
| `SESSION_SECRET` | *(generate a random string)* | Use a long random string, e.g. from [randomkeygen.com](https://randomkeygen.com) |
| `RESEND_API_KEY` | `re_xxxx...` | Your Resend API key for emails |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` | Use test key first, switch to live when ready |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` | Must be set at build time for Stripe to work |

**Referencing the database URL:** In Railway, you can link services. If your PostgreSQL is named "Postgres", add a variable:
- Name: `DATABASE_URL`
- Value: Click **Add Reference** → select your Postgres service → choose `DATABASE_URL`

## Step 5: Push Your Code to GitHub

If you haven't already:

```bash
cd "C:\Users\JohnSandberg\Desktop\The Oil Boys\TheOilBoysv1"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Railway will auto-deploy when you push.

## Step 6: Initialize the Database

After the first deploy, you need to set up the database schema and seed data:

1. In Railway, open your **web service** → **Settings** → find the service URL
2. Or use the Railway CLI to run commands

**Option A: Railway CLI (recommended)**

```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run db:push
railway run npm run db:sync-schema
railway run npm run db:add-stripe-fields
railway run npm run db:seed
railway run npm run db:reset-production
```

**Option B: Run migrations locally against production**

1. In Railway, copy your PostgreSQL `DATABASE_URL`
2. Locally, temporarily add it to `.env`: `DATABASE_URL=postgresql://...`
3. Run: `npm run db:push`, `npm run db:sync-schema`, `npm run db:add-stripe-fields`, `npm run db:seed`, `npm run db:reset-production`
4. Remove the production DATABASE_URL from your local `.env`

## Step 7: Test Your Deployment

1. Visit your Railway URL (e.g. `https://yourapp.up.railway.app`)
2. Test the booking flow
3. Sign in as manager at `/manage` with `theoilboysllc@gmail.com` / `Oilislife1!`
4. Test Stripe with a test card: `4242 4242 4242 4242`

## Important Notes

### Uploads (Technician Photos)
The `uploads/` folder is on the server filesystem. On Railway, the filesystem is **ephemeral** — uploads may be lost when the app redeploys. For now this is acceptable; for persistence you could add a Railway Volume later or switch to cloud storage (S3, Cloudinary).

### Sessions
The app uses in-memory sessions (`MemoryStore`). For production with multiple instances, you should switch to `connect-pg-simple` (PostgreSQL-backed sessions). For a single instance on Railway, in-memory works but sessions reset on deploy.

### Stripe in Production
When going live, switch to your Stripe **live** keys and update the env vars. Ensure your Stripe webhook/domain is configured for production.

### Custom Domain
To use your own domain (e.g. theoilboys.org):
1. In Railway → your service → **Settings** → **Networking** → **Custom Domain**
2. Add your domain and follow the DNS instructions
3. Update any Stripe/Resend settings that reference your domain

### Free Tier Limits
- **$1/month credit** — may run out; monitor usage in Railway dashboard
- If the app stops, upgrade to **Hobby** ($5/month) for reliable 24/7 uptime

## Troubleshooting

**Build fails:** Check the build logs. Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set (required at build time).

**Database connection fails:** Verify `DATABASE_URL` is set and uses `?sslmode=require` if Railway Postgres requires SSL.

**App crashes on start:** Check logs for missing env vars. All variables in the table above must be set.

**Port errors:** Railway sets `PORT` automatically; the app reads it. No changes needed.
