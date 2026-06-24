import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const DOC_STATUSES = ["Pending", "In Progress", "Done", "Skipped"]

// PATCH — update status / preparedBy / notes
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const doc = await db.erpDocument.update({
    where: { id },
    data: {
      ...(body.status     !== undefined && { status:     DOC_STATUSES.includes(body.status) ? body.status : "Pending" }),
      ...(body.preparedBy !== undefined && { preparedBy: body.preparedBy || null }),
      ...(body.notes      !== undefined && { notes:      body.notes      || null }),
    },
  })

  return NextResponse.json(doc)
}

// POST — upload a file (stored in DB as bytes)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const bytes = Buffer.from(arrayBuffer)

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

// DELETE — remove the uploaded file
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await db.erpDocument.update({
    where: { id },
    data: { fileName: null, fileSize: null, fileData: null, uploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}

// GET — download uploaded file (?type=download) or sample template (?type=sample)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const type = req.nextUrl.searchParams.get("type")

  const doc = await db.erpDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (type === "sample") {
    const { ERP_SAMPLES } = await import("@/lib/erp-document-samples")
    const sample = ERP_SAMPLES[doc.docNumber]
    if (!sample) return NextResponse.json({ error: "No sample" }, { status: 404 })
    return new NextResponse(sample.content, {
      headers: {
        "Content-Disposition": `attachment; filename="${sample.filename}"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  }

  // Download uploaded file from DB
  if (!doc.fileData || !doc.fileName) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 404 })
  }

  const ab = (doc.fileData as Buffer).buffer.slice(
    (doc.fileData as Buffer).byteOffset,
    (doc.fileData as Buffer).byteOffset + (doc.fileData as Buffer).byteLength
  ) as ArrayBuffer

  return new NextResponse(new Blob([ab]), {
    headers: {
      "Content-Disposition": `attachment; filename="${doc.fileName}"`,
      "Content-Type": "application/octet-stream",
    },
  })
}
