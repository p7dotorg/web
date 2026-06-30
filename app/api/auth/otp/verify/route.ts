import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { otpCodes, users } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { signSession } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const { email, code, name: nameInput } = await req.json()
    if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const normalEmail = email.toLowerCase()
    const now = new Date()

    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, normalEmail),
          eq(otpCodes.code, code),
          eq(otpCodes.used, 0),
          gt(otpCodes.expiresAt, now)
        )
      )
      .limit(1)

    if (!otp) return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })

    await db.update(otpCodes).set({ used: 1 }).where(eq(otpCodes.id, otp.id))

    // Upsert user — create on first login, preserve existing name
    const [existingUser] = await db.select().from(users).where(eq(users.email, normalEmail)).limit(1)
    const resolvedName = existingUser?.name ?? nameInput ?? normalEmail.split("@")[0]

    let userId: string
    if (existingUser) {
      userId = existingUser.id
    } else {
      const [newUser] = await db.insert(users).values({ email: normalEmail, name: resolvedName }).returning()
      userId = newUser.id
    }

    const token = await signSession({ email: normalEmail, name: resolvedName, id: userId })

    const res = NextResponse.json({ email: normalEmail, name: resolvedName, id: userId })
    res.cookies.set("p7_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
    return res
  } catch (err) {
    console.error("OTP verify error:", err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Internal error", detail: msg }, { status: 500 })
  }
}
