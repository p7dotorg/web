import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { annotations, papers } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
import { getSessionFromRequest } from "@/lib/session"
import { eq } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ arxivId: string }> }
) {
  const { arxivId } = await params
  const rows = await db
    .select()
    .from(annotations)
    .where(eq(annotations.paperId, arxivId))
    .orderBy(annotations.upvotes)
  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ arxivId: string }> }
) {
  const { arxivId } = await params
  const session = await getSessionFromRequest(req)
  const body_data = await req.json()
  const { anchorText, anchorStart, anchorEnd, body } = body_data

  const resolvedName = session?.name ?? body_data.authorName
  const resolvedId = session?.email ?? body_data.authorId

  if (!anchorText || !body || !resolvedName?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const existing = await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1)
  if (!existing.length) {
    const meta = await fetchPaper(arxivId)
    if (!meta) return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    await db.insert(papers).values(meta).onConflictDoNothing()
  }

  const [row] = await db.insert(annotations).values({
    paperId: arxivId,
    anchorText,
    anchorStart,
    anchorEnd,
    body,
    authorId: resolvedId ?? "anon",
    authorName: resolvedName.trim(),
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
