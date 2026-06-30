import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { annotations, papers } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
import { generateAnnotations } from "@/lib/ai"
import { eq } from "drizzle-orm"

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret")
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 })
  }

  const { paperIds } = await req.json() as { paperIds: string[] }
  if (!Array.isArray(paperIds) || !paperIds.length) {
    return NextResponse.json({ error: "paperIds array required" }, { status: 400 })
  }

  const results: { id: string; status: "created" | "skipped" | "error"; count?: number; error?: string }[] = []

  for (const rawId of paperIds) {
    const arxivId = rawId.replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//i, "").replace(/v\d+$/, "").trim()

    try {
      const existing = await db.select().from(annotations).where(eq(annotations.paperId, arxivId))
      if (existing.length >= 3) {
        results.push({ id: arxivId, status: "skipped", count: existing.length })
        continue
      }

      let paperRow = (await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1))[0]
      if (!paperRow) {
        const meta = await fetchPaper(arxivId)
        if (!meta) {
          results.push({ id: arxivId, status: "error", error: "Paper not found" })
          continue
        }
        const [inserted] = await db.insert(papers).values(meta).onConflictDoNothing().returning()
        paperRow = inserted ?? meta as typeof paperRow
      }

      const generated = await generateAnnotations({
        title: paperRow.title,
        authors: paperRow.authors,
        content: paperRow.markdown ?? paperRow.abstract,
      })

      if (!generated.length) {
        results.push({ id: arxivId, status: "error", error: "AI generation returned empty" })
        continue
      }

      await db.insert(annotations).values(
        generated.map(a => ({
          paperId: arxivId,
          anchorText: a.anchorText,
          anchorStart: 0,
          anchorEnd: a.anchorText.length,
          body: a.body,
          authorId: "ai",
          authorName: "paper7 AI",
        }))
      )

      results.push({ id: arxivId, status: "created", count: generated.length })
    } catch (err) {
      results.push({ id: arxivId, status: "error", error: String(err) })
    }
  }

  return NextResponse.json({
    total: results.length,
    created: results.filter(r => r.status === "created").length,
    skipped: results.filter(r => r.status === "skipped").length,
    errors: results.filter(r => r.status === "error").length,
    results,
  })
}
