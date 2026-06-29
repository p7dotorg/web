import { notFound } from "next/navigation"
import { db } from "@/db"
import { papers, annotations } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
import { eq } from "drizzle-orm"
import PaperReader from "@/components/PaperReader"

export async function generateMetadata({ params }: { params: Promise<{ arxivId: string }> }) {
  const { arxivId } = await params
  const [paper] = await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1)
  return { title: paper ? `${paper.title} — p7` : `${arxivId} — p7` }
}

export default async function PaperPage({ params }: { params: Promise<{ arxivId: string }> }) {
  const { arxivId } = await params

  // Load from DB or fetch fresh
  let [paper] = await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1)
  if (!paper) {
    const meta = await fetchPaper(arxivId)
    if (!meta) notFound()
    await db.insert(papers).values(meta).onConflictDoNothing()
    paper = meta as typeof paper
  }

  const paperAnnotations = await db
    .select()
    .from(annotations)
    .where(eq(annotations.paperId, arxivId))
    .orderBy(annotations.upvotes)

  return (
    <PaperReader
      paper={paper}
      initialAnnotations={paperAnnotations}
    />
  )
}
