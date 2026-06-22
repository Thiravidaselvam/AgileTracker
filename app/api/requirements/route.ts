import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get("status")
  const priority = searchParams.get("priority")
  const search   = searchParams.get("search")

  const where: any = {}
  if (status)   where.status   = status
  if (priority) where.priority = priority
  if (search)   where.OR = [
    { requirement: { contains: search, mode: "insensitive" } },
    { module:      { contains: search, mode: "insensitive" } },
    { reqId:       { contains: search, mode: "insensitive" } },
  ]

  const items = await db.requirement.findMany({
    where,
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { createdDate: "desc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Auto-generate reqId if not provided
  if (!body.reqId) {
    const count = await db.requirement.count()
    body.reqId = `REQ-${String(count + 1).padStart(3, "0")}`
  }

  const item = await db.requirement.create({
    data: {
      reqId:            body.reqId,
      module:           body.module,
      requirement:      body.requirement,
      requestor:        body.requestor,
      priority:         body.priority  ?? "MEDIUM",
      status:           body.status    ?? "Open",
      ownerId:          body.ownerId   ?? null,
      createdDate:      body.createdDate ? new Date(body.createdDate) : new Date(),
      targetDate:       body.targetDate  ? new Date(body.targetDate)  : null,
      actualCompletion: body.actualCompletion ? new Date(body.actualCompletion) : null,
      remarks:          body.remarks    ?? null,
    },
    include: { owner: { select: { id: true, name: true } } },
  })

  return NextResponse.json(item, { status: 201 })
}
