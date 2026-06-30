import { db } from "@/db"
import { annotations, papers, comments } from "@/db/schema"
import { eq, desc, and, ne, asc } from "drizzle-orm"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/session"
import AnnotationComments from "@/components/AnnotationComments"
import SavePaperButton from "@/components/SavePaperButton"
import SiteNav from "@/components/SiteNav"
import SiteFooter from "@/components/SiteFooter"
import { userPapers } from "@/db/schema"

export default async function AnnotationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [row] = await db
    .select({
      id: annotations.id,
      body: annotations.body,
      anchorText: annotations.anchorText,
      authorName: annotations.authorName,
      upvotes: annotations.upvotes,
      createdAt: annotations.createdAt,
      paperId: annotations.paperId,
      paperTitle: papers.title,
      paperAuthors: papers.authors,
      paperCategories: papers.categories,
    })
    .from(annotations)
    .innerJoin(papers, eq(annotations.paperId, papers.arxivId))
    .where(eq(annotations.id, id))
    .limit(1)

  if (!row) notFound()

  const [others, initialComments, session] = await Promise.all([
    db
      .select()
      .from(annotations)
      .where(and(eq(annotations.paperId, row.paperId), ne(annotations.id, id)))
      .orderBy(desc(annotations.upvotes))
      .limit(4),
    db
      .select()
      .from(comments)
      .where(eq(comments.annotationId, id))
      .orderBy(asc(comments.createdAt)),
    getSession(),
  ])

  const savedPaper = session?.id
    ? await db
        .select()
        .from(userPapers)
        .where(and(eq(userPapers.userId, session.id), eq(userPapers.paperId, row.paperId)))
        .limit(1)
        .then(r => r[0] ?? null)
    : null

  const cats = (row.paperCategories ?? "").split(",").map((c: string) => c.trim()).filter(Boolean)
  const date = new Date(row.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]">
      <SiteNav
        right={
          <>
            <SavePaperButton
              paperId={row.paperId}
              initialStatus={(savedPaper?.status as "reading" | "read" | "want_to_read") ?? null}
              session={session}
            />
            <Link
              href={`/${row.paperId}`}
              className="text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors"
            >
              ← paper
            </Link>
          </>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">

        {/* Paper breadcrumb */}
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cats.map((c: string) => (
              <Link
                key={c}
                href={`/category/${encodeURIComponent(c)}`}
                className="text-[10px] px-2 py-0.5 rounded-full text-[#888e90] hover:text-[#fcfdff] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {c}
              </Link>
            ))}
          </div>
          <Link
            href={`/${row.paperId}`}
            className="font-display text-xl font-medium text-[#fcfdff] hover:text-[rgba(252,253,255,0.7)] transition-colors leading-tight block"
          >
            {row.paperTitle}
          </Link>
          <p className="text-[12px] text-[#888e90]">{row.paperAuthors}</p>
        </div>

        {/* The annotation */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.14)" }}
        >
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[13px] italic text-[#888e90] leading-relaxed">
              &ldquo;{row.anchorText}&rdquo;
            </p>
          </div>

          <p className="text-[16px] text-[rgba(252,253,255,0.9)] leading-[1.75]">
            {row.body}
          </p>

          <div
            className="flex items-center justify-between pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <p className="text-[13px] text-[#fcfdff]">{row.authorName}</p>
              <p className="text-[11px] text-[#464a4d]">{date}</p>
            </div>
            <div
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
              style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-[#888e90] text-sm">▲</span>
              <span className="text-[15px] font-medium text-[#fcfdff]">{row.upvotes}</span>
            </div>
          </div>
        </div>

        {/* Comments — client component */}
        <AnnotationComments
          annotationId={id}
          initialComments={initialComments.map(c => ({
            id: c.id,
            authorName: c.authorName,
            body: c.body,
            isAi: c.isAi,
            createdAt: c.createdAt.toISOString(),
          }))}
          session={session}
        />

        {/* Read in context */}
        <Link
          href={`/${row.paperId}`}
          className="flex items-center justify-between w-full rounded-xl px-5 py-4 transition-colors group"
          style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div>
            <p className="text-[13px] font-medium text-[#fcfdff]">Read in context</p>
            <p className="text-[11px] text-[#464a4d] mt-0.5">Open the full paper with all annotations</p>
          </div>
          <span className="text-[#888e90] group-hover:text-[#fcfdff] transition-colors text-lg">→</span>
        </Link>

        {/* Other annotations */}
        {others.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-medium tracking-widest text-[#464a4d] uppercase">
              More annotations on this paper
            </p>
            {others.map(a => (
              <Link
                key={a.id}
                href={`/annotations/${a.id}`}
                className="block rounded-xl p-4 space-y-2 transition-colors"
                style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-[11px] italic text-[#888e90] line-clamp-1">
                  &ldquo;{a.anchorText}&rdquo;
                </p>
                <p className="text-[13px] text-[rgba(252,253,255,0.86)] leading-relaxed line-clamp-3">
                  {a.body}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#464a4d]">{a.authorName}</span>
                  <span className="text-[11px] text-[#888e90]">▲ {a.upvotes}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  )
}
