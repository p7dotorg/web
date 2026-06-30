import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { userPapers, papers } from "@/db/schema"
import { getSessionFromRequest } from "@/lib/session"
import { eq, and } from "drizzle-orm"
import { fetchPaper } from "@/lib/arxiv"

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
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
    .where(eq(userPapers.userId, session.id))
    .orderBy(userPapers.addedAt)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { paperId, status = "want_to_read" } = await req.json()
  if (!paperId) return NextResponse.json({ error: "Missing paperId" }, { status: 400 })

  // Ensure paper exists in DB
  const [existing] = await db.select().from(papers).where(eq(papers.arxivId, paperId)).limit(1)
  if (!existing) {
    const meta = await fetchPaper(paperId)
    if (!meta) return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    await db.insert(papers).values(meta).onConflictDoNothing()
  }

  const [row] = await db
    .insert(userPapers)
    .values({ userId: session.id, paperId, status })
    .onConflictDoNothing()
    .returning()

  // If already saved, return existing row
  if (!row) {
    const [existing] = await db
      .select()
      .from(userPapers)
      .where(and(eq(userPapers.userId, session.id), eq(userPapers.paperId, paperId)))
      .limit(1)
    return NextResponse.json(existing)
  }

  return NextResponse.json(row, { status: 201 })
}
