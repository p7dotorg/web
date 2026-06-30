import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { annotations, papers, comments } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
import { getSessionFromRequest } from "@/lib/session"
import { generateSeedComment } from "@/lib/ai"
import { eq, desc } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ arxivId: string }> }
) {
  const { arxivId } = await params
  const rows = await db
    .select()
    .from(annotations)
    .where(eq(annotations.paperId, arxivId))
    .orderBy(desc(annotations.upvotes))
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

  let paperTitle = arxivId
  const existing = await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1)
  if (!existing.length) {
    const meta = await fetchPaper(arxivId)
    if (!meta) return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    await db.insert(papers).values(meta).onConflictDoNothing()
    paperTitle = meta.title
  } else {
    paperTitle = existing[0].title
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

  // Fire AI seed comment asynchronously — don't block the response
  generateSeedComment({ paperTitle, anchorText, annotationBody: body })
    .then(async (seedText) => {
      if (!seedText) return
      await db.insert(comments).values({
        annotationId: row.id,
        authorId: "ai",
        authorName: "paper7 AI",
        body: seedText,
        isAi: 1,
      })
    })
    .catch(err => console.error("seed comment failed:", err))

  return NextResponse.json(row, { status: 201 })
}
