import { redirect } from "next/navigation"
import { db } from "@/db"
import { papers, annotations } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import Link from "next/link"
import NavAuth from "@/components/NavAuth"
import CommandPalette from "@/components/CommandPalette"
import SearchTrigger from "@/components/SearchTrigger"

async function search(formData: FormData) {
  "use server"
  const q = formData.get("q")?.toString().trim()
  if (!q) return
  const id = q
    .replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//i, "")
    .replace(/^arxiv:/i, "")
    .replace(/v\d+$/, "")
    .trim()
  redirect(`/${id}`)
}

async function getFeatured() {
  try {
    const allPapers = await db.select().from(papers)
    const allAnnotations = await db.select().from(annotations).orderBy(desc(annotations.upvotes))

    const byPaper = new Map<string, typeof allAnnotations>()
    for (const a of allAnnotations) {
      if (!byPaper.has(a.paperId)) byPaper.set(a.paperId, [])
      byPaper.get(a.paperId)!.push(a)
    }

    return allPapers
      .filter(p => byPaper.has(p.arxivId))
      .map(p => ({
        arxivId: p.arxivId,
        title: p.title,
        authors: p.authors,
        annotationCount: byPaper.get(p.arxivId)!.length,
        topAnnotation: byPaper.get(p.arxivId)![0] ?? null,
      }))
      .sort((a, b) => b.annotationCount - a.annotationCount)
      .slice(0, 6)
  } catch {
    return []
  }
}

async function getTopAnnotations() {
  try {
    return await db
      .select({
        id: annotations.id,
        body: annotations.body,
        anchorText: annotations.anchorText,
        authorName: annotations.authorName,
        upvotes: annotations.upvotes,
        paperId: annotations.paperId,
        paperTitle: papers.title,
      })
      .from(annotations)
      .innerJoin(papers, eq(annotations.paperId, papers.arxivId))
      .orderBy(desc(annotations.upvotes))
      .limit(5)
  } catch {
    return []
  }
}

export default async function Home() {
  const [featured, topAnnotations] = await Promise.all([
    getFeatured(),
    getTopAnnotations(),
  ])

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]">
      <CommandPalette />

      {/* Nav */}
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-8 h-16"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#000" }}
      >
        <span className="font-display text-xl font-medium tracking-tight text-[#fcfdff]">paper7</span>

        <SearchTrigger />

        <NavAuth />
      </nav>

      {/* Hero */}
      <section
        className="relative px-8 pt-24 pb-20 overflow-hidden"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,89,0,0.18) 0%, transparent 70%)",
        }}
      >
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1
            className="font-display text-[clamp(48px,7vw,84px)] leading-none tracking-tight text-[#fcfdff]"
          >
            Read papers.{" "}
            <span className="italic">Together.</span>
          </h1>

          <p className="text-lg text-[var(--body)] max-w-lg mx-auto leading-relaxed">
            Highlight any passage, leave an annotation, discuss with other readers.
            The subtext of research — made public.
          </p>

          {/* Two primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <form action={search} className="flex gap-2 w-full sm:w-auto">
              <input
                name="q"
                placeholder="2401.12345 or arxiv.org/abs/…"
                className="flex-1 sm:w-72 h-11 px-4 rounded-xl text-sm text-[#fcfdff] placeholder:text-[var(--mute)]
                           bg-[#0a0a0c] focus:outline-none"
                style={{ border: "1px solid rgba(255,255,255,0.14)" }}
              />
              <button
                type="submit"
                className="h-11 px-5 rounded-xl text-sm font-medium bg-[#fcfdff] text-black
                           hover:bg-[#f1f7fe] transition-colors whitespace-nowrap shrink-0"
              >
                Open paper →
              </button>
            </form>

            <div className="flex items-center gap-2 text-[#464a4d] text-sm select-none">
              <span className="hidden sm:block">or</span>
            </div>

            <NavAuth variant="hero" />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-8 pb-24 space-y-20">

        {/* Featured papers */}
        {featured.length > 0 && (
          <section>
            <p className="text-[10px] font-medium tracking-widest text-[var(--charcoal)] uppercase mb-6">
              Hot papers
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {featured.map(p => (
                <Link
                  key={p.arxivId}
                  href={`/${p.arxivId}`}
                  className="paper-card group flex flex-col gap-4 rounded-xl p-5"
                  style={{ background: "#0a0a0c", border: "1px solid" }}
                >
                  {p.topAnnotation && (
                    <div
                      className="rounded-lg p-4 flex-1 space-y-2"
                      style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[11px] italic text-[var(--charcoal)] line-clamp-1">
                        "{p.topAnnotation.anchorText}"
                      </p>
                      <p className="text-[13px] text-[var(--body)] leading-relaxed line-clamp-3">
                        {p.topAnnotation.body}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[var(--ash)]">{p.topAnnotation.authorName}</span>
                        <span className="text-[11px] text-[var(--mute)]">▲ {p.topAnnotation.upvotes}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3
                      className="text-sm font-medium text-[#fcfdff] leading-snug line-clamp-2"
                      style={{ letterSpacing: "-0.2px" }}
                    >
                      {p.title}
                    </h3>
                    <p className="text-[11px] text-[var(--ash)] mt-1 line-clamp-1">{p.authors}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-[var(--mute)]">
                        {p.annotationCount} annotation{p.annotationCount !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[11px] text-[var(--stone)] opacity-40">{p.arxivId}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top annotations feed */}
        {topAnnotations.length > 0 && (
          <section>
            <p className="text-[10px] font-medium tracking-widest text-[var(--charcoal)] uppercase mb-6">
              Top annotations
            </p>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              {topAnnotations.map((a: any, i: number) => (
                <div
                  key={a.id}
                  className="group flex gap-5 p-5"
                  style={{
                    background: i % 2 === 0 ? "#0a0a0c" : "#000",
                    borderBottom: i < topAnnotations.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <div className="text-center w-6 shrink-0 pt-0.5">
                    <div className="text-xs text-[var(--charcoal)]">▲</div>
                    <div className="text-[11px] text-[var(--mute)] mt-0.5">{a.upvotes}</div>
                  </div>
                  <Link href={`/annotations/${a.id}`} className="flex-1 min-w-0 space-y-1 block">
                    <p className="text-[11px] italic text-[var(--charcoal)] line-clamp-1">
                      "{a.anchorText}"
                    </p>
                    <p className="text-sm text-[var(--body)] leading-relaxed line-clamp-2">{a.body}</p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-[var(--ash)]">{a.authorName}</span>
                      <span className="text-[var(--stone)] opacity-30">·</span>
                      <span className="text-[11px] text-[var(--ash)] truncate">
                        {a.paperTitle}
                      </span>
                    </div>
                  </Link>
                  <Link
                    href={`/${a.paperId}`}
                    className="shrink-0 self-center text-[11px] text-[#464a4d] hover:text-[#888e90] transition-colors hidden group-hover:block"
                    title="Open paper"
                  >
                    paper →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {featured.length === 0 && (
          <div className="text-center py-24 space-y-3">
            <p className="text-[var(--mute)] text-sm">No papers annotated yet.</p>
            <p className="text-[var(--ash)] text-sm">Paste an arXiv ID above to start.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="px-8 py-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-sm text-[var(--ash)]">p7</span>
          <span className="text-xs text-[var(--ash)]">Read papers together</span>
        </div>
      </footer>
    </div>
  )
}
