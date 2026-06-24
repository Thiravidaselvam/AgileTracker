import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ERP_SAMPLES } from "@/lib/erp-document-samples"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const doc = await db.erpDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

  const sample = ERP_SAMPLES[doc.docNumber]
  if (!sample) {
    return NextResponse.json({ error: "No sample available for this document" }, { status: 404 })
  }

  const content = new TextEncoder().encode(sample.content)
  return new NextResponse(content, {
    headers: {
      "Content-Disposition": `attachment; filename="${sample.filename}"`,
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": String(content.length),
    },
  })
}
