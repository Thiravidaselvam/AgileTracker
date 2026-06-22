import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const checklist = await db.goLiveChecklist.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ phase: "asc" }, { order: "asc" }, { createdAt: "asc" }] },
    },
  })
  if (!checklist) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(checklist)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, project, goLiveDate, description, status } = body

  const updated = await db.goLiveChecklist.update({
    where: { id },
    data: {
      ...(title       && { title }),
      ...(project     && { project }),
      ...(goLiveDate  && { goLiveDate: new Date(goLiveDate) }),
      ...(description !== undefined && { description }),
      ...(status      && { status }),
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.goLiveChecklist.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
