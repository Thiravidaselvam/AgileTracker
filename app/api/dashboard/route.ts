import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { subDays, format } from "date-fns"

const REQ_DONE    = ["Fixed", "Closed", "Completed"]
const ISSUE_DONE  = ["completed", "closed", "resolved"]   // was missing "resolved"
const TEST_DONE   = ["Closed", "Completed", "Passed"]
const SUP_DONE    = ["Completed", "Closed"]
const ACTION_DONE = ["Completed", "Closed", "Done"]

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId  = searchParams.get("userId")  || undefined
  const fromStr = searchParams.get("from")
  const toStr   = searchParams.get("to")
  const from    = fromStr ? new Date(fromStr) : undefined
  const to      = toStr   ? new Date(new Date(toStr).setHours(23, 59, 59, 999)) : undefined

  const today = new Date()

  // Each model uses its own meaningful date field, not the generic createdAt
  const mkDate = (field: string) =>
    (from || to)
      ? { [field]: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}

  const ownerWhere = userId ? { ownerId: userId } : {}

  // Model-specific base where clauses
  const reqBase     = { ...mkDate("createdDate"), ...ownerWhere }
  const issueBase   = { ...mkDate("openDate"),    ...ownerWhere }
  const testBase    = { ...mkDate("createdDate"), ...ownerWhere }
  const supportBase = { ...mkDate("createdDate"), ...ownerWhere }
  const actionBase  = { ...mkDate("createdAt"),   ...ownerWhere }
  const crBase      = { ...mkDate("createdAt"),   ...ownerWhere }

  // Date-only (no owner filter) for user-progress table
  const reqDateOnly     = mkDate("createdDate")
  const issueDateOnly   = mkDate("openDate")
  const testDateOnly    = mkDate("createdDate")
  const supportDateOnly = mkDate("createdDate")
  const actionDateOnly  = mkDate("createdAt")

  const [
    totalRequirements,
    openRequirements,
    totalIssues,
    openIssues,
    totalTestItems,
    openTestItems,
    openSupport,
    openActions,
    latestSprint,
    issues,
    requirements,
    sprints,
    overdueReqs,
    overdueIssues,
    overdueTests,
    overdueActions,
    openChangeRequests,
    pendingSignOffs,
    totalSignOffItems,
    allUsers,
    allReqs,
    allIssuesForUsers,
    allTests,
    allSupport,
    allActions,
  ] = await Promise.all([
    db.requirement.count({ where: reqBase }),
    db.requirement.count({ where: { ...reqBase, status: { notIn: REQ_DONE } } }),

    db.issue.count({ where: issueBase }),
    db.issue.count({ where: { ...issueBase, status: { notIn: ISSUE_DONE } } }),

    db.testItem.count({ where: testBase }),
    db.testItem.count({ where: { ...testBase, status: { notIn: TEST_DONE } } }),

    db.supportTicket.count({ where: { ...supportBase, status: { notIn: SUP_DONE } } }),
    db.actionItem.count({ where: { ...actionBase, status: { notIn: ACTION_DONE } } }),

    db.sprint.findFirst({ orderBy: { startDate: "desc" } }),

    db.issue.findMany({
      where: issueBase,
      select: {
        severity: true, status: true, ownerId: true,
        owner: { select: { name: true } },
        openDate: true, updatedAt: true,
      },
    }),

    db.requirement.findMany({ where: reqBase, select: { status: true } }),
    db.sprint.findMany({ orderBy: { startDate: "asc" }, take: 10 }),

    db.requirement.count({ where: { ...reqBase,     targetDate: { lt: today }, status: { notIn: REQ_DONE    } } }),
    db.issue.count({       where: { ...issueBase,   dueDate:    { lt: today }, status: { notIn: ISSUE_DONE  } } }),
    db.testItem.count({    where: { ...testBase,    targetDate: { lt: today }, status: { notIn: TEST_DONE   } } }),
    db.actionItem.count({  where: { ...actionBase,  dueDate:    { lt: today }, status: { notIn: ACTION_DONE } } }),

    db.changeRequest.count({ where: { ...crBase, status: { notIn: ["Implemented", "Rejected", "Deferred"] } } }),

    db.signOffItem.count({ where: { status: { notIn: ["Approved"] } } }),
    db.signOffItem.count(),

    // User progress — all users (no userId filter so every member always appears)
    db.user.findMany({ select: { id: true, name: true, role: true }, orderBy: { name: "asc" } }),
    db.requirement.findMany({  where: reqDateOnly,     select: { ownerId: true, status: true } }),
    db.issue.findMany({        where: issueDateOnly,   select: { ownerId: true, status: true } }),
    db.testItem.findMany({     where: testDateOnly,    select: { ownerId: true, status: true } }),
    db.supportTicket.findMany({where: supportDateOnly, select: { ownerId: true, status: true } }),
    db.actionItem.findMany({   where: actionDateOnly,  select: { ownerId: true, status: true } }),
  ])

  const nextGoLive = await db.goLiveChecklist.findFirst({
    where: { status: { notIn: ["Completed", "Cancelled"] } },
    orderBy: { goLiveDate: "asc" },
    select: { goLiveDate: true, title: true },
  })

  // --- Charts ---

  const severityMap: Record<string, number> = {}
  issues.forEach((i: { severity: string; status: string; openDate: Date; updatedAt: Date; owner: { name: string } | null }) => {
    severityMap[i.severity] = (severityMap[i.severity] ?? 0) + 1
  })
  const severityData = Object.entries(severityMap).map(([name, value]) => ({ name, value }))

  const statusMap: Record<string, number> = {}
  requirements.forEach((r: { status: string | null }) => {
    const s = r.status ?? "Open"
    statusMap[s] = (statusMap[s] ?? 0) + 1
  })
  const reqStatusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  const velocityData = sprints.map((s: { sprintName: string; plannedStories: number; completedStories: number; velocityPct: number }) => ({
    sprint:    s.sprintName,
    planned:   s.plannedStories,
    completed: s.completedStories,
    velocity:  s.velocityPct,
  }))

  const timelineMap: Record<string, { opened: number; resolved: number }> = {}
  for (let d = 13; d >= 0; d--) {
    timelineMap[format(subDays(today, d), "MM/dd")] = { opened: 0, resolved: 0 }
  }
  issues.forEach((i: { severity: string; status: string; openDate: Date; updatedAt: Date; owner: { name: string } | null }) => {
    const openKey = format(new Date(i.openDate), "MM/dd")
    if (timelineMap[openKey]) timelineMap[openKey].opened++
    if (ISSUE_DONE.includes(i.status.toLowerCase())) {
      const closeKey = format(new Date(i.updatedAt), "MM/dd")
      if (timelineMap[closeKey]) timelineMap[closeKey].resolved++
    }
  })
  const timelineData = Object.entries(timelineMap).map(([date, v]) => ({ date, ...v }))

  const ownerMap: Record<string, number> = {}
  issues.forEach((i: { severity: string; status: string; openDate: Date; updatedAt: Date; owner: { name: string } | null }) => {
    if (i.owner && !ISSUE_DONE.includes(i.status.toLowerCase())) {
      ownerMap[i.owner.name] = (ownerMap[i.owner.name] ?? 0) + 1
    }
  })
  const ownerData = Object.entries(ownerMap)
    .map(([owner, open]) => ({ owner, open }))
    .sort((a, b) => b.open - a.open)
    .slice(0, 8)

  // --- User progress table ---
  const isDone = (status: string, doneList: string[]) =>
    doneList.includes(status) || doneList.includes(status.toLowerCase())

  const userProgress = allUsers.map((u: { id: string; name: string; role: string }) => {
    const countBy = <T extends { ownerId: string | null; status: string }>(
      items: T[], doneList: string[]
    ) => {
      const mine   = items.filter((x) => x.ownerId === u.id)
      const open   = mine.filter((x) => !isDone(x.status, doneList)).length
      const closed = mine.length - open
      return { open, closed, total: mine.length }
    }
    return {
      userId: u.id,
      name:   u.name,
      role:   u.role,
      requirements: countBy(allReqs,           REQ_DONE),
      issues:       countBy(allIssuesForUsers,  ISSUE_DONE),
      testItems:    countBy(allTests,           TEST_DONE),
      support:      countBy(allSupport,         SUP_DONE),
      actions:      countBy(allActions,         ACTION_DONE),
    }
  })

  return NextResponse.json({
    kpi: {
      totalRequirements,
      openRequirements,
      totalIssues,
      openIssues,
      totalTestItems,
      openTestItems,
      overdueItems: overdueReqs + overdueIssues + overdueTests + overdueActions,
      latestVelocity: latestSprint?.velocityPct ?? 0,
      latestSprintName: latestSprint?.sprintName ?? "—",
      openSupport,
      openActions,
      openChangeRequests,
      pendingSignOffs,
      signOffProgress: totalSignOffItems > 0 ? Math.round(((totalSignOffItems - pendingSignOffs) / totalSignOffItems) * 100) : 0,
      nextGoLiveDate: nextGoLive?.goLiveDate ?? null,
      nextGoLiveTitle: nextGoLive?.title ?? null,
      daysToGoLive: nextGoLive ? Math.ceil((new Date(nextGoLive.goLiveDate).getTime() - Date.now()) / 86400000) : null,
    },
    charts: { severityData, reqStatusData, velocityData, timelineData, ownerData },
    userProgress,
  })
}
