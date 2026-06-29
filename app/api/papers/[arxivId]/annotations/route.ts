import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/db"
import { annotations, papers } from "@/db/schema"
import { fetchPaper } from "@/lib/arxiv"
import { eq } from "drizzle-orm"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ arxivId: string }> }
) {
  const { arxivId } = await params
  const rows = await db
    .select()
    .from(annotations)
    .where(eq(annotations.paperId, arxivId))
    .orderBy(annotations.upvotes)
  return NextResponse.json(rows)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ arxivId: string }> }
) {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { arxivId } = await params
  const { anchorText, anchorStart, anchorEnd, body } = await req.json()
  if (!anchorText || !body) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Ensure paper exists in DB
  const existing = await db.select().from(papers).where(eq(papers.arxivId, arxivId)).limit(1)
  if (!existing.length) {
    const meta = await fetchPaper(arxivId)
    if (!meta) return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    await db.insert(papers).values(meta).onConflictDoNothing()
  }

  const authorName = (sessionClaims?.name as string) ?? (sessionClaims?.email as string) ?? "Anonymous"
  const [row] = await db.insert(annotations).values({
    paperId: arxivId, anchorText, anchorStart, anchorEnd, body,
    authorId: userId, authorName,
  }).returning()

  return NextResponse.json(row, { status: 201 })
}
