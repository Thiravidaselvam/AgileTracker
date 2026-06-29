import { db } from "@/lib/db"
import {
  format, startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  startOfQuarter, endOfQuarter, getQuarter,
} from "date-fns"

export async function generateRangeReport(from: Date, to: Date) {
  const start = startOfDay(from)
  const end   = endOfDay(to)

  const ownerSelect = { owner: { select: { name: true } } }

  const [
    openedIssues, resolvedIssues,
    openedReqs, closedReqs,
    sprints, supportTickets, testItems, actionItems,
    atRiskIssues,
    reqStatuses, issueStatuses, testStatuses, supportStatuses, actionStatuses, sprintStatuses,
  ] = await Promise.all([
    db.issue.findMany({ where: { openDate: { gte: start, lte: end } }, include: ownerSelect, orderBy: { openDate: "desc" } }),
    db.issue.findMany({ where: { updatedAt: { gte: start, lte: end }, status: { in: ["completed","closed","resolved","Completed","Closed","Resolved","Fixed","Done"] } }, include: ownerSelect }),
    db.requirement.findMany({ where: { createdDate: { gte: start, lte: end } }, include: ownerSelect, orderBy: { createdDate: "desc" } }),
    db.requirement.findMany({ where: { updatedAt: { gte: start, lte: end }, status: { in: ["Fixed","Closed","Completed","Done","closed","completed"] } }, include: ownerSelect }),
    db.sprint.findMany({ where: { startDate: { gte: start, lte: end } }, orderBy: { startDate: "asc" } }),
    db.supportTicket.findMany({ where: { createdDate: { gte: start, lte: end } }, include: ownerSelect, orderBy: { createdDate: "desc" } }),
    db.testItem.findMany({ where: { createdDate: { gte: start, lte: end } }, include: ownerSelect, orderBy: { createdDate: "desc" } }),
    db.actionItem.findMany({ where: { createdAt: { gte: start, lte: end } }, include: ownerSelect, orderBy: { createdAt: "desc" } }),
    db.issue.findMany({ where: { dueDate: { lt: start }, status: { notIn: ["completed","closed","resolved","Completed","Closed","Resolved","Fixed","Done","Passed"] } }, select: { id: true } }),
    // all-time status counts per module
    db.requirement.groupBy({ by: ["status"], _count: { _all: true } }),
    db.issue.groupBy({ by: ["status"], _count: { _all: true } }),
    db.testItem.groupBy({ by: ["status"], _count: { _all: true } }),
    db.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    db.actionItem.groupBy({ by: ["status"], _count: { _all: true } }),
    db.sprint.groupBy({ by: ["sprintStatus"], _count: { _all: true } }),
  ])

  const toMap = (rows: any[], key = "status") =>
    rows.reduce((acc: Record<string, number>, r: any) => { acc[r[key]] = r._count._all; return acc }, {})

  const avgVelocity = sprints.length > 0
    ? sprints.reduce((s, sp) => s + sp.velocityPct, 0) / sprints.length
    : 0

  return {
    period: `${format(start, "dd MMM yyyy")} – ${format(end, "dd MMM yyyy")}`,
    summary: {
      openedIssues:   openedIssues.length,
      resolvedIssues: resolvedIssues.length,
      openedReqs:     openedReqs.length,
      closedReqs:     closedReqs.length,
      openSupport:    supportTickets.filter((t) => !["Completed","Closed"].includes(t.status)).length,
      atRiskCount:    atRiskIssues.length,
      totalTestItems: testItems.length,
      avgVelocity:    Number(avgVelocity.toFixed(0)),
    },
    statusSummary: {
      requirements:   toMap(reqStatuses),
      issues:         toMap(issueStatuses),
      testItems:      toMap(testStatuses),
      supportTickets: toMap(supportStatuses),
      actionItems:    toMap(actionStatuses),
      sprints:        toMap(sprintStatuses, "sprintStatus"),
    },
    issues:         openedIssues,
    resolvedIssues,
    requirements:   openedReqs,
    closedReqs,
    sprints,
    supportTickets,
    testItems,
    actionItems,
  }
}

export async function generateDailyReport(date = new Date()) {
  const start = startOfDay(date)
  const end   = endOfDay(date)

  const [updatedIssues, updatedReqs, updatedTests, newIssues, newReqs, overdueIssues] = await Promise.all([
    db.issue.findMany({ where: { updatedAt: { gte: start, lte: end } }, include: { owner: { select: { name: true } } } }),
    db.requirement.findMany({ where: { updatedAt: { gte: start, lte: end } }, include: { owner: { select: { name: true } } } }),
    db.testItem.findMany({ where: { updatedAt: { gte: start, lte: end } }, include: { owner: { select: { name: true } } } }),
    db.issue.findMany({ where: { openDate: { gte: start, lte: end } } }),
    db.requirement.findMany({ where: { createdDate: { gte: start, lte: end } } }),
    db.issue.findMany({
      where: {
        // lt: start (midnight today) — items due yesterday or earlier are overdue.
        // Using new Date() would flag anything due today (stored as midnight) as overdue.
        dueDate: { lt: start },
        status: { notIn: ["completed","closed","resolved","Completed","Closed","Resolved","Fixed","Done","Passed"] },
      },
      include: { owner: { select: { name: true } } },
    }),
  ])

  return {
    date: format(date, "dd MMM yyyy"),
    summary: {
      issuesUpdated:  updatedIssues.length,
      reqsUpdated:    updatedReqs.length,
      testsUpdated:   updatedTests.length,
      newIssues:      newIssues.length,
      newRequirements: newReqs.length,
      overdueIssues:  overdueIssues.length,
    },
    details: { updatedIssues, updatedReqs, updatedTests, overdueIssues },
  }
}

export async function generateWeeklyReport(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end   = endOfWeek(date,   { weekStartsOn: 1 })

  const [openedIssues, resolvedIssues, openedReqs, closedReqs, sprints, openSupport] = await Promise.all([
    db.issue.count({ where: { openDate: { gte: start, lte: end } } }),
    db.issue.count({ where: { updatedAt: { gte: start, lte: end }, status: { in: ["completed", "closed", "resolved"] } } }),
    db.requirement.count({ where: { createdDate: { gte: start, lte: end } } }),
    db.requirement.count({ where: { updatedAt: { gte: start, lte: end }, status: { in: ["Fixed", "Closed", "Completed"] } } }),
    db.sprint.findMany({ where: { startDate: { gte: start, lte: end } } }),
    db.supportTicket.count({ where: { status: { notIn: ["Completed", "Closed"] } } }),
  ])

  const allIssues   = await db.issue.findMany({ select: { severity: true, status: true, daysOpen: true, dueDate: true } })
  const today       = startOfDay(new Date())
  const DONE_LC     = ["completed","closed","resolved","fixed","done","passed"]
  const atRisk      = allIssues.filter((i) => i.dueDate && new Date(i.dueDate) < today && !DONE_LC.includes(i.status.toLowerCase()))

  return {
    period: `${format(start, "dd MMM")} – ${format(end, "dd MMM yyyy")}`,
    summary: { openedIssues, resolvedIssues, openedReqs, closedReqs, openSupport, atRiskCount: atRisk.length },
    sprints,
    atRisk: atRisk.slice(0, 5),
  }
}

export async function generateMonthlyReport(date = new Date()) {
  const start = startOfMonth(date)
  const end   = endOfMonth(date)

  const [totalIssues, resolvedIssues, openedReqs, closedReqs, allSprints, supportTickets] = await Promise.all([
    db.issue.count({ where: { openDate: { gte: start, lte: end } } }),
    db.issue.count({ where: { updatedAt: { gte: start, lte: end }, status: { in: ["completed","closed","resolved"] } } }),
    db.requirement.count({ where: { createdDate: { gte: start, lte: end } } }),
    db.requirement.count({ where: { updatedAt: { gte: start, lte: end }, status: { in: ["Fixed","Closed","Completed"] } } }),
    db.sprint.findMany({ where: { startDate: { gte: start, lte: end } }, orderBy: { startDate: "asc" } }),
    db.supportTicket.findMany({ where: { createdDate: { gte: start, lte: end } }, include: { owner: { select: { name: true } } } }),
  ])

  const avgVelocity = allSprints.length > 0
    ? allSprints.reduce((s, sp) => s + sp.velocityPct, 0) / allSprints.length
    : 0

  const owners = await db.user.findMany({ select: { name: true }, where: { role: "MEMBER" } })

  return {
    period: format(date, "MMMM yyyy"),
    summary: { totalIssues, resolvedIssues, resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(0) : 0, openedReqs, closedReqs, avgVelocity: avgVelocity.toFixed(0) },
    sprints: allSprints,
    supportTickets,
    owners: owners.map((o) => o.name),
  }
}

function getPeriodRange(period: string, date: Date) {
  switch (period) {
    case "weekly":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end:   endOfWeek(date,   { weekStartsOn: 1 }),
        label: `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), "dd MMM yyyy")}`,
      }
    case "quarterly":
      return {
        start: startOfQuarter(date),
        end:   endOfQuarter(date),
        label: `Q${getQuarter(date)} ${date.getFullYear()}`,
      }
    case "yearly":
      return {
        start: startOfYear(date),
        end:   endOfYear(date),
        label: `${date.getFullYear()}`,
      }
    default: // monthly
      return {
        start: startOfMonth(date),
        end:   endOfMonth(date),
        label: format(date, "MMMM yyyy"),
      }
  }
}

export async function generatePerformanceReport(period: string, date = new Date()) {
  const { start, end, label } = getPeriodRange(period, date)
  const now = new Date()

  const DONE_REQS    = ["Fixed", "Closed", "Completed"]
  const DONE_ISSUES  = ["completed", "closed", "resolved"]
  const DONE_TESTS   = ["Closed", "Completed", "Passed", "Pass"]
  const DONE_SUPPORT = ["Completed", "Closed"]
  const DONE_ACTIONS = ["Completed", "Closed", "Done"]
  const DONE_CRS     = ["Approved", "Completed", "Closed"]

  const [
    reqs, issues, testItems, support, actions, crs,
    reqsDone, issuesDone, testsDone, supportDone, actionsDone, crsDone,
    reqsOverdue, issuesOverdue, supportOverdue, actionsOverdue,
  ] = await Promise.all([
    // assigned in period
    db.requirement.findMany({  where: { createdDate: { gte: start, lte: end }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.issue.findMany({        where: { openDate:    { gte: start, lte: end }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.testItem.findMany({     where: { createdDate: { gte: start, lte: end }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.supportTicket.findMany({where: { createdDate: { gte: start, lte: end }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.actionItem.findMany({   where: { createdAt:   { gte: start, lte: end }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.changeRequest.findMany({where: { createdAt:   { gte: start, lte: end }, ownerId: { not: null } }, select: { ownerId: true } }),
    // completed in period (for on-time + resolution days)
    db.requirement.findMany({  where: { updatedAt: { gte: start, lte: end }, status: { in: DONE_REQS    }, ownerId: { not: null } }, select: { ownerId: true, targetDate: true, actualCompletion: true, createdDate: true } }),
    db.issue.findMany({        where: { updatedAt: { gte: start, lte: end }, status: { in: DONE_ISSUES  }, ownerId: { not: null } }, select: { ownerId: true, dueDate: true,    updatedAt: true,         openDate: true    } }),
    db.testItem.findMany({     where: { updatedAt: { gte: start, lte: end }, status: { in: DONE_TESTS   }, ownerId: { not: null } }, select: { ownerId: true, targetDate: true, updatedAt: true,         createdDate: true } }),
    db.supportTicket.findMany({where: { updatedAt: { gte: start, lte: end }, status: { in: DONE_SUPPORT }, ownerId: { not: null } }, select: { ownerId: true, targetDate: true, actualCompletion: true,  createdDate: true } }),
    db.actionItem.findMany({   where: { updatedAt: { gte: start, lte: end }, status: { in: DONE_ACTIONS }, ownerId: { not: null } }, select: { ownerId: true, dueDate: true,    updatedAt: true,         createdAt: true   } }),
    db.changeRequest.findMany({where: { updatedAt: { gte: start, lte: end }, status: { in: DONE_CRS     }, ownerId: { not: null } }, select: { ownerId: true, targetDate: true, actualCompletion: true,  createdAt: true   } }),
    // currently overdue (all-time, not restricted to period)
    db.requirement.findMany({  where: { targetDate: { lt: now }, status: { notIn: DONE_REQS    }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.issue.findMany({        where: { dueDate:    { lt: now }, status: { notIn: DONE_ISSUES  }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.supportTicket.findMany({where: { targetDate: { lt: now }, status: { notIn: DONE_SUPPORT }, ownerId: { not: null } }, select: { ownerId: true } }),
    db.actionItem.findMany({   where: { dueDate:    { lt: now }, status: { notIn: DONE_ACTIONS }, ownerId: { not: null } }, select: { ownerId: true } }),
  ])

  // Collect all owner IDs seen across all queries
  const allOwnerIds = new Set<string>(
    [reqs, issues, testItems, support, actions, crs,
     reqsDone, issuesDone, testsDone, supportDone, actionsDone, crsDone,
     reqsOverdue, issuesOverdue, supportOverdue, actionsOverdue]
      .flat().map((i) => i.ownerId!).filter(Boolean)
  )

  if (allOwnerIds.size === 0) return { period: label, periodType: period, owners: [] }

  const users = await db.user.findMany({ where: { id: { in: [...allOwnerIds] } }, select: { id: true, name: true } })
  const userMap = new Map(users.map((u) => [u.id, u.name]))

  // Aggregate counts per owner
  const inc = (map: Map<string, number>, ownerId: string | null) => {
    if (!ownerId) return
    map.set(ownerId, (map.get(ownerId) ?? 0) + 1)
  }

  const assignedMap  = new Map<string, number>()
  const completedMap = new Map<string, number>()
  const overdueMap   = new Map<string, number>()

  for (const items of [reqs, issues, testItems, support, actions, crs])
    items.forEach((i: { ownerId: string | null }) => inc(assignedMap, i.ownerId))
  for (const items of [reqsDone, issuesDone, testsDone, supportDone, actionsDone, crsDone])
    items.forEach((i: { ownerId: string | null }) => inc(completedMap, i.ownerId))
  for (const items of [reqsOverdue, issuesOverdue, supportOverdue, actionsOverdue])
    items.forEach((i: { ownerId: string | null }) => inc(overdueMap, i.ownerId))

  // On-time and resolution days per owner
  const onTimeMap = new Map<string, { onTime: number; withTarget: number }>()
  const resMap    = new Map<string, { total: number; count: number }>()

  const addOnTime = (items: any[], completedField: string, targetField: string) => {
    for (const i of items) {
      if (!i.ownerId) continue
      const entry = onTimeMap.get(i.ownerId) ?? { onTime: 0, withTarget: 0 }
      if (i[targetField]) {
        entry.withTarget++
        if (i[completedField] && new Date(i[completedField]) <= new Date(i[targetField])) entry.onTime++
      }
      onTimeMap.set(i.ownerId, entry)
    }
  }
  const addResolution = (items: any[], createdField: string, completedField: string) => {
    for (const i of items) {
      if (!i.ownerId || !i[createdField] || !i[completedField]) continue
      const days = Math.max(0, Math.round((new Date(i[completedField]).getTime() - new Date(i[createdField]).getTime()) / 86400000))
      const entry = resMap.get(i.ownerId) ?? { total: 0, count: 0 }
      entry.total += days; entry.count++
      resMap.set(i.ownerId, entry)
    }
  }

  addOnTime(reqsDone,     "actualCompletion", "targetDate")
  addOnTime(issuesDone,   "updatedAt",        "dueDate")
  addOnTime(testsDone,    "updatedAt",        "targetDate")
  addOnTime(supportDone,  "actualCompletion", "targetDate")
  addOnTime(actionsDone,  "updatedAt",        "dueDate")
  addOnTime(crsDone,      "actualCompletion", "targetDate")

  addResolution(reqsDone,    "createdDate", "actualCompletion")
  addResolution(issuesDone,  "openDate",    "updatedAt")
  addResolution(testsDone,   "createdDate", "updatedAt")
  addResolution(supportDone, "createdDate", "actualCompletion")
  addResolution(actionsDone, "createdAt",   "updatedAt")
  addResolution(crsDone,     "createdAt",   "actualCompletion")

  const ownerStats = [...allOwnerIds].map((ownerId) => {
    const name       = userMap.get(ownerId) ?? "Unknown"
    const assigned   = assignedMap.get(ownerId)  ?? 0
    const completed  = completedMap.get(ownerId)  ?? 0
    const overdue    = overdueMap.get(ownerId)    ?? 0
    const onTime     = onTimeMap.get(ownerId)     ?? { onTime: 0, withTarget: 0 }
    const resolution = resMap.get(ownerId)        ?? { total: 0, count: 0 }

    const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : (completed > 0 ? 100 : 0)
    const onTimeRate     = onTime.withTarget > 0 ? Math.round((onTime.onTime / onTime.withTarget) * 100) : null
    const avgDays        = resolution.count > 0 ? Math.round(resolution.total / resolution.count) : null

    // Score 0-100
    const completionScore  = Math.min(40, completionRate * 0.4)
    const onTimeScore      = onTimeRate !== null ? onTimeRate * 0.35 : (completed > 0 ? 25 : 0)
    const volumeBonus      = Math.min(10, assigned * 1.5)
    const overduePenalty   = Math.min(25, overdue * 5)
    const score            = Math.max(0, Math.round(completionScore + onTimeScore + volumeBonus - overduePenalty))

    const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Needs Attention"

    const problems: string[] = []
    if (overdue > 0)                                             problems.push(`${overdue} overdue item${overdue > 1 ? "s" : ""}`)
    if (completed === 0 && assigned > 0)                         problems.push("No completions this period")
    if (completionRate < 50 && assigned > 2)                     problems.push("Low completion rate")
    if (onTimeRate !== null && onTimeRate < 50 && completed > 1) problems.push("Frequent delays")

    return { ownerId, name, assigned, completed, overdue, completionRate, onTimeRate, avgDays, score, grade, problems }
  })

  ownerStats.sort((a, b) => b.score - a.score)
  return {
    period:     label,
    periodType: period,
    owners:     ownerStats.map((o, i) => ({ ...o, rank: i + 1 })),
  }
}
