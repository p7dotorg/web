import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { follows } from "@/db/schema"
import { getSessionFromRequest } from "@/lib/session"
import { and, eq } from "drizzle-orm"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionFromRequest(req)
  if (!session?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId } = await params
  if (userId === session.email) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })

  await db.insert(follows).values({
    followerId: session.email,
    followingId: userId,
  }).onConflictDoNothing()

  return NextResponse.json({ following: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionFromRequest(req)
  if (!session?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { userId } = await params

  await db.delete(follows).where(
    and(
      eq(follows.followerId, session.email),
      eq(follows.followingId, userId)
    )
  )

  return NextResponse.json({ following: false })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getSessionFromRequest(req)
  const { userId } = await params

  const [followerCount, followingCount] = await Promise.all([
    db.select().from(follows).where(eq(follows.followingId, userId)),
    db.select().from(follows).where(eq(follows.followerId, userId)),
  ])

  const isFollowing = session?.email
    ? followerCount.some(f => f.followerId === session.email)
    : false

  return NextResponse.json({
    followers: followerCount.length,
    following: followingCount.length,
    isFollowing,
  })
}
