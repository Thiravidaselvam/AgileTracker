# Agile Progress Tracker — Setup Guide

## Quick Start

### 1. PostgreSQL — Neon (Vercel Integration)

1. Go to [vercel.com](https://vercel.com) → your project → **Storage** → **Create Database** → **Neon**
2. Copy the two connection strings:
   - `DATABASE_URL` (pooled — for the app)
   - `DATABASE_URL_UNPOOLED` (direct — for migrations)

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
DATABASE_URL="postgresql://..."          # from Neon (pooled)
DATABASE_URL_UNPOOLED="postgresql://..."  # from Neon (direct)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Gmail SMTP — use an App Password (not your real password)
# Go to: Google Account → Security → 2-Step Verification → App Passwords
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="thiravidaselvams@gmail.com"
SMTP_PASS="your-16-char-app-password"

MANAGER_EMAIL="manager@company.com"
```

### 3. Run Database Migration

```bash
npx prisma db push
```

### 4. Import Existing Excel Data

```bash
npx tsx scripts/import-excel.ts
```

This creates the admin user and imports all data from `Agile_Project_Tracker.xlsx`.

**Default login:**
- Email: `thiravidaselvams@gmail.com`
- Password: `admin123` ← **change this immediately in settings**

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/agile-tracker.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add all environment variables from `.env.local`
4. Deploy

### 3. Run Migration on Production

After first deploy, run in Vercel terminal or locally with production DATABASE_URL:
```bash
DATABASE_URL="your-prod-url" npx prisma db push
```

Then import data:
```bash
DATABASE_URL="your-prod-url" npx tsx scripts/import-excel.ts
```

---

## Project Structure

```
agile-tracker/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # All dashboard pages
│   │   ├── page.tsx          # Main dashboard
│   │   ├── requirements/     # Requirements tracker
│   │   ├── issues/           # Issue tracker + Kanban
│   │   ├── test-items/       # Test items tracker
│   │   ├── sprints/          # Sprint tracker
│   │   ├── support/          # Support tickets
│   │   ├── action-items/     # Action items
│   │   └── reports/          # Daily/Weekly/Monthly reports
│   └── api/                  # All REST API routes
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Sidebar + Header
│   └── dashboard/            # KPI cards + Charts
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── auth.ts               # NextAuth options
│   ├── utils.ts              # Shared utilities
│   └── reports/              # Report generation logic
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   └── import-excel.ts       # One-time data import
└── prisma.config.ts          # Prisma 7 config
```

## Adding Team Members

After logging in as admin:
1. Go to your database (Neon console)
2. Run this SQL to add a member:

```sql
INSERT INTO "User" (id, name, email, "passwordHash", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Member Name',
  'member@company.com',
  '$2b$10$...',  -- bcrypt hash of password
  'MEMBER',
  NOW(),
  NOW()
);
```

Or use the Prisma Studio: `npx prisma studio`
