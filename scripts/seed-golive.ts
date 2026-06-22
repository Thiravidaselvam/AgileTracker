import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db      = new PrismaClient({ adapter } as any)

async function main() {
  // Clean up any existing seed checklist
  await db.goLiveChecklist.deleteMany({ where: { checklistId: "GLC-0001" } })

  const checklist = await db.goLiveChecklist.create({
    data: {
      checklistId: "GLC-0001",
      title: "PAPYRUS BP ERP — Phase 1 Go-Live",
      project: "PAPYRUS BP ERP Implementation",
      goLiveDate: new Date("2026-07-10T06:00:00"),
      description: "Full go-live of Finance, HR, and Procurement modules. All pre-cutover tasks must be signed off before D-1.",
      status: "Active",
    },
  })

  const id = checklist.id

  const items = [
    // ── PRE-CUTOVER ───────────────────────────────────────────────────────────
    // Infrastructure & Environment
    { phase: "Pre-Cutover", category: "Infrastructure & Environment", task: "Provision production server (16-core, 64 GB RAM)", owner: "IT Infrastructure", dueDateTime: new Date("2026-06-25T18:00:00"), priority: "Critical", status: "Done",        order: 1 },
    { phase: "Pre-Cutover", category: "Infrastructure & Environment", task: "Configure firewall rules and open required ports", owner: "IT Infrastructure", dueDateTime: new Date("2026-06-26T18:00:00"), priority: "Critical", status: "Done",        order: 2 },
    { phase: "Pre-Cutover", category: "Infrastructure & Environment", task: "Install and validate SSL certificates on production domain", owner: "IT Infrastructure", dueDateTime: new Date("2026-06-27T12:00:00"), priority: "High",     status: "Done",        order: 3 },
    { phase: "Pre-Cutover", category: "Infrastructure & Environment", task: "Configure automated database backup (daily, 3-day retention)", owner: "DBA Team",           dueDateTime: new Date("2026-06-28T18:00:00"), priority: "Critical", status: "In Progress", order: 4 },
    { phase: "Pre-Cutover", category: "Infrastructure & Environment", task: "Load balancer setup and health-check verification", owner: "IT Infrastructure", dueDateTime: new Date("2026-06-30T18:00:00"), priority: "High",     status: "Not Started", order: 5 },

    // Data Migration
    { phase: "Pre-Cutover", category: "Data Migration", task: "Extract legacy master data (vendors, customers, chart of accounts)", description: "Export from legacy Tally system — approx 12,000 records", owner: "Data Team",     dueDateTime: new Date("2026-06-22T18:00:00"), priority: "Critical", status: "Done",        order: 10 },
    { phase: "Pre-Cutover", category: "Data Migration", task: "Data cleansing — remove duplicates and normalize formats", owner: "Data Team",     dueDateTime: new Date("2026-06-24T18:00:00"), priority: "Critical", status: "Done",        order: 11 },
    { phase: "Pre-Cutover", category: "Data Migration", task: "Test migration run #1 — verify record counts and relationships", owner: "Data Team",     dueDateTime: new Date("2026-06-26T18:00:00"), priority: "High",     status: "Done",        order: 12 },
    { phase: "Pre-Cutover", category: "Data Migration", task: "Test migration run #2 — business validation by Finance team", description: "Finance team to verify GL balances and open POs", owner: "Finance Team",  dueDateTime: new Date("2026-06-30T18:00:00"), priority: "Critical", status: "In Progress", order: 13, remarks: "Finance team reviewing - Mr. Ramamoorthy to sign off" },
    { phase: "Pre-Cutover", category: "Data Migration", task: "Open balances migration — AR, AP, and inventory as of June 30", owner: "DBA Team",          dueDateTime: new Date("2026-07-05T18:00:00"), priority: "Critical", status: "Not Started", order: 14 },
    { phase: "Pre-Cutover", category: "Data Migration", task: "Document final migration runbook with rollback steps", owner: "Data Team",     dueDateTime: new Date("2026-07-06T12:00:00"), priority: "High",     status: "Not Started", order: 15 },

    // System Configuration
    { phase: "Pre-Cutover", category: "System Configuration", task: "Finance module configuration — chart of accounts, cost centres", owner: "Functional Team", dueDateTime: new Date("2026-06-20T18:00:00"), priority: "Critical", status: "Done",    order: 20 },
    { phase: "Pre-Cutover", category: "System Configuration", task: "HR module configuration — pay grades, leave policies, departments", owner: "Functional Team", dueDateTime: new Date("2026-06-22T18:00:00"), priority: "High",     status: "Done",    order: 21 },
    { phase: "Pre-Cutover", category: "System Configuration", task: "Procurement module — approval workflows and PO limits", owner: "Functional Team", dueDateTime: new Date("2026-06-25T18:00:00"), priority: "High",     status: "Done",    order: 22 },
    { phase: "Pre-Cutover", category: "System Configuration", task: "Email notification templates configured for all workflows", owner: "Technical Team",   dueDateTime: new Date("2026-06-28T18:00:00"), priority: "Medium",   status: "In Progress", order: 23 },
    { phase: "Pre-Cutover", category: "System Configuration", task: "Report templates validated against business requirements", owner: "Functional Team", dueDateTime: new Date("2026-07-03T18:00:00"), priority: "High",     status: "Not Started", order: 24 },

    // User Access & Security
    { phase: "Pre-Cutover", category: "User Access & Security", task: "Create production user accounts for all 87 staff", owner: "IT Admin",          dueDateTime: new Date("2026-06-28T18:00:00"), priority: "Critical", status: "Done",        order: 30 },
    { phase: "Pre-Cutover", category: "User Access & Security", task: "Assign role-based access control (RBAC) per approved matrix", description: "Refer to approved RACI matrix signed by Mr. Sudharson", owner: "IT Admin",          dueDateTime: new Date("2026-06-30T18:00:00"), priority: "Critical", status: "In Progress", order: 31 },
    { phase: "Pre-Cutover", category: "User Access & Security", task: "Force password reset for all accounts on first login", owner: "IT Admin",          dueDateTime: new Date("2026-07-01T12:00:00"), priority: "High",     status: "Not Started", order: 32 },
    { phase: "Pre-Cutover", category: "User Access & Security", task: "Disable test/demo accounts from UAT environment", owner: "IT Admin",          dueDateTime: new Date("2026-07-07T18:00:00"), priority: "High",     status: "Not Started", order: 33 },

    // Training & Communication
    { phase: "Pre-Cutover", category: "Training & Communication", task: "End-user training — Finance team (15 users)", owner: "Training Team",    dueDateTime: new Date("2026-06-20T17:00:00"), priority: "Critical", status: "Done",        order: 40 },
    { phase: "Pre-Cutover", category: "Training & Communication", task: "End-user training — HR team (8 users)", owner: "Training Team",    dueDateTime: new Date("2026-06-23T17:00:00"), priority: "Critical", status: "Done",        order: 41 },
    { phase: "Pre-Cutover", category: "Training & Communication", task: "End-user training — Procurement team (12 users)", owner: "Training Team",    dueDateTime: new Date("2026-06-25T17:00:00"), priority: "High",     status: "Done",        order: 42 },
    { phase: "Pre-Cutover", category: "Training & Communication", task: "Training completion records signed and filed", owner: "Mr. Ramamoorthy", dueDateTime: new Date("2026-06-27T17:00:00"), priority: "Medium",   status: "In Progress", order: 43 },
    { phase: "Pre-Cutover", category: "Training & Communication", task: "Go-live announcement email sent to all departments", owner: "Project Manager",  dueDateTime: new Date("2026-07-07T10:00:00"), priority: "High",     status: "Not Started", order: 44 },
    { phase: "Pre-Cutover", category: "Training & Communication", task: "Hypercare support schedule published (first 2 weeks post go-live)", owner: "Project Manager",  dueDateTime: new Date("2026-07-07T17:00:00"), priority: "Medium",   status: "Not Started", order: 45 },

    // Testing & Validation
    { phase: "Pre-Cutover", category: "Testing & Validation", task: "UAT sign-off received — Finance module", owner: "Mr. Ramamoorthy", dueDateTime: new Date("2026-06-18T17:00:00"), priority: "Critical", status: "Done",    order: 50 },
    { phase: "Pre-Cutover", category: "Testing & Validation", task: "UAT sign-off received — HR module", owner: "Mr. Ramamoorthy", dueDateTime: new Date("2026-06-20T17:00:00"), priority: "Critical", status: "Done",    order: 51 },
    { phase: "Pre-Cutover", category: "Testing & Validation", task: "UAT sign-off received — Procurement module", owner: "Mr. Sudharson",   dueDateTime: new Date("2026-06-22T17:00:00"), priority: "Critical", status: "Done",    order: 52 },
    { phase: "Pre-Cutover", category: "Testing & Validation", task: "Performance test — 50 concurrent users, response < 2s", description: "Run JMeter test suite for peak load simulation", owner: "Technical Team",   dueDateTime: new Date("2026-07-01T18:00:00"), priority: "High",     status: "Blocked",     order: 53, remarks: "Blocked: waiting for IT team to whitelist JMeter IP on production firewall", dependency: "Depends on firewall rules task" },
    { phase: "Pre-Cutover", category: "Testing & Validation", task: "Security scan — OWASP top 10 vulnerability check", owner: "IT Security",      dueDateTime: new Date("2026-07-04T18:00:00"), priority: "High",     status: "Not Started", order: 54 },
    { phase: "Pre-Cutover", category: "Testing & Validation", task: "Disaster recovery drill — failover and restore test", owner: "DBA Team",          dueDateTime: new Date("2026-07-05T18:00:00"), priority: "Medium",   status: "Not Started", order: 55 },

    // Integration
    { phase: "Pre-Cutover", category: "Integration", task: "Bank reconciliation API integration tested", owner: "Technical Team",   dueDateTime: new Date("2026-06-28T18:00:00"), priority: "High",     status: "Done",        order: 60 },
    { phase: "Pre-Cutover", category: "Integration", task: "GST e-filing connector validated with test invoices", owner: "Technical Team",   dueDateTime: new Date("2026-07-02T18:00:00"), priority: "High",     status: "In Progress", order: 61 },
    { phase: "Pre-Cutover", category: "Integration", task: "Biometric attendance system integration tested", owner: "Technical Team",   dueDateTime: new Date("2026-07-04T18:00:00"), priority: "Medium",   status: "Not Started", order: 62 },

    // Rollback Readiness
    { phase: "Pre-Cutover", category: "Rollback Readiness", task: "Rollback plan documented and approved by steering committee", owner: "Project Manager",  dueDateTime: new Date("2026-07-06T17:00:00"), priority: "Critical", status: "Not Started", order: 70 },
    { phase: "Pre-Cutover", category: "Rollback Readiness", task: "Legacy system kept active in read-only mode until D+7", owner: "IT Infrastructure", dueDateTime: new Date("2026-07-08T09:00:00"), priority: "Critical", status: "Not Started", order: 71 },

    // ── CUTOVER DAY ───────────────────────────────────────────────────────────
    // Infrastructure & Environment
    { phase: "Cutover Day", category: "Infrastructure & Environment", task: "D-Day health check — all services green (DB, app, cache)", owner: "IT Infrastructure", dueDateTime: new Date("2026-07-10T05:00:00"), priority: "Critical", status: "Not Started", order: 100 },
    { phase: "Cutover Day", category: "Infrastructure & Environment", task: "Send system-wide maintenance notification (30 min window)", owner: "IT Admin",          dueDateTime: new Date("2026-07-10T05:30:00"), priority: "High",     status: "Not Started", order: 101 },

    // Data Migration
    { phase: "Cutover Day", category: "Data Migration", task: "Take final snapshot of legacy system data", owner: "DBA Team",           dueDateTime: new Date("2026-07-10T02:00:00"), priority: "Critical", status: "Not Started", order: 110 },
    { phase: "Cutover Day", category: "Data Migration", task: "Run final production data migration script", description: "Execute migration_final_v3.sql — estimated 45 mins", owner: "DBA Team",           dueDateTime: new Date("2026-07-10T02:30:00"), priority: "Critical", status: "Not Started", order: 111, dependency: "Depends on legacy system snapshot" },
    { phase: "Cutover Day", category: "Data Migration", task: "Validate record counts — compare legacy vs ERP row counts per table", owner: "Data Team",      dueDateTime: new Date("2026-07-10T04:00:00"), priority: "Critical", status: "Not Started", order: 112, dependency: "Depends on final migration run" },
    { phase: "Cutover Day", category: "Data Migration", task: "Finance team spot-check: verify 20 random GL transactions", owner: "Finance Team",   dueDateTime: new Date("2026-07-10T05:00:00"), priority: "Critical", status: "Not Started", order: 113 },

    // Go-Live Communication
    { phase: "Cutover Day", category: "Go-Live Communication", task: "Send go-live announcement to all users (system is live)", owner: "Project Manager",  dueDateTime: new Date("2026-07-10T06:00:00"), priority: "High",     status: "Not Started", order: 120 },
    { phase: "Cutover Day", category: "Go-Live Communication", task: "Notify management (MD, CFO, HR Head) that system is live", owner: "Project Manager",  dueDateTime: new Date("2026-07-10T06:05:00"), priority: "High",     status: "Not Started", order: 121 },
    { phase: "Cutover Day", category: "Go-Live Communication", task: "Activate support hotline and assign D-day on-call team", owner: "Support Lead",     dueDateTime: new Date("2026-07-10T06:00:00"), priority: "High",     status: "Not Started", order: 122 },

    // Rollback Readiness
    { phase: "Cutover Day", category: "Rollback Readiness", task: "Confirm rollback decision checkpoint (Go / No-Go) at 05:30", description: "All critical checks must pass; rollback trigger: > 3 critical failures", owner: "Steering Committee", dueDateTime: new Date("2026-07-10T05:30:00"), priority: "Critical", status: "Not Started", order: 130 },
    { phase: "Cutover Day", category: "Rollback Readiness", task: "Rollback team on standby until 12:00", owner: "DBA Team",           dueDateTime: new Date("2026-07-10T06:00:00"), priority: "High",     status: "Not Started", order: 131 },

    // Monitoring & Support
    { phase: "Cutover Day", category: "Monitoring & Support", task: "Enable real-time monitoring dashboard (CPU, DB response, errors)", owner: "IT Infrastructure", dueDateTime: new Date("2026-07-10T06:00:00"), priority: "Critical", status: "Not Started", order: 140 },
    { phase: "Cutover Day", category: "Monitoring & Support", task: "First-login support desk open — walk-in and phone", owner: "Support Lead",     dueDateTime: new Date("2026-07-10T07:00:00"), priority: "High",     status: "Not Started", order: 141 },

    // ── POST-GO-LIVE ──────────────────────────────────────────────────────────
    // Monitoring & Support
    { phase: "Post-Go-Live", category: "Monitoring & Support", task: "Daily system health report — D+1 to D+7", owner: "IT Infrastructure", dueDateTime: new Date("2026-07-17T09:00:00"), priority: "High",     status: "Not Started", order: 200 },
    { phase: "Post-Go-Live", category: "Monitoring & Support", task: "Support ticket volume review — escalate if > 20 critical tickets/day", owner: "Support Lead",     dueDateTime: new Date("2026-07-17T18:00:00"), priority: "High",     status: "Not Started", order: 201 },
    { phase: "Post-Go-Live", category: "Monitoring & Support", task: "Performance benchmarking report (response times, peak load)", owner: "Technical Team",   dueDateTime: new Date("2026-07-14T17:00:00"), priority: "Medium",   status: "Not Started", order: 202 },
    { phase: "Post-Go-Live", category: "Monitoring & Support", task: "Database query optimization review if response > 3s", owner: "DBA Team",           dueDateTime: new Date("2026-07-14T17:00:00"), priority: "Medium",   status: "Not Started", order: 203 },

    // Testing & Validation
    { phase: "Post-Go-Live", category: "Testing & Validation", task: "End-of-day business transactions validated (invoices, payroll, POs)", owner: "Finance Team",   dueDateTime: new Date("2026-07-10T20:00:00"), priority: "Critical", status: "Not Started", order: 210 },
    { phase: "Post-Go-Live", category: "Testing & Validation", task: "Standard reports verified against legacy system outputs", owner: "Functional Team", dueDateTime: new Date("2026-07-12T17:00:00"), priority: "High",     status: "Not Started", order: 211 },
    { phase: "Post-Go-Live", category: "Testing & Validation", task: "Payroll first-run validation (if go-live coincides with pay cycle)", owner: "HR Team",         dueDateTime: new Date("2026-07-15T17:00:00"), priority: "Critical", status: "Not Started", order: 212 },

    // Training & Communication
    { phase: "Post-Go-Live", category: "Training & Communication", task: "Daily hypercare drop-in sessions (D+1 to D+5, 10:00–11:00)", owner: "Training Team",    dueDateTime: new Date("2026-07-15T11:00:00"), priority: "High",     status: "Not Started", order: 220 },
    { phase: "Post-Go-Live", category: "Training & Communication", task: "User feedback survey distributed (Day 3)", owner: "Project Manager",  dueDateTime: new Date("2026-07-13T17:00:00"), priority: "Medium",   status: "Not Started", order: 221 },
    { phase: "Post-Go-Live", category: "Training & Communication", task: "User feedback survey results reviewed and action plan created", owner: "Project Manager",  dueDateTime: new Date("2026-07-17T17:00:00"), priority: "Medium",   status: "Not Started", order: 222 },

    // Rollback Readiness
    { phase: "Post-Go-Live", category: "Rollback Readiness", task: "Rollback window closed — legacy system decommissioned (D+7)", description: "Only after written approval from CFO and IT Head", owner: "Steering Committee", dueDateTime: new Date("2026-07-17T17:00:00"), priority: "High",     status: "Not Started", order: 230 },
  ]

  await db.goLiveItem.createMany({
    data: items.map((item) => ({
      checklistId: id,
      phase:       item.phase,
      category:    item.category,
      task:        item.task,
      description: (item as any).description ?? null,
      owner:       item.owner,
      dueDateTime: item.dueDateTime,
      priority:    item.priority,
      status:      item.status,
      dependency:  (item as any).dependency ?? null,
      remarks:     (item as any).remarks ?? null,
      order:       item.order,
    })),
  })

  const total   = items.length
  const done    = items.filter((i) => i.status === "Done").length
  const blocked = items.filter((i) => i.status === "Blocked").length
  console.log(`✓ Created checklist GLC-0001 — ${total} items (${done} done, ${blocked} blocked)`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
