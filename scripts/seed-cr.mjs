import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter: new PrismaPg(pool) })

const user = await db.user.findFirst({ where: { role: "ADMIN" } })

const crs = [
  {
    crId: "CR-0001",
    title: "Add Export to Excel in Reports Module",
    description: "The Reports module currently only supports PDF export. Users need the ability to export data to Excel (.xlsx) format for further analysis in spreadsheet tools.",
    reason: "Multiple clients have requested Excel export capability. This is a high-priority feature for the next sprint to improve user satisfaction and reduce manual data extraction efforts.",
    impact: "Reports module, Backend API, Frontend UI. No database schema changes required. Estimated 3 days of development effort.",
    priority: "HIGH",
    status: "Approved",
    requestedBy: user?.name ?? "Admin",
    ownerId: user?.id ?? null,
    estimatedEffort: "3 days",
    targetDate: new Date("2026-07-15"),
    remarks: "Reviewed by the team. Approved for Sprint 5. Backend work to start on 2026-06-20.",
  },
  {
    crId: "CR-0002",
    title: "Dashboard Date Filter — Persist User Preference",
    description: "Currently the dashboard filter resets to default on every page reload. The selected date range and user filter should persist across sessions using localStorage.",
    reason: "Users frequently use the same filter settings daily. Having to re-apply filters every session is inefficient and reduces productivity.",
    impact: "Dashboard page only. Client-side change using localStorage. No backend API changes needed.",
    priority: "MEDIUM",
    status: "Under Review",
    requestedBy: user?.name ?? "Admin",
    ownerId: null,
    estimatedEffort: "0.5 days",
    targetDate: new Date("2026-06-30"),
    remarks: "",
  },
  {
    crId: "CR-0003",
    title: "Add Email Notifications for Overdue Items",
    description: "The system should automatically send daily email notifications to item owners when their assigned items are overdue by more than 3 days.",
    reason: "Overdue items are currently at 81 across all modules. Automated reminders will help owners take timely action without manual follow-up from managers.",
    impact: "New background job (cron), SMTP email integration, Notification module. Requires careful testing to avoid email spam.",
    priority: "HIGH",
    status: "Submitted",
    requestedBy: user?.name ?? "Admin",
    ownerId: null,
    estimatedEffort: "5 days",
    targetDate: new Date("2026-07-30"),
    remarks: "",
  },
]

for (const cr of crs) {
  await db.changeRequest.upsert({
    where: { crId: cr.crId },
    update: cr,
    create: cr,
  })
  console.log(`✓ ${cr.crId} — ${cr.title}`)
}

await db.$disconnect()
