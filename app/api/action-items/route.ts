import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const where: any = {}
  if (status) where.status = status
  const items = await db.actionItem.findMany({
    where,
    include: { owner: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const item = await db.actionItem.create({
    data: {
      type:        body.type,
      description: body.description,
      ownerId:     body.ownerId ?? null,
      dueDate:     body.dueDate ? new Date(body.dueDate) : null,
      status:      body.status  ?? "Open",
    },
    include: { owner: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item, { status: 201 })
}
