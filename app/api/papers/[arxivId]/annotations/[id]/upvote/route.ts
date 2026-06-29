import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { annotations, upvotes } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Idempotent upvote
  const existing = await db
    .select()
    .from(upvotes)
    .where(and(eq(upvotes.annotationId, id as any), eq(upvotes.userId, userId)))
    .limit(1)

  if (existing.length) return NextResponse.json({ already: true })

  await db.insert(upvotes).values({ annotationId: id as any, userId })
  const [updated] = await db
    .update(annotations)
    .set({ upvotes: sql`${annotations.upvotes} + 1` })
    .where(eq(annotations.id, id as any))
    .returning({ upvotes: annotations.upvotes })

  return NextResponse.json({ upvotes: updated.upvotes })
}
