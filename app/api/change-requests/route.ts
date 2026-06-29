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
    { title:       { contains: search, mode: "insensitive" } },
    { crId:        { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
  ]

  const items = await db.changeRequest.findMany({
    where,
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (!body.crId) {
    const count = await db.changeRequest.count()
    body.crId = `CR-${String(count + 1).padStart(4, "0")}`
  }

  const item = await db.changeRequest.create({
    data: {
      crId:            body.crId,
      title:           body.title,
      description:     body.description,
      reason:          body.reason,
      impact:          body.impact          ?? null,
      priority:        body.priority        ?? "MEDIUM",
      status:          body.status          ?? "Submitted",
      requestedBy:     body.requestedBy,
      ownerId:         body.ownerId         ?? null,
      estimatedEffort: body.estimatedEffort ?? null,
      targetDate:      body.targetDate      ? new Date(body.targetDate) : null,
      remarks:         body.remarks         ?? null,
    },
    include: { owner: { select: { id: true, name: true } } },
  })

  return NextResponse.json(item, { status: 201 })
}
