import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ERP_TEMPLATE } from "@/lib/erp-tracker-template"

const INCLUDE = {
  phases: {
    orderBy: { order: "asc" as const },
    include: {
      tasks: { orderBy: [{ order: "asc" as const }] },
    },
  },
  documents: { orderBy: { docNumber: "asc" as const } },
  risks:     { orderBy: { riskNumber: "asc" as const } },
}

async function initProject() {
  return db.$transaction(async (tx) => {
    const proj = await tx.erpProject.create({ data: {} })

    for (const phaseData of ERP_TEMPLATE.phases) {
      const phase = await tx.erpPhase.create({
        data: {
          projectId:   proj.id,
          phaseNumber: phaseData.phaseNumber,
          phaseName:   phaseData.phaseName,
          order:       phaseData.order,
        },
      })
      if (phaseData.tasks.length > 0) {
        await tx.erpTask.createMany({
          data: phaseData.tasks.map((t) => ({ ...t, phaseId: phase.id })),
        })
      }
    }

    await tx.erpDocument.createMany({
      data: ERP_TEMPLATE.documents.map((d) => ({ ...d, projectId: proj.id })),
    })

    await tx.erpRisk.createMany({
      data: ERP_TEMPLATE.risks.map((r) => ({ ...r, projectId: proj.id })),
    })

    return tx.erpProject.findUnique({ where: { id: proj.id }, include: INCLUDE })
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let project = await db.erpProject.findFirst({ include: INCLUDE })
  if (!project) project = await initProject()

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const project = await db.erpProject.findFirst()
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await db.erpProject.update({
    where: { id: project.id },
    data: {
      ...(body.projectName !== undefined && { projectName: body.projectName }),
      ...(body.clientName  !== undefined && { clientName:  body.clientName  }),
      ...(body.erpSoftware !== undefined && { erpSoftware: body.erpSoftware }),
      ...(body.partner     !== undefined && { partner:     body.partner     }),
      ...(body.startDate   !== undefined && { startDate:   body.startDate   ? new Date(body.startDate)  : null }),
      ...(body.goLiveDate  !== undefined && { goLiveDate:  body.goLiveDate  ? new Date(body.goLiveDate) : null }),
      ...(body.pm          !== undefined && { pm:          body.pm    || null }),
      ...(body.clientPoc   !== undefined && { clientPoc:   body.clientPoc || null }),
      ...(body.notes       !== undefined && { notes:       body.notes || null }),
    },
  })

  return NextResponse.json(updated)
}
