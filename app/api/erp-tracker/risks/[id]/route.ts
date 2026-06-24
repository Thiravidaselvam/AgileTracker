import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const risk = await db.erpRisk.update({
    where: { id },
    data: {
      ...(body.status      !== undefined && { status:      body.status      }),
      ...(body.probability !== undefined && { probability: body.probability  }),
      ...(body.impact      !== undefined && { impact:      body.impact       }),
      ...(body.mitigation  !== undefined && { mitigation:  body.mitigation  || null }),
    },
  })

  return NextResponse.json(risk)
}
