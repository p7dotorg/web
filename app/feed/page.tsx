import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { db } from "@/db"
import { follows, annotations, papers } from "@/db/schema"
import { eq, desc, inArray } from "drizzle-orm"
import Link from "next/link"
import SiteNav from "@/components/SiteNav"
import SiteFooter from "@/components/SiteFooter"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function FeedPage() {
  const session = await getSession()
  if (!session?.email) redirect("/?auth=1")

  const myFollows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, session.email))

  let feedItems: {
    id: string
    body: string
    anchorText: string
    authorId: string
    authorName: string
    upvotes: number
    createdAt: Date
    paperId: string
    paperTitle: string
  }[] = []

  if (myFollows.length) {
    const followingIds = myFollows.map(f => f.followingId)
    feedItems = await db
      .select({
        id: annotations.id,
        body: annotations.body,
        anchorText: annotations.anchorText,
        authorId: annotations.authorId,
        authorName: annotations.authorName,
        upvotes: annotations.upvotes,
        createdAt: annotations.createdAt,
        paperId: annotations.paperId,
        paperTitle: papers.title,
      })
      .from(annotations)
      .innerJoin(papers, eq(annotations.paperId, papers.arxivId))
      .where(inArray(annotations.authorId, followingIds))
      .orderBy(desc(annotations.createdAt))
      .limit(50)
  }

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-2xl font-medium text-[#fcfdff]">Following</h1>
            <p className="text-[13px] text-[var(--ash)] mt-1">
              Annotations from people you follow
            </p>
          </div>
          <Link
            href="/"
            className="text-[12px] text-[var(--ash)] hover:text-[#fcfdff] transition-colors"
          >
            ← feed
          </Link>
        </div>

        {feedItems.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-[var(--mute)] text-sm">
              {myFollows.length === 0
                ? "You're not following anyone yet."
                : "No annotations from people you follow."}
            </p>
            <Link
              href="/"
              className="inline-block text-[12px] text-[#fcfdff] px-4 py-2 rounded-lg"
              style={{ border: "1px solid rgba(255,255,255,0.14)" }}
            >
              Find contributors →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feedItems.map(item => (
              <Link
                key={item.id}
                href={`/annotations/${item.id}`}
                className="group block rounded-xl p-5 transition-colors"
                style={{
                  background: "#0a0a0c",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Author row */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-black shrink-0"
                    style={{ background: "#fcfdff" }}
                  >
                    {item.authorName[0].toUpperCase()}
                  </div>
                  <span className="text-[12px] font-medium text-[#fcfdff]">{item.authorName}</span>
                  <span className="text-[var(--stone)] opacity-30">·</span>
                  <span className="text-[11px] text-[var(--ash)] truncate">{item.paperTitle}</span>
                </div>

                {/* Quote */}
                <p className="text-[11px] italic text-[var(--charcoal)] line-clamp-1 mb-2">
                  "{item.anchorText}"
                </p>

                {/* Body */}
                <p className="text-[13px] text-[var(--body)] leading-relaxed line-clamp-3">
                  {item.body}
                </p>

                {/* Footer */}
                <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[11px] text-[var(--mute)]">▲ {item.upvotes}</span>
                  <span className="text-[11px] text-[#464a4d] group-hover:text-[#888e90] transition-colors ml-auto">
                    discuss →
                  </span>
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
