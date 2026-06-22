# Agile Progress Tracker — Deployment & Credentials Guide

> ⚠️ KEEP THIS FILE PRIVATE — contains passwords and secret keys.
> Do NOT commit to GitHub or share publicly.

---

## 1. Credentials & Configuration

### Neon Database (PostgreSQL — Cloud)

| Setting | Value |
|---|---|
| Provider | Neon (neon.tech) |
| Database | `neondb` |
| Username | `neondb_owner` |
| Password | `npg_jWPGiOS1gQ8o` |
| Region | US East 1 (AWS) |
| Endpoint ID | `ep-solitary-waterfall-atkt6nus` |

**Pooled connection URL** (use this for `DATABASE_URL`):
```
postgresql://neondb_owner:npg_jWPGiOS1gQ8o@ep-solitary-waterfall-atkt6nus-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Direct connection URL** (use this for `DATABASE_URL_UNPOOLED`):
```
postgresql://neondb_owner:npg_jWPGiOS1gQ8o@ep-solitary-waterfall-atkt6nus.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Neon Dashboard:** https://console.neon.tech

---

### Vercel (Hosting)

| Setting | Value |
|---|---|
| Team / Org | `thiravidam-s-projects` |
| Project name | `agile-tracker` |
| Project ID | `prj_tsRoaJB2ZnLj8dTWRAaeJTNpWqIX` |
| Production URL | https://agile-tracker-red.vercel.app |
| Region | Washington D.C., USA (iad1) |

**Vercel Dashboard:** https://vercel.com/thiravidam-s-projects/agile-tracker

---

### Environment Variables (all set on Vercel → Production)

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_jWPGiOS1gQ8o@ep-solitary-waterfall-atkt6nus-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | `postgresql://neondb_owner:npg_jWPGiOS1gQ8o@ep-solitary-waterfall-atkt6nus.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_URL` | `https://agile-tracker-red.vercel.app` |
| `NEXTAUTH_SECRET` | `ZfPWIuAFU5I7NmkZj/4GF7qtDBuAoHZEMFRAlj9RllI=` |
| `SMTP_HOST` | _(not configured yet)_ |
| `SMTP_PORT` | _(not configured yet)_ |
| `SMTP_USER` | _(not configured yet)_ |
| `SMTP_PASS` | _(not configured yet)_ |
| `MANAGER_EMAIL` | _(not configured yet)_ |

---

### Application Login (Admin)

| Field | Value |
|---|---|
| URL | https://agile-tracker-red.vercel.app/login |
| Email | `admin@agiletracker.com` |
| Password | `Admin@123` |
| Role | ADMIN |

---

### Local Development (.env.local)

```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/agile_tracker
NEXTAUTH_SECRET=ZfPWIuAFU5I7NmkZj/4GF7qtDBuAoHZEMFRAlj9RllI=
NEXTAUTH_URL=http://localhost:3000
```

---

## 2. How to Update the Application

### Step 1 — Make your code changes

Edit files in `E:\TrainningMaterials\ProgressTracker\agile-tracker\`

### Step 2 — Test locally first

```powershell
cd "E:\TrainningMaterials\ProgressTracker\agile-tracker"
npm run dev
```

Open http://localhost:3000 and verify your changes work.

### Step 3 — Deploy to Vercel

```powershell
cd "E:\TrainningMaterials\ProgressTracker\agile-tracker"
vercel --prod
```

That's it. Vercel will build and deploy automatically. The production URL stays the same: https://agile-tracker-red.vercel.app

---

## 3. How to Update the Database Schema

If you add or change models in `prisma/schema.prisma`:

```powershell
cd "E:\TrainningMaterials\ProgressTracker\agile-tracker"
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jWPGiOS1gQ8o@ep-solitary-waterfall-atkt6nus.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
npx prisma db push
```

Then redeploy:
```powershell
vercel --prod
```

---

## 4. How to Add a New User

Run the create-admin script (change email/password/name/role inside first):

```powershell
cd "E:\TrainningMaterials\ProgressTracker\agile-tracker"
$env:DATABASE_URL = "postgresql://neondb_owner:npg_jWPGiOS1gQ8o@ep-solitary-waterfall-atkt6nus.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
node --experimental-vm-modules scripts/create-admin.mjs
```

Roles available: `ADMIN`, `MEMBER`, `MANAGER`

---

## 5. How to Update a Vercel Environment Variable

> ⚠️ IMPORTANT: Do NOT use PowerShell pipe (`|`) to set Vercel env vars — it adds a hidden UTF-8 BOM that silently corrupts the value and breaks the app.

Always use this method (cmd input redirect):

```powershell
cd "E:\TrainningMaterials\ProgressTracker\agile-tracker"

# 1. Write the value to a temp file (no BOM)
$value = "your-new-value-here"
$tmp = "$env:TEMP\envval.bin"
[System.IO.File]::WriteAllBytes($tmp, [System.Text.Encoding]::UTF8.GetBytes($value))

# 2. Remove old value and set new one
vercel env rm VARIABLE_NAME production --yes
cmd /c "vercel env add VARIABLE_NAME production < `"$tmp`""

# 3. Redeploy to apply
vercel --prod
```

---

## 6. Stack Reference

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.9 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| ORM | Prisma | 7.8.0 |
| Auth | NextAuth | v4.24.14 |
| Database | PostgreSQL (Neon) | — |
| Charts | Recharts | 2.x |
| Hosting | Vercel | — |

**Key files:**
- `lib/db.ts` — Prisma client (pg adapter + SSL config)
- `lib/auth.ts` — NextAuth configuration
- `proxy.ts` — Next.js 16 middleware (auth protection)
- `prisma/schema.prisma` — Database schema
- `prisma.config.ts` — Prisma CLI config (points to Neon)
- `vercel.json` — Vercel build config
- `next.config.ts` — Next.js config (serverExternalPackages)

---

## 7. Vercel CLI Reference

```powershell
# Deploy to production
vercel --prod

# View production logs
vercel logs https://agile-tracker-red.vercel.app --expand

# List env vars
vercel env ls production

# View deployment history
vercel ls
```

---

## 8. Local Database (for development)

If you want to run locally with a local PostgreSQL instead of Neon:

1. Install PostgreSQL 15+ locally
2. Create database: `CREATE DATABASE agile_tracker;`
3. Set `DATABASE_URL` in `.env.local` to: `postgresql://postgres:123456@localhost:5432/agile_tracker`
4. Push schema: `npx prisma db push`
5. Run: `npm run dev`
