import { db } from "@/db"
import { papers, annotations } from "@/db/schema"
import { desc, eq, like, sql } from "drizzle-orm"
import Link from "next/link"

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params
  const label = decodeURIComponent(cat)

  const allPapers = await db
    .select()
    .from(papers)
    .where(like(papers.categories, `%${label}%`))

  const allAnnotations = await db.select().from(annotations).orderBy(desc(annotations.upvotes))
  const countByPaper = new Map<string, number>()
  for (const a of allAnnotations) {
    countByPaper.set(a.paperId, (countByPaper.get(a.paperId) ?? 0) + 1)
  }

  const sorted = allPapers
    .map(p => ({ ...p, annotationCount: countByPaper.get(p.arxivId) ?? 0 }))
    .sort((a, b) => b.annotationCount - a.annotationCount)

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]">
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-8 h-14"
        style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="font-display text-lg font-medium text-[#fcfdff]">p7</Link>
        <span className="text-[11px] text-[#888e90]">{label}</span>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="mb-8 space-y-1">
          <p className="text-[10px] font-medium tracking-widest text-[#888e90] uppercase">Category</p>
          <h1 className="font-display text-4xl leading-tight text-[#fcfdff]">{label}</h1>
          <p className="text-sm text-[#888e90]">{sorted.length} paper{sorted.length !== 1 ? "s" : ""}</p>
        </div>

        {sorted.length === 0 && (
          <p className="text-[#464a4d] text-sm">No papers in this category yet.</p>
        )}

        <div className="space-y-2">
          {sorted.map(p => (
            <Link
              key={p.arxivId}
              href={`/${p.arxivId}`}
              className="paper-card flex items-start justify-between gap-4 rounded-xl p-5"
              style={{ background: "#0a0a0c", border: "1px solid" }}
            >
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-sm font-medium text-[#fcfdff] leading-snug" style={{ letterSpacing: "-0.2px" }}>
                  {p.title}
                </h2>
                <p className="text-[11px] text-[#888e90] line-clamp-1">{p.authors}</p>
              </div>
              <div className="text-right shrink-0">
                {p.annotationCount > 0 && (
                  <span className="text-[11px] text-[#a1a4a5]">{p.annotationCount} annotations</span>
                )}
                <p className="text-[11px] text-[#464a4d]">{p.arxivId}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
