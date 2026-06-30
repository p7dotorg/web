import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { follows, annotations, papers } from "@/db/schema"
import { getSessionFromRequest } from "@/lib/session"
import { eq, desc, inArray } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const myFollows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, session.email))

  if (!myFollows.length) return NextResponse.json([])

  const followingIds = myFollows.map(f => f.followingId)

  const rows = await db
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

  return NextResponse.json(rows)
}
