# Agile Progress Tracker — Application Planning Document

**Date:** 2026-06-13  
**Author:** Thiravidam S  
**Source:** `Agile_Project_Tracker.xlsx`

---

## 1. Overview

Replace the current Excel-based progress tracking workflow with a full-stack web application that supports real-time progress entry, team monitoring, manager sharing, and advanced dashboards with daily / weekly / monthly report generation.

---

## 2. Excel Sheet Analysis

The existing workbook has **7 sheets**, all of which become dedicated modules in the application:

| Sheet | Rows (approx) | Key Purpose |
|---|---|---|
| Requirements Tracker | 88 | Feature/bug requirements per module |
| Issue Tracker | 194 | Issues/defects with severity & resolution |
| Test Items Tracker | 53 | Test cases linked to modules & issues |
| Sprint Tracker | 201 (structure) | Sprint velocity & story completion |
| Dashboard | 7 (KPI summary) | Aggregate metrics |
| Support | 5 | Customer support tickets |
| Action Item | (empty, structure only) | Follow-up action items |

### 2.1 Field Mapping per Module

**Requirements Tracker**
- Req ID, Module/Menu, Requirement, Requestor, Priority (High/Medium/Low), Status, Owner, Created Date, Target Date, Actual Completion, Remarks

**Issue Tracker**
- Issue ID, Issue Description, Severity (High/Medium/Low), Reported By, Owner, Status, Open Date, Due Date, Days Open (auto-calculated), Resolution

**Test Items Tracker**
- Test ID, Module, Sub Module, Issue (title), Description, Tested By, Priority, Status, Owner, Created Date, Target Date, Linked Issue ID

**Sprint Tracker**
- Sprint Name, Start Date, End Date, Planned Stories, Completed Stories, Velocity %, Sprint Status

**Support Tracker**
- ID, Customer, Product, Requirement, Requestor, Priority, Status, Owner, Created Date, Target Date, Actual Completion, Remarks

**Action Item**
- ID, Type, Description, Owner, Due Date, Status

---

## 3. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | **Next.js 14** (App Router) | SSR for reports, API routes, file-based routing |
| UI Components | **shadcn/ui + Tailwind CSS** | Accessible, composable, fast to build |
| Charts | **Recharts** | Flexible, React-native charting |
| State | **Zustand** | Lightweight global state |
| Backend | **Next.js API Routes** | Co-located with frontend, simple deployment |
| ORM | **Prisma** | Type-safe DB access, migrations |
| Database | **PostgreSQL** | Relational, robust for reporting queries |
| Auth | **NextAuth.js** | Role-based (Admin / Team Member / Manager) |
| Email / Share | **Nodemailer** | Send daily/weekly/monthly reports |
| Export | **xlsx + jsPDF** | Export reports to Excel and PDF |
| Import | **xlsx** | One-time import from existing Excel file |

---

## 4. Database Schema (PostgreSQL via Prisma)

```sql
-- Users & Roles
users (id, name, email, password_hash, role: ADMIN|MEMBER|MANAGER, created_at)

-- Requirements
requirements (
  id, req_id UNIQUE, module, requirement, requestor,
  priority: HIGH|MEDIUM|LOW, status, owner_id → users,
  created_date, target_date, actual_completion, remarks, created_at, updated_at
)

-- Issues
issues (
  id, issue_id UNIQUE, description, severity: HIGH|MEDIUM|LOW,
  reported_by, owner_id → users, status, open_date, due_date,
  days_open (computed/stored), resolution, created_at, updated_at
)

-- Test Items
test_items (
  id, test_id UNIQUE, module, sub_module, issue_title, description,
  tested_by, priority, status, owner_id → users,
  created_date, target_date, linked_issue_id → issues, created_at, updated_at
)

-- Sprints
sprints (
  id, sprint_name UNIQUE, start_date, end_date,
  planned_stories, completed_stories, velocity_pct (computed),
  sprint_status, created_at, updated_at
)

-- Support Tickets
support_tickets (
  id, customer, product, requirement, requestor,
  priority, status, owner_id → users,
  created_date, target_date, actual_completion, remarks, created_at, updated_at
)

-- Action Items
action_items (
  id, type, description, owner_id → users,
  due_date, status, created_at, updated_at
)

-- Progress Logs (daily entries for audit/reporting)
progress_logs (
  id, module_type: REQUIREMENT|ISSUE|TEST|SPRINT|SUPPORT|ACTION,
  record_id, changed_by → users, old_status, new_status,
  notes, logged_at
)

-- Report Shares
report_shares (
  id, report_type: DAILY|WEEKLY|MONTHLY,
  report_date, sent_to (email[]), sent_by → users,
  pdf_url, sent_at
)
```

---

## 5. Application Modules & Features

### 5.1 Authentication
- Login / Logout (NextAuth with credentials)
- Roles: **Admin** (full access), **Team Member** (own records), **Manager** (read + report access)
- Session-based auth with JWT

### 5.2 Requirements Module
- CRUD for all requirement fields
- Filter by Module, Priority, Status, Owner, Date range
- Bulk status update
- Auto-generate Req ID (`ESS-001`, `PROC-001`, etc.) per module prefix
- Timeline view (Gantt-style target vs actual)

### 5.3 Issue Tracker Module
- CRUD with severity classification
- Auto-calculate **Days Open** (today − open_date)
- Link issues to test items
- Aging heatmap (overdue issues highlighted)
- Kanban board view (Open → In Progress → Resolved → Closed)

### 5.4 Test Items Module
- CRUD with module hierarchy
- Link to Issue Tracker records
- Status board: Closed / Open / In Progress
- Test pass rate metric per module

### 5.5 Sprint Tracker Module
- CRUD sprint entries
- Auto-calculate **Velocity %** = (Completed / Planned) × 100
- Sprint velocity trend chart (line)
- Burndown chart (planned vs completed over sprint dates)

### 5.6 Support Ticket Module
- CRUD with customer/product context
- SLA status indicator (target date vs today)
- Customer summary view

### 5.7 Action Items Module
- CRUD for follow-up actions
- Due date countdown / overdue alert
- Owner assignment and status tracking

### 5.8 Advanced Dashboard
Real-time KPI cards + interactive charts:

| KPI Card | Source |
|---|---|
| Total Requirements | requirements count |
| Open Requirements | status != 'Fixed/Closed' |
| Total Issues | issues count |
| Open Issues | status != 'completed/closed' |
| Overdue Items | target_date < today AND status != done |
| Sprint Velocity (latest) | sprints latest velocity_pct |
| Open Support Tickets | support_tickets open |
| Pending Action Items | action_items open |

**Charts:**
1. **Issue Severity Breakdown** — Pie chart (High / Medium / Low)
2. **Requirements Status** — Donut (Fixed / Open / In Progress)
3. **Sprint Velocity Trend** — Line chart across sprints
4. **Issues Over Time** — Area chart (opened vs resolved by week)
5. **Module-wise Issue Count** — Bar chart
6. **Owner Workload** — Horizontal bar (open items per person)
7. **Test Pass Rate by Module** — Bar chart
8. **SLA Compliance** — Gauge chart for support tickets

### 5.9 Report Generation

#### Daily Progress Report
- Summary of items updated today (by status change)
- New items added today
- Overdue items as of today
- Auto-generated at 6 PM or on-demand

#### Weekly Progress Report
- Sprint velocity for the week
- Requirements opened/closed
- Issues opened/resolved
- Test items status changes
- Support tickets resolved
- Top 5 at-risk items

#### Monthly Progress Report
- Full velocity trend
- Module-wise completion rates
- Owner performance summary
- Issue aging analysis
- Customer support SLA compliance
- Sprint comparison table

### 5.10 Share / Notify Feature
- **Email Reports**: Send Daily/Weekly/Monthly report PDF to manager email(s)
- **Report Preview**: HTML preview before sending
- **Recipient Management**: Save manager email list in settings
- **Share Link**: Generate a read-only public link for a report (expires in 7 days)
- **Export Options**: Download as PDF or Excel (.xlsx)

---

## 6. Page Structure (Next.js App Router)

```
app/
├── (auth)/
│   └── login/                    # Login page
├── (dashboard)/
│   ├── layout.tsx                # Sidebar + header layout
│   ├── page.tsx                  # Main dashboard (KPI + charts)
│   ├── requirements/
│   │   ├── page.tsx              # List + filter table
│   │   └── [id]/page.tsx         # Detail / edit form
│   ├── issues/
│   │   ├── page.tsx              # Table + Kanban toggle
│   │   └── [id]/page.tsx
│   ├── test-items/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── sprints/
│   │   ├── page.tsx              # Sprint list + velocity chart
│   │   └── [id]/page.tsx
│   ├── support/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── action-items/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── reports/
│   │   ├── daily/page.tsx
│   │   ├── weekly/page.tsx
│   │   └── monthly/page.tsx
│   └── settings/
│       └── page.tsx              # Users, manager emails, preferences
└── api/
    ├── auth/[...nextauth]/
    ├── requirements/
    ├── issues/
    ├── test-items/
    ├── sprints/
    ├── support/
    ├── action-items/
    ├── dashboard/
    ├── reports/
    │   ├── daily/
    │   ├── weekly/
    │   └── monthly/
    └── import/                   # One-time Excel import endpoint
```

---

## 7. UI/UX Design Principles

- **Sidebar navigation** with module icons, collapsible on mobile
- **Dark/Light mode** toggle
- **Responsive** (desktop-first, mobile-friendly)
- **Data tables** with sort, filter, pagination, and column visibility
- **Inline editing** for quick status updates
- **Toast notifications** for CRUD operations
- **Confirmation dialogs** for deletes
- **Badge colors**: Red = High/Overdue, Yellow = Medium/At Risk, Green = Completed, Blue = In Progress

---

## 8. Development Phases

### Phase 1 — Foundation (Week 1)
- [ ] Next.js project setup with Tailwind + shadcn/ui
- [ ] PostgreSQL + Prisma schema setup
- [ ] Authentication (NextAuth)
- [ ] Sidebar layout + routing
- [ ] One-time Excel import script

### Phase 2 — Core Modules (Week 2)
- [ ] Requirements Tracker CRUD + filters
- [ ] Issue Tracker CRUD + Kanban view
- [ ] Test Items Tracker CRUD
- [ ] Progress log (audit trail) middleware

### Phase 3 — Secondary Modules + Dashboard (Week 3)
- [ ] Sprint Tracker CRUD + velocity chart
- [ ] Support Ticket CRUD
- [ ] Action Items CRUD
- [ ] Main Dashboard with all KPI cards and charts

### Phase 4 — Reports + Sharing (Week 4)
- [ ] Daily / Weekly / Monthly report generation
- [ ] PDF export (jsPDF)
- [ ] Excel export (xlsx)
- [ ] Email share via Nodemailer
- [ ] Read-only share link generation

### Phase 5 — Polish + Deployment (Week 5)
- [ ] Dark/Light mode
- [ ] Mobile responsiveness
- [ ] Role-based access control enforcement
- [ ] Performance optimization (query caching, pagination)
- [ ] Deployment setup (Docker + PostgreSQL or Vercel + Supabase)

---

## 9. Folder Structure

```
agile-tracker/
├── app/                          # Next.js app router
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Sidebar, Header, Breadcrumb
│   ├── dashboard/                # KPI cards, chart components
│   ├── forms/                    # Shared form components
│   └── tables/                   # Data table with filters
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   ├── mailer.ts                 # Nodemailer setup
│   ├── reports/                  # Report generation logic
│   └── utils.ts                  # Shared helpers
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   └── import-excel.ts           # One-time data import from xlsx
├── public/
├── .env.local                    # DATABASE_URL, NEXTAUTH_SECRET, SMTP_*
├── package.json
└── PROJECT_PLAN.md               # This document
```

---

## 10. Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/agile_tracker"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="thiravidaselvams@gmail.com"
SMTP_PASS="your-app-password"
MANAGER_EMAIL="manager@company.com"
```

---

## 11. Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| API layer | Next.js API routes (not separate Express) | Single repo, simpler deployment |
| ORM | Prisma | Auto-generated types, readable migrations |
| Auth | NextAuth credentials | No external auth service needed |
| Charts | Recharts | Best React integration, customizable |
| PDF generation | jsPDF + html2canvas | Client or server-side, no external service |
| Import | One-time script (not UI) | Avoids complex mapping UI for a one-off task |
| Deployment | Docker Compose (Next.js + PostgreSQL) | Self-hosted, full control |

---

## 12. Next Steps

1. **Review this plan** — confirm tech stack, add/remove features
2. **Scaffold the project** — `npx create-next-app agile-tracker`
3. **Set up PostgreSQL** — local Docker or cloud (Supabase/Neon)
4. **Define Prisma schema** — based on field mapping above
5. **Run Excel import script** — migrate existing data
6. **Build Phase 1** — auth + layout + routing
7. **Iterate through phases** — module by module

---

*Ready to proceed? Confirm any changes to this plan and we will start scaffolding the application.*
