import { auth as clerkAuth } from "@clerk/nextjs/server"

const DEV_USER = { userId: "dev-user", sessionClaims: { name: "Dev User" } as Record<string, unknown> }

export async function auth() {
  if (!process.env.CLERK_SECRET_KEY) return DEV_USER
  return clerkAuth()
}
