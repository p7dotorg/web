import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { comments } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { getSessionFromRequest } from "@/lib/session"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.annotationId, id))
    .orderBy(asc(comments.createdAt))
  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSessionFromRequest(req)
    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { body } = await req.json()

    if (!body?.trim()) {
      return NextResponse.json({ error: "Missing body" }, { status: 400 })
    }

    const [row] = await db.insert(comments).values({
      annotationId: id,
      authorId: session.email,
      authorName: session.name,
      body: body.trim(),
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error("comment error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
