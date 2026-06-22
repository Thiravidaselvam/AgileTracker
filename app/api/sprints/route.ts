import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const items = await db.sprint.findMany({ orderBy: { startDate: "desc" } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const planned   = body.plannedStories   ?? 0
  const completed = body.completedStories ?? 0
  const item = await db.sprint.create({
    data: {
      sprintName:       body.sprintName,
      startDate:        new Date(body.startDate),
      endDate:          new Date(body.endDate),
      plannedStories:   planned,
      completedStories: completed,
      velocityPct:      planned > 0 ? (completed / planned) * 100 : 0,
      sprintStatus:     body.sprintStatus ?? "Planning",
    },
  })
  return NextResponse.json(item, { status: 201 })
}
