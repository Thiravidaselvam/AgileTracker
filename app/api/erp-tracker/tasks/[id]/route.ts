import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const task = await db.erpTask.update({
    where: { id },
    data: {
      ...(body.status  !== undefined && { status:  body.status  }),
      ...(body.owner   !== undefined && { owner:   body.owner   || null }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.notes   !== undefined && { notes:   body.notes   || null }),
    },
  })

  return NextResponse.json(task)
}
