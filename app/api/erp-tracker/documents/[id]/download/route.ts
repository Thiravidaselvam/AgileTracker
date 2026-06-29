import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const doc = await db.erpDocument.findUnique({ where: { id } })
  if (!doc || !doc.fileName || !doc.fileData) {
    return NextResponse.json({ error: "No uploaded file found" }, { status: 404 })
  }

  const buf = doc.fileData as Buffer
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer

  return new NextResponse(new Blob([ab]), {
    headers: {
      "Content-Disposition": `attachment; filename="${doc.fileName}"`,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(buf.length),
    },
  })
}
