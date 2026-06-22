import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generatePerformanceReport } from "@/lib/reports/generate-report"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const period = req.nextUrl.searchParams.get("period") ?? "monthly"
  const dateParam = req.nextUrl.searchParams.get("date")
  const report = await generatePerformanceReport(period, dateParam ? new Date(dateParam) : new Date())
  return NextResponse.json(report)
}
