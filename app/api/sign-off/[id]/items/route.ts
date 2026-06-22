import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Auto-assign sno within this document
  const maxSno = await db.signOffItem.aggregate({ where: { documentId: id }, _max: { sno: true } })
  const sno = (maxSno._max.sno ?? 0) + 1

  const item = await db.signOffItem.create({
    data: {
      documentId:  id,
      sno:         body.sno ?? sno,
      section:     body.section,
      menuItem:    body.menuItem,
      description: body.description ?? null,
      status:      body.status      ?? "Pending",
      approvedBy:  body.approvedBy  ?? null,
      signOffDate: body.signOffDate ? new Date(body.signOffDate) : null,
      remarks:     body.remarks     ?? null,
    },
  })

  return NextResponse.json(item, { status: 201 })
}

// Bulk operations (approve, status change)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { itemIds, status, approvedBy, signOffDate } = await req.json()

  await db.signOffItem.updateMany({
    where: { id: { in: itemIds }, documentId: id },
    data: {
      status,
      ...(approvedBy  ? { approvedBy }  : {}),
      ...(signOffDate ? { signOffDate: new Date(signOffDate) } : {}),
    },
  })

  // If all items approved → auto-update document status to Completed
  const allItems = await db.signOffItem.findMany({ where: { documentId: id }, select: { status: true } })
  const allApproved = allItems.length > 0 && allItems.every((i) => i.status === "Approved")
  if (allApproved) await db.signOffDocument.update({ where: { id }, data: { status: "Completed" } })
  else await db.signOffDocument.update({ where: { id }, data: { status: "In Progress" } })

  return NextResponse.json({ updated: itemIds.length })
}
