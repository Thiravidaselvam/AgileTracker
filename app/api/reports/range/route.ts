import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateRangeReport } from "@/lib/reports/generate-report"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const from = req.nextUrl.searchParams.get("from")
    const to   = req.nextUrl.searchParams.get("to")
    if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 })

    const report = await generateRangeReport(new Date(from), new Date(to))
    return NextResponse.json(report)
  } catch (err) {
    console.error("[/api/reports/range]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
