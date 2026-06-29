import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "p7-dev-secret-change-in-production"
)

export interface SessionUser {
  email: string
  name: string
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT(user as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET)
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies()
    const token = jar.get("p7_session")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  try {
    const cookie = req.headers.get("cookie") ?? ""
    const token = cookie.match(/p7_session=([^;]+)/)?.[1]
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}
