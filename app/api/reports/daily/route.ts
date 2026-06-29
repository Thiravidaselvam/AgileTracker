import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateDailyReport } from "@/lib/reports/generate-report"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const date = req.nextUrl.searchParams.get("date")
  const report = await generateDailyReport(date ? new Date(date) : new Date())
  return NextResponse.json(report)
}
