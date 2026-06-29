import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Admin only" }, { status: 403 })

  // Delete in FK-safe order (children first)
  await db.progressLog.deleteMany({})
  await db.reportShare.deleteMany({})
  await db.testItem.deleteMany({})
  await db.requirement.deleteMany({})
  await db.issue.deleteMany({})
  await db.sprint.deleteMany({})
  await db.supportTicket.deleteMany({})
  await db.actionItem.deleteMany({})

  return NextResponse.json({ ok: true, message: "All tracker data cleared. Users preserved." })
}
