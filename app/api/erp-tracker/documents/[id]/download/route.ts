import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFile } from "fs/promises"
import { join } from "path"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const doc = await db.erpDocument.findUnique({ where: { id } })
  if (!doc || !doc.fileName) {
    return NextResponse.json({ error: "No uploaded file found" }, { status: 404 })
  }

  const filePath = join(process.cwd(), "uploads", "erp-docs", doc.fileName)
  let fileBuffer: Buffer
  try {
    fileBuffer = await readFile(filePath)
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
  }

  const originalName = doc.fileName.replace(/^[^_]+_/, "")
  return new NextResponse(new Blob([fileBuffer]), {
    headers: {
      "Content-Disposition": `attachment; filename="${originalName}"`,
      "Content-Type": "application/octet-stream",
      "Content-Length": String(fileBuffer.length),
    },
  })
}
