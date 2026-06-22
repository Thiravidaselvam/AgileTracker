import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const item = await db.issue.update({
    where: { id },
    data: {
      module:      body.module      ?? "",
      description: body.description,
      severity:    body.severity,
      reportedBy:  body.reportedBy,
      ownerId:     body.ownerId     ?? null,
      status:      body.status,
      dueDate:     body.dueDate     ? new Date(body.dueDate) : null,
      resolution:  body.resolution  ?? null,
    },
    include: { owner: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.issue.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
