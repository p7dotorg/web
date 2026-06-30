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
    const { body, authorName: bodyName } = await req.json()

    const resolvedName = session?.name ?? bodyName
    const resolvedId = session?.email ?? "anon"

    if (!body?.trim() || !resolvedName?.trim()) {
      return NextResponse.json({ error: "Missing body or author" }, { status: 400 })
    }

    const [row] = await db.insert(comments).values({
      annotationId: id,
      authorId: resolvedId,
      authorName: resolvedName.trim(),
      body: body.trim(),
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    console.error("comment error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
