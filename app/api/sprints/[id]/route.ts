import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const planned   = body.plannedStories   ?? 0
  const completed = body.completedStories ?? 0
  const item = await db.sprint.update({
    where: { id },
    data: {
      sprintName: body.sprintName, startDate: new Date(body.startDate),
      endDate: new Date(body.endDate), plannedStories: planned,
      completedStories: completed, velocityPct: planned > 0 ? (completed / planned) * 100 : 0,
      sprintStatus: body.sprintStatus,
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.sprint.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
