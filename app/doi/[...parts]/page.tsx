import { notFound, redirect } from "next/navigation"
import { db } from "@/db"
import { papers, annotations } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import PaperReader from "@/components/PaperReader"
import { fetchFromCrossref, extractArxivFromDoi } from "@/lib/crossref"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params
  const doi = parts.join("/")
  const [paper] = await db.select().from(papers).where(eq(papers.arxivId, doi)).limit(1)
  return { title: paper ? `${paper.title} — p7` : `${doi} — p7` }
}

export default async function DoiPage({ params }: { params: Promise<{ parts: string[] }> }) {
  const { parts } = await params
  const doi = parts.join("/")

  // If it's an arXiv DOI, redirect to the canonical arXiv route
  const arxivId = extractArxivFromDoi(doi)
  if (arxivId) redirect(`/${arxivId}`)

  // Try DB first
  let [paper] = await db.select().from(papers).where(eq(papers.arxivId, doi)).limit(1)

  if (!paper) {
    const meta = await fetchFromCrossref(doi)
    if (!meta) notFound()
    await db.insert(papers).values(meta).onConflictDoNothing()
    paper = meta as typeof paper
  }

  const paperAnnotations = await db
    .select()
    .from(annotations)
    .where(eq(annotations.paperId, doi))
    .orderBy(desc(annotations.upvotes))

  return (
    <PaperReader
      paper={paper}
      initialAnnotations={paperAnnotations}
      related={[]}
    />
  )
}
