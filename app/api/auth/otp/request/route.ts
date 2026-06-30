import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { otpCodes } from "@/db/schema"
import { Resend } from "resend"
import { gt, eq } from "drizzle-orm"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    await db.insert(otpCodes).values({ email: email.toLowerCase(), code, expiresAt })

    if (resend) {
      const result = await resend.emails.send({
        from: "p7 <noreply@paper7.org>",
        to: email,
        subject: `Your p7 code: ${code}`,
        html: `<p style="font-family:monospace;font-size:32px;letter-spacing:8px"><b>${code}</b></p><p>Valid for 10 minutes.</p>`,
      })
      if (result.error) {
        console.error("Resend error:", result.error)
        return NextResponse.json({ error: "Email delivery failed", detail: result.error.message }, { status: 500 })
      }
    } else {
      console.log(`\n📧 OTP for ${email}: ${code}\n`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("OTP request error:", err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: "Internal error", detail: msg }, { status: 500 })
  }
}
