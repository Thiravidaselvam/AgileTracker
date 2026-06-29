import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, itemId } = await params
  const body = await req.json()

  const item = await db.goLiveItem.update({
    where: { id: itemId },
    data: {
      ...(body.phase       !== undefined && { phase: body.phase }),
      ...(body.category    !== undefined && { category: body.category }),
      ...(body.task        !== undefined && { task: body.task }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.owner       !== undefined && { owner: body.owner || null }),
      ...(body.dueDateTime !== undefined && { dueDateTime: body.dueDateTime ? new Date(body.dueDateTime) : null }),
      ...(body.priority    !== undefined && { priority: body.priority }),
      ...(body.status      !== undefined && { status: body.status }),
      ...(body.dependency  !== undefined && { dependency: body.dependency || null }),
      ...(body.remarks     !== undefined && { remarks: body.remarks || null }),
      ...(body.order       !== undefined && { order: body.order }),
    },
  })

  // sync checklist status on individual item update
  const items = await db.goLiveItem.findMany({ where: { checklistId: id }, select: { status: true } })
  if (items.length) {
    const allDone = items.every((i: { status: string }) => i.status === "Done" || i.status === "Skipped")
    const anyInProgress = items.some((i: { status: string }) => i.status === "In Progress")
    const newStatus = allDone ? "Completed" : anyInProgress ? "Active" : undefined
    if (newStatus) {
      await db.goLiveChecklist.update({ where: { id }, data: { status: newStatus } })
    }
  }

  return NextResponse.json(item)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { itemId } = await params
  await db.goLiveItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
