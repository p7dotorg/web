import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { papers, annotations } from "@/db/schema"
import { ilike, or, sql, desc } from "drizzle-orm"

export interface SearchResult {
  id: string
  title: string
  authors: string
  annotationCount: number
  source: "local" | "arxiv"
}

async function searchLocal(q: string): Promise<SearchResult[]> {
  const pattern = `%${q}%`
  const rows = await db
    .select({
      arxivId: papers.arxivId,
      title: papers.title,
      authors: papers.authors,
      annotationCount: sql<number>`(
        select count(*) from annotations where annotations.paper_id = papers.arxiv_id
      )::int`,
    })
    .from(papers)
    .where(or(ilike(papers.title, pattern), ilike(papers.abstract, pattern)))
    .orderBy(desc(sql`(
      select count(*) from annotations where annotations.paper_id = papers.arxiv_id
    )`))
    .limit(6)

  return rows.map(r => ({
    id: r.arxivId,
    title: r.title,
    authors: r.authors,
    annotationCount: r.annotationCount,
    source: "local" as const,
  }))
}

async function searchArxiv(q: string): Promise<SearchResult[]> {
  try {
    const query = encodeURIComponent(`ti:${q} OR abs:${q}`)
    const res = await fetch(
      `https://export.arxiv.org/api/query?search_query=${query}&max_results=5&sortBy=relevance`,
      { cache: "no-store" }
    )
    if (!res.ok) return []
    const xml = await res.text()

    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    return entries.map(([, entry]) => {
      const id = entry.match(/<id>.*?\/abs\/([^v<\n]+)/)?.[1]?.trim() ?? ""
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, " ").trim() ?? ""
      const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)]
        .map(m => m[1])
        .slice(0, 3)
        .join(", ")
      return { id, title, authors, annotationCount: 0, source: "arxiv" as const }
    }).filter(r => r.id && r.title)
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json([])

  const local = await searchLocal(q)

  // Only hit arXiv if local has fewer than 3 results
  const arxiv = local.length < 3 ? await searchArxiv(q) : []

  // Deduplicate: skip arXiv results already in local
  const localIds = new Set(local.map(r => r.id))
  const combined = [
    ...local,
    ...arxiv.filter(r => !localIds.has(r.id)),
  ].slice(0, 8)

  return NextResponse.json(combined)
}
