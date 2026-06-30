import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { annotations, papers } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
import { generateAnnotations } from "@/lib/ai"
import { eq } from "drizzle-orm"

export const maxDuration = 60

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ arxivId: string }> }
) {
  const secret = req.headers.get("x-ingest-secret")
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 })
  }

  const { arxivId } = await params

  // Check existing annotation count — skip if already well-annotated
  const existing = await db.select().from(annotations).where(eq(annotations.paperId, arxivId))
  if (existing.length >= 3) {
    return NextResponse.json({ skipped: true, existing: existing.length })
  }

  // Fetch or load paper
  let paperRow = (await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1))[0]
  if (!paperRow) {
    const meta = await fetchPaper(arxivId)
    if (!meta) return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    const [inserted] = await db.insert(papers).values(meta).onConflictDoNothing().returning()
    paperRow = inserted ?? meta as typeof paperRow
  }

  const generated = await generateAnnotations({
    title: paperRow.title,
    authors: paperRow.authors,
    content: paperRow.markdown ?? paperRow.abstract,
  })

  if (!generated.length) {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
  }

  const inserted = await db.insert(annotations).values(
    generated.map(a => ({
      paperId: arxivId,
      anchorText: a.anchorText,
      anchorStart: 0,
      anchorEnd: a.anchorText.length,
      body: a.body,
      authorId: "ai",
      authorName: "paper7 AI",
    }))
  ).returning()

  return NextResponse.json({ created: inserted.length, annotations: inserted })
}
