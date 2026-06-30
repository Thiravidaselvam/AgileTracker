import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const item = await db.testItem.update({
    where: { id },
    data: {
      module: body.module, subModule: body.subModule ?? null,
      issueTitle: body.issueTitle, description: body.description,
      testedBy: body.testedBy, priority: body.priority, status: body.status,
      ownerId: body.ownerId ?? null,
      targetDate:       body.targetDate       ? new Date(body.targetDate)       : null,
      actualCompletion: body.actualCompletion ? new Date(body.actualCompletion) : null,
      linkedIssueId: body.linkedIssueId ?? null,
    },
    include: { owner: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.testItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
