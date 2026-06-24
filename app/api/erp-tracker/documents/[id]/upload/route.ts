import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

  const bytes = Buffer.from(await file.arrayBuffer())

  const doc = await db.erpDocument.update({
    where: { id },
    data: {
      fileName:  file.name,
      fileSize:  file.size,
      fileData:  bytes,
      uploadedAt: new Date(),
    },
  })

  return NextResponse.json({
    fileName:  doc.fileName,
    fileSize:  doc.fileSize,
    uploadedAt: doc.uploadedAt,
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.erpDocument.update({
    where: { id },
    data: { fileName: null, fileSize: null, fileData: null, uploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}
