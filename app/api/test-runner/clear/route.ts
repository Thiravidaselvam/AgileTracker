import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const r = await db.testItem.updateMany({ data: { status: "Open" } })
    return NextResponse.json({ ok: true, cleared: r.count })
  } catch (err: any) {
    console.error("[test-runner/clear]", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
