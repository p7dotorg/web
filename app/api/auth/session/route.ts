import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/session"

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req)
  if (!user) return NextResponse.json(null)
  return NextResponse.json(user)
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set("p7_session", "", { maxAge: 0, path: "/" })
  return res
}
