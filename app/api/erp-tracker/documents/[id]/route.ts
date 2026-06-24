import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir, unlink, readFile } from "fs/promises"
import { join } from "path"

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

// POST — upload a file for this document
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    data: { fileName: safeName, fileSize: file.size, uploadedAt: new Date() },
  })

  return NextResponse.json({ fileName: doc.fileName, fileSize: doc.fileSize, uploadedAt: doc.uploadedAt })
}

// DELETE — remove the uploaded file for this document
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const doc = await db.erpDocument.findUnique({ where: { id } })
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (doc.fileName) {
    try { await unlink(join(process.cwd(), "uploads", "erp-docs", doc.fileName)) } catch { /* already gone */ }
  }

  await db.erpDocument.update({
    where: { id },
    data: { fileName: null, fileSize: null, uploadedAt: null },
  })

  return NextResponse.json({ ok: true })
}

// GET — download the uploaded file OR sample template (via ?type=sample)
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
    const content = Buffer.from(sample.content, "utf-8")
    return new NextResponse(content, {
      headers: {
        "Content-Disposition": `attachment; filename="${sample.filename}"`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  }

  // Download uploaded file
  if (!doc.fileName) return NextResponse.json({ error: "No file uploaded" }, { status: 404 })
  const filePath = join(process.cwd(), "uploads", "erp-docs", doc.fileName)
  let buffer: Buffer
  try { buffer = await readFile(filePath) } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
  }
  const originalName = doc.fileName.replace(/^[^_]+_/, "")
  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${originalName}"`,
      "Content-Type": "application/octet-stream",
    },
  })
}
