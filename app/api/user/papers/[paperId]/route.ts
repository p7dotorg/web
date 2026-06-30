import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { userPapers } from "@/db/schema"
import { getSessionFromRequest } from "@/lib/session"
import { eq, and } from "drizzle-orm"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const session = await getSessionFromRequest(req)
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { paperId } = await params
  const { status } = await req.json()

  const valid = ["reading", "read", "want_to_read"]
  if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  const [row] = await db
    .update(userPapers)
    .set({ status })
    .where(and(eq(userPapers.userId, session.id), eq(userPapers.paperId, paperId)))
    .returning()

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(row)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const session = await getSessionFromRequest(req)
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { paperId } = await params

  await db
    .delete(userPapers)
    .where(and(eq(userPapers.userId, session.id), eq(userPapers.paperId, paperId)))

  return NextResponse.json({ ok: true })
}
