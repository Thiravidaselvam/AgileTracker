import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { phase, category, task, description, owner, dueDateTime, priority, status, dependency, remarks, order } = body

  if (!phase || !category || !task) {
    return NextResponse.json({ error: "phase, category, task required" }, { status: 400 })
  }

  const item = await db.goLiveItem.create({
    data: {
      checklistId: id,
      phase,
      category,
      task,
      description: description || null,
      owner: owner || null,
      dueDateTime: dueDateTime ? new Date(dueDateTime) : null,
      priority: priority || "High",
      status: status || "Not Started",
      dependency: dependency || null,
      remarks: remarks || null,
      order: order ?? 0,
    },
  })

  await syncChecklistStatus(id)
  return NextResponse.json(item, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { itemIds, status } = body

  if (!itemIds?.length || !status) {
    return NextResponse.json({ error: "itemIds and status required" }, { status: 400 })
  }

  await db.goLiveItem.updateMany({
    where: { id: { in: itemIds }, checklistId: id },
    data: { status },
  })

  await syncChecklistStatus(id)
  return NextResponse.json({ ok: true })
}

async function syncChecklistStatus(checklistId: string) {
  const items = await db.goLiveItem.findMany({ where: { checklistId }, select: { status: true } })
  if (!items.length) return
  const allDone = items.every((i) => i.status === "Done" || i.status === "Skipped")
  const anyInProgress = items.some((i) => i.status === "In Progress")
  const newStatus = allDone ? "Completed" : anyInProgress ? "Active" : undefined
  if (newStatus) {
    await db.goLiveChecklist.update({ where: { id: checklistId }, data: { status: newStatus } })
  }
}
