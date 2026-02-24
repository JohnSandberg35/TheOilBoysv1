# Deploy The Oil Boys to Railway

This guide walks you through deploying the app to Railway (free tier to start).

## Prerequisites

- [Railway account](https://railway.app) (sign up with GitHub)
- Your code in a GitHub repository (push your project to GitHub first)

> ⚠️ **Critical:** The app **crashes immediately** if `DATABASE_URL` and other env vars are missing. You must add the database and variables **before** the first deploy finishes, or the app will never start. Follow the steps in order.

## Step 1: Create Project and Add Database First

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your repository (or connect GitHub and select the Oil Boys repo)
5. Railway creates the project and starts building — **don’t wait for it to finish**

**Immediately add PostgreSQL (before the build completes):**

6. In your Railway project, click **+ New**
7. Select **Database** → **Add PostgreSQL**
8. Railway creates a PostgreSQL instance (this only takes a few seconds)

## Step 2: Add Environment Variables (Before First Deploy)

1. Click on your **web service** (the one from your GitHub repo)
2. Go to the **Variables** tab
3. For each variable, click **+ New Variable** (or **Add Variable**). You'll get two fields:
   - **Variable** (or "Name") — type the variable name exactly
   - **Value** — type the value, or use a reference

Add these one by one. For each row: **Name** = what you type in the variable name field, **Value** = what you type (or paste) in the value field:

- **DATABASE_URL**
  - Name: `DATABASE_URL`
  - Value: Use the reference option (the **REF** or **Add Reference** button). Choose your Postgres service, then `DATABASE_URL`. It fills in something like `${{Postgres.DATABASE_URL}}`.  
  - If there's no reference button: type `${{Postgres.DATABASE_URL}}` — use your Postgres service's actual name from the left sidebar (often `Postgres` or `PostgreSQL`).

- **NODE_ENV**
  - Name: `NODE_ENV`  
  - Value: `production`

- **SESSION_SECRET**
  - Name: `SESSION_SECRET`  
  - Value: A long random string from [randomkeygen.com](https://randomkeygen.com), e.g. `a8f5f167f44f4964e6c998dee827110c`

- **RESEND_API_KEY**
  - Name: `RESEND_API_KEY`  
  - Value: Your Resend API key (starts with `re_`)

- **STRIPE_SECRET_KEY**
  - Name: `STRIPE_SECRET_KEY`  
  - Value: Your Stripe secret key (`sk_test_...` for test mode)

- **VITE_STRIPE_PUBLISHABLE_KEY**
  - Name: `VITE_STRIPE_PUBLISHABLE_KEY`  
  - Value: Your Stripe publishable key (`pk_test_...` for test mode). **Required before build.**

## Step 3: Configure Networking

1. Stay in your **web service**
2. Go to **Settings** → **Networking** (or the **Variables** tab → **Networking**)
3. Click **Generate Domain** to get a public URL (e.g. `yourapp.up.railway.app`)

The project includes a `railway.toml` that sets the build and start commands automatically.

## Step 4: Push Your Code to GitHub (if needed)

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

## Step 5: Initialize the Database

After the first deploy, you need to set up the database schema and seed data:

1. In Railway, open your **web service** → **Settings** → find the service URL
2. Or use the Railway CLI to run commands

**Option A: Railway CLI (recommended)**

```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run db:push   # May fail on some DBs; use db:init if so
railway run npm run db:sync-schema
railway run npm run db:add-stripe-fields
railway run npm run db:seed
railway run npm run db:reset-production
```

**If `db:push` fails or you see "relation appointments does not exist":** The database may be empty. Run `db:init` first (from your project folder, with production `DATABASE_URL` in `.env`):
```bash
npm run db:init
npm run db:sync-schema
npm run db:add-stripe-fields
npm run db:seed
npm run db:reset-production
```

**Option B: Run migrations locally against production** (use the **public** `DATABASE_URL` from Railway — the private `postgres.railway.internal` host only works from inside Railway)

1. In Railway, copy your PostgreSQL **public** `DATABASE_URL` (from Variables or Connect tab)
2. Locally, temporarily add it to `.env`: `DATABASE_URL=postgresql://...`
3. From your project folder, run: `npm run db:init` (creates tables if empty), then `npm run db:sync-schema`, `npm run db:add-stripe-fields`, `npm run db:seed`, `npm run db:reset-production`
4. Remove the production DATABASE_URL from your local `.env`

## Step 6: Test Your Deployment

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

### Custom Domain (theoilboysllc.com)

To serve the app at **theoilboysllc.com** (and optionally **www.theoilboysllc.com**):

1. **Add the domain in Railway**
   - Open your Railway project → click your **web service**
   - Go to **Settings** → **Networking** (or **Networking** in the service)
   - Under **Custom Domains**, click **Add custom domain** (or **Generate Domain** first if you don’t have a public URL yet)
   - Enter `theoilboysllc.com` and add it
   - Add `www.theoilboysllc.com` as well if you want www to work
   - Railway will show the exact **CNAME target** (e.g. `yourapp.up.railway.app`) and, for the root domain, either an **A record** IP or instructions (some setups use CNAME flattening)

2. **Point DNS at Railway**
   - Log in where **theoilboysllc.com** DNS is managed (registrar, e.g. GoDaddy/Namecheap, or Cloudflare if you use it).
   - **For the root domain (theoilboysllc.com):**
     - If Railway gives you **IP addresses:** create an **A** record: name `@`, value = that IP (or multiple A records if Railway gives more than one).
     - If Railway only gives a hostname: use an **ALIAS** or **ANAME** record to that hostname if your DNS provider supports it; otherwise follow Railway’s exact instructions.
   - **For www:** create a **CNAME** record: name `www`, value = the Railway hostname Railway showed you (e.g. `yourapp.up.railway.app`).
   - Save and wait for DNS to propagate (a few minutes up to 48 hours).

3. **SSL**
   - Railway provisions HTTPS for your custom domain automatically once DNS is correct. No extra step needed.

4. **After it’s working**
   - In Stripe (if you use redirects or allowed domains), add `https://theoilboysllc.com`.
   - In Resend, update any domain/sender settings if you send email from this domain.

### Free Tier Limits
- **$1/month credit** — may run out; monitor usage in Railway dashboard
- If the app stops, upgrade to **Hobby** ($5/month) for reliable 24/7 uptime

## Troubleshooting

**App crashes immediately / "Application failed to respond":** The app requires `DATABASE_URL` to start. Add the PostgreSQL database, add `DATABASE_URL` as a variable reference to your Postgres service, then trigger a **Redeploy** (web service → **Deployments** → ⋮ menu → **Redeploy**).

**Build fails:** Check the build logs. Ensure `VITE_STRIPE_PUBLISHABLE_KEY` is set (required at build time). Add it in Variables, then redeploy.

**Database connection fails:** Verify `DATABASE_URL` is set and uses `?sslmode=require` if Railway Postgres requires SSL.

**Port errors:** Railway sets `PORT` automatically; the app reads it. No changes needed.
