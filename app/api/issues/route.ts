import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { differenceInDays } from "date-fns"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get("status")
  const severity = searchParams.get("severity")
  const search   = searchParams.get("search")

  const where: any = {}
  if (status)   where.status   = status
  if (severity) where.severity = severity
  if (search)   where.OR = [
    { description: { contains: search, mode: "insensitive" } },
    { issueId:     { contains: search, mode: "insensitive" } },
  ]

  const items = await db.issue.findMany({
    where,
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { openDate: "desc" },
  })

  // Update daysOpen in memory for display
  const enriched = items.map((i) => ({
    ...i,
    daysOpen: differenceInDays(new Date(), new Date(i.openDate)),
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()

  if (!body.issueId) {
    const count = await db.issue.count()
    body.issueId = `ISS-${String(count + 1).padStart(3, "0")}`
  }

  const openDate = body.openDate ? new Date(body.openDate) : new Date()
  const item = await db.issue.create({
    data: {
      issueId:     body.issueId,
      module:      body.module      ?? "",
      description: body.description,
      severity:    body.severity    ?? "MEDIUM",
      reportedBy:  body.reportedBy,
      ownerId:     body.ownerId     ?? null,
      status:      body.status      ?? "Open",
      openDate,
      dueDate:     body.dueDate     ? new Date(body.dueDate) : null,
      daysOpen:    differenceInDays(new Date(), openDate),
      resolution:  body.resolution  ?? null,
    },
    include: { owner: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item, { status: 201 })
}
