import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = join(process.cwd(), "uploads", "erp-docs")
  await mkdir(uploadDir, { recursive: true })

  const safeName = `${id}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
  await writeFile(join(uploadDir, safeName), buffer)

  const doc = await db.erpDocument.update({
    where: { id },
    data: {
      fileName: safeName,
      fileSize: file.size,
      uploadedAt: new Date(),
    },
  })

  return NextResponse.json({ fileName: doc.fileName, fileSize: doc.fileSize, uploadedAt: doc.uploadedAt })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const doc = await db.erpDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (doc.fileName) {
    const filePath = join(process.cwd(), "uploads", "erp-docs", doc.fileName)
    try { await unlink(filePath) } catch { /* file already gone, that's fine */ }
  }

  await db.erpDocument.update({
    where: { id },
    data: { fileName: null, fileSize: null, uploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}
