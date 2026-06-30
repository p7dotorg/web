"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AuthModal, { AuthUser } from "./AuthModal"

export default function NavAuth({ variant = "nav" }: { variant?: "nav" | "hero" }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(u => setUser(u?.email ? u : null))
      .catch(() => setUser(null))
  }, [])

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" })
    setUser(null)
  }

  // still loading
  if (user === undefined) return <div className="w-16 h-8" />

  if (user) {
    if (variant === "hero") return null // hero slot disappears when logged in
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/me"
          className="text-[13px] font-medium text-[#fcfdff] hover:opacity-70 transition-opacity hidden sm:inline"
        >
          {user.name}
        </Link>
        <button
          onClick={logout}
          className="h-8 px-3 rounded-lg text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors"
          style={{ border: "1px solid rgba(255,255,255,0.14)" }}
        >
          Sign out
        </button>
      </div>
    )
  }

  const isHero = variant === "hero"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          isHero
            ? "h-11 px-6 rounded-xl text-sm font-medium text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)] transition-colors whitespace-nowrap"
            : "h-8 px-4 rounded-lg text-[13px] font-medium text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)] transition-colors whitespace-nowrap"
        }
        style={{ border: "1px solid rgba(255,255,255,0.14)" }}
      >
        {isHero ? "Create account →" : "Sign in"}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Modal */}
          <div
            className="fixed z-50 rounded-2xl p-6 w-80 shadow-2xl"
            style={{
              background: "#0a0a0c",
              border: "1px solid rgba(255,255,255,0.14)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <p className="font-display text-lg font-medium text-[#fcfdff] mb-1">Welcome to p7</p>
            <p className="text-[12px] text-[#888e90] mb-5">
              Marginalia for arXiv. Sign in to annotate papers.
            </p>
            <AuthModal
              onSuccess={u => { setUser(u); setOpen(false) }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </>
  )
}
