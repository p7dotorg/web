import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { annotations, papers } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
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
  const { anchorText, anchorStart, anchorEnd, body, authorName, authorId } = await req.json()

  if (!anchorText || !body || !authorName?.trim()) {
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
    authorId: authorId ?? "anon",
    authorName: authorName.trim(),
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
