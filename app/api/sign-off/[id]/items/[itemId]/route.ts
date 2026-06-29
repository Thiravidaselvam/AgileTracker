import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, itemId } = await params
  const body = await req.json()

  const item = await db.signOffItem.update({
    where: { id: itemId, documentId: id },
    data: {
      section:     body.section,
      menuItem:    body.menuItem,
      description: body.description ?? null,
      status:      body.status,
      approvedBy:  body.approvedBy  ?? null,
      signOffDate: body.signOffDate ? new Date(body.signOffDate) : null,
      remarks:     body.remarks     ?? null,
    },
  })

  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, itemId } = await params
  await db.signOffItem.delete({ where: { id: itemId, documentId: id } })
  return NextResponse.json({ success: true })
}
