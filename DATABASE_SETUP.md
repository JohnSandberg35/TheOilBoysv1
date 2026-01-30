# Database Setup Guide

## Option 1: Using pgAdmin (GUI - Recommended)

1. Open **pgAdmin** (usually in Start Menu)
2. Connect to your PostgreSQL server (usually `localhost`, port `5432`)
3. Right-click on **Databases** → **Create** → **Database**
4. Name it: `theoilboys`
5. Click **Save**

## Option 2: Using Command Line (psql)

If you have PostgreSQL's bin directory in your PATH, or you can navigate to it:

```bash
# Navigate to PostgreSQL bin directory (usually something like):
# C:\Program Files\PostgreSQL\15\bin

# Then run:
psql -U postgres
```

Once in psql:
```sql
CREATE DATABASE theoilboys;
\q
```

## Option 3: Using SQL Command Directly

If you know your PostgreSQL connection details, you can create the database using any PostgreSQL client.

---

## After Creating the Database

1. Update your `.env` file with your database connection string:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/theoilboys
   ```
   
   Replace:
   - `username` with your PostgreSQL username (often `postgres`)
   - `password` with your PostgreSQL password
   - `5432` with your PostgreSQL port (default is 5432)

2. Then run:
   ```bash
   npm run db:push
   npm run db:seed
   ```
