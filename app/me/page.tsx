import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { userPapers, papers, annotations } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { getSession } from "@/lib/session"
import SavePaperButton from "@/components/SavePaperButton"

export const dynamic = "force-dynamic"

type Status = "reading" | "read" | "want_to_read"

const STATUS_LABELS: Record<Status, string> = {
  reading: "Reading",
  want_to_read: "Want to read",
  read: "Read",
}

export default async function MePage() {
  const session = await getSession()
  if (!session) redirect("/?auth=1")

  const [savedPapers, myAnnotations] = await Promise.all([
    db
      .select({
        id: userPapers.id,
        status: userPapers.status,
        addedAt: userPapers.addedAt,
        paperId: userPapers.paperId,
        title: papers.title,
        authors: papers.authors,
        categories: papers.categories,
      })
      .from(userPapers)
      .innerJoin(papers, eq(userPapers.paperId, papers.arxivId))
      .where(eq(userPapers.userId, session.id!))
      .orderBy(desc(userPapers.addedAt)),

    db
      .select({
        id: annotations.id,
        anchorText: annotations.anchorText,
        body: annotations.body,
        upvotes: annotations.upvotes,
        createdAt: annotations.createdAt,
        paperId: annotations.paperId,
        paperTitle: papers.title,
      })
      .from(annotations)
      .innerJoin(papers, eq(annotations.paperId, papers.arxivId))
      .where(eq(annotations.authorId, session.id ?? session.email))
      .orderBy(desc(annotations.createdAt))
      .limit(20),
  ])

  const grouped = {
    reading: savedPapers.filter(p => p.status === "reading"),
    want_to_read: savedPapers.filter(p => p.status === "want_to_read"),
    read: savedPapers.filter(p => p.status === "read"),
  }

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]">
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-8 h-14"
        style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link href="/" className="font-display text-lg font-medium text-[#fcfdff]">paper7</Link>
        <span className="text-[12px] text-[#888e90]">{session.email}</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-16">

        {/* Profile header */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-medium tracking-tight">{session.name}</h1>
          <p className="text-[13px] text-[#888e90]">{session.email}</p>
        </div>

        {/* Reading list */}
        <section className="space-y-8">
          <h2 className="text-[10px] font-medium tracking-widest text-[#464a4d] uppercase">
            Reading list · {savedPapers.length}
          </h2>

          {savedPapers.length === 0 && (
            <p className="text-[14px] text-[#888e90]">
              No papers saved yet.{" "}
              <Link href="/" className="text-[#fcfdff] hover:opacity-70 transition-opacity">
                Browse the feed →
              </Link>
            </p>
          )}

          {(["reading", "want_to_read", "read"] as Status[]).map(status => {
            const group = grouped[status]
            if (!group.length) return null
            return (
              <div key={status} className="space-y-3">
                <p className="text-[11px] font-medium text-[#888e90] uppercase tracking-wider">
                  {STATUS_LABELS[status]} · {group.length}
                </p>
                {group.map(p => {
                  const cats = (p.categories ?? "").split(",").map((c: string) => c.trim()).filter(Boolean)
                  return (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-4 rounded-xl p-4"
                      style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          href={`/${p.paperId}`}
                          className="text-[14px] font-medium text-[#fcfdff] hover:opacity-70 transition-opacity leading-snug block"
                        >
                          {p.title}
                        </Link>
                        <p className="text-[11px] text-[#888e90] truncate">{p.authors}</p>
                        {cats.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {cats.slice(0, 3).map(c => (
                              <span
                                key={c}
                                className="text-[9px] px-1.5 py-0.5 rounded-full text-[#888e90]"
                                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        <SavePaperButton
                          paperId={p.paperId}
                          initialStatus={p.status as Status}
                          session={session}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </section>

        {/* My annotations */}
        {myAnnotations.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-[10px] font-medium tracking-widest text-[#464a4d] uppercase">
              My annotations · {myAnnotations.length}
            </h2>
            {myAnnotations.map(a => {
              const date = new Date(a.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })
              return (
                <Link
                  key={a.id}
                  href={`/annotations/${a.id}`}
                  className="block rounded-xl p-4 space-y-2 transition-colors group"
                  style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[11px] text-[#888e90] group-hover:text-[#fcfdff] transition-colors truncate">
                    {a.paperTitle}
                  </p>
                  <p className="text-[11px] italic text-[#464a4d] line-clamp-1">
                    &ldquo;{a.anchorText}&rdquo;
                  </p>
                  <p className="text-[13px] text-[rgba(252,253,255,0.86)] leading-relaxed line-clamp-3">
                    {a.body}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#464a4d]">{date}</span>
                    <span className="text-[11px] text-[#888e90]">▲ {a.upvotes}</span>
                  </div>
                </Link>
              )
            })}
          </section>
        )}

      </div>
    </div>
  )
}
