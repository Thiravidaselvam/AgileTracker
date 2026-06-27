import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { module, permission, value } = await req.json()

  const allowed = ["canView", "canCreate", "canEdit", "canDelete"]
  if (!allowed.includes(permission))
    return NextResponse.json({ error: "Invalid permission field" }, { status: 400 })

  await db.customRolePermission.upsert({
    where:  { roleId_module: { roleId: id, module } },
    update: { [permission]: value },
    create: { roleId: id, module, canView: true, canCreate: true, canEdit: true, canDelete: false, [permission]: value },
  })

  return NextResponse.json({ success: true })
}