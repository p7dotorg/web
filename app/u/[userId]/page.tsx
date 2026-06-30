import { db } from "@/db"
import { annotations, papers, follows } from "@/db/schema"
import { eq, desc, inArray } from "drizzle-orm"
import Link from "next/link"
import SiteNav from "@/components/SiteNav"
import FollowButton from "@/components/FollowButton"
import { getSession } from "@/lib/session"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const decodedId = decodeURIComponent(userId)

  const session = await getSession()

  // Fetch user's annotations with paper info
  const userAnnotations = await db
    .select({
      id: annotations.id,
      body: annotations.body,
      anchorText: annotations.anchorText,
      upvotes: annotations.upvotes,
      createdAt: annotations.createdAt,
      paperId: annotations.paperId,
      authorName: annotations.authorName,
      paperTitle: papers.title,
    })
    .from(annotations)
    .innerJoin(papers, eq(annotations.paperId, papers.arxivId))
    .where(eq(annotations.authorId, decodedId))
    .orderBy(desc(annotations.createdAt))
    .limit(50)

  if (!userAnnotations.length) notFound()

  const authorName = userAnnotations[0].authorName

  // Follower/following counts
  const [followerRows, followingRows] = await Promise.all([
    db.select().from(follows).where(eq(follows.followingId, decodedId)),
    db.select().from(follows).where(eq(follows.followerId, decodedId)),
  ])

  const isFollowing = session?.email
    ? followerRows.some(f => f.followerId === session.email)
    : false

  const isSelf = session?.email === decodedId

  const totalUpvotes = userAnnotations.reduce((sum, a) => sum + a.upvotes, 0)

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]">
      <SiteNav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

        {/* Profile header */}
        <div className="flex items-start gap-5 mb-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-black shrink-0"
            style={{ background: "#fcfdff" }}
          >
            {authorName[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-medium text-[#fcfdff]">{authorName}</h1>

            {/* Stats row */}
            <div className="flex items-center gap-5 mt-2">
              <span className="text-[12px] text-[var(--ash)]">
                <span className="text-[#fcfdff] font-medium">{userAnnotations.length}</span>{" "}
                annotation{userAnnotations.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[12px] text-[var(--ash)]">
                <span className="text-[#fcfdff] font-medium">{followerRows.length}</span>{" "}
                follower{followerRows.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[12px] text-[var(--ash)]">
                <span className="text-[#fcfdff] font-medium">{followingRows.length}</span>{" "}
                following
              </span>
              {totalUpvotes > 0 && (
                <span className="text-[12px] text-[var(--ash)]">
                  <span className="text-[#fcfdff] font-medium">▲ {totalUpvotes}</span>{" "}
                  upvotes
                </span>
              )}
            </div>
          </div>

          {/* Follow button */}
          {session && !isSelf && (
            <FollowButton
              userId={decodedId}
              initialFollowing={isFollowing}
              initialCount={followerRows.length}
            />
          )}
          {isSelf && (
            <Link
              href="/me"
              className="h-8 px-4 rounded-lg text-[12px] text-[var(--ash)] hover:text-[#fcfdff] transition-colors shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.10)" }}
            >
              edit profile
            </Link>
          )}
        </div>

        {/* Annotations list */}
        <div className="space-y-3">
          {userAnnotations.map(a => (
            <Link
              key={a.id}
              href={`/annotations/${a.id}`}
              className="group block rounded-xl p-5 transition-colors"
              style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Paper title */}
              <p className="text-[11px] text-[var(--charcoal)] mb-2 truncate">
                {a.paperTitle}
              </p>

              {/* Quote */}
              <p className="text-[11px] italic text-[var(--ash)] line-clamp-1 mb-2">
                "{a.anchorText}"
              </p>

              {/* Body */}
              <p className="text-[13px] text-[var(--body)] leading-relaxed line-clamp-3">
                {a.body}
              </p>

              {/* Footer */}
              <div
                className="flex items-center gap-3 mt-3 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
              >
                <span className="text-[11px] text-[var(--mute)]">▲ {a.upvotes}</span>
                <span className="text-[11px] text-[#464a4d] group-hover:text-[#888e90] transition-colors ml-auto">
                  discuss →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
