import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const ACTIVE = ["Open", "In Progress"]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [actionItems, issues, requirements, testItems, support] = await Promise.all([
    db.actionItem.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: { dueDate: "asc" },
      take: 10,
      select: { id: true, type: true, description: true, status: true, dueDate: true },
    }),
    db.issue.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: { openDate: "desc" },
      take: 10,
      select: { id: true, issueId: true, description: true, status: true, severity: true, dueDate: true },
    }),
    db.requirement.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: { createdDate: "desc" },
      take: 10,
      select: { id: true, reqId: true, requirement: true, status: true, priority: true, targetDate: true },
    }),
    db.testItem.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: { createdDate: "desc" },
      take: 10,
      select: { id: true, testId: true, issueTitle: true, status: true, priority: true, targetDate: true },
    }),
    db.supportTicket.findMany({
      where: { status: { in: ACTIVE } },
      orderBy: { createdDate: "desc" },
      take: 10,
      select: { id: true, customer: true, requirement: true, status: true, priority: true, targetDate: true },
    }),
  ])

  const total =
    actionItems.length + issues.length + requirements.length + testItems.length + support.length

  return NextResponse.json({ total, actionItems, issues, requirements, testItems, support })
}
