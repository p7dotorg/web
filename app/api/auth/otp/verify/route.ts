import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { otpCodes } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { signSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const now = new Date()
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email.toLowerCase()),
        eq(otpCodes.code, code),
        eq(otpCodes.used, 0),
        gt(otpCodes.expiresAt, now)
      )
    )
    .limit(1)

  if (!otp) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })

  await db.update(otpCodes).set({ used: 1 }).where(eq(otpCodes.id, otp.id))

  const name = email.split("@")[0]
  const token = await signSession({ email: email.toLowerCase(), name })

  const res = NextResponse.json({ email: email.toLowerCase(), name })
  res.cookies.set("p7_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  return res
}
