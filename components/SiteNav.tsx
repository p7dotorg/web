"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AuthModal, { AuthUser } from "./AuthModal"

interface Props {
  /** Extra content to render on the right, before auth (e.g. "← Back to paper") */
  right?: React.ReactNode
}

export default function SiteNav({ right }: Props) {
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

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-14"
        style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Left: logo + feed */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-lg font-medium text-[#fcfdff]">
            paper7
          </Link>
          <Link
            href="/"
            className="text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors hidden sm:inline"
          >
            feed
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {right}

          {user === undefined ? (
            <div className="w-8 h-8" />
          ) : user ? (
            <>
              {/* Mobile: avatar circle → /me */}
              <Link
                href="/me"
                className="sm:hidden w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-black"
                style={{ background: "#fcfdff" }}
              >
                {user.name[0].toUpperCase()}
              </Link>
              {/* Desktop: name + out */}
              <Link
                href="/me"
                className="hidden sm:inline text-[12px] font-medium text-[#888e90] hover:text-[#fcfdff] transition-colors"
              >
                {user.name}
              </Link>
              <button
                onClick={logout}
                className="hidden sm:inline text-[11px] px-3 py-1 rounded-lg text-[#464a4d] hover:text-[#888e90] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                out
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="text-[12px] px-3 sm:px-4 py-1.5 rounded-lg font-medium text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.14)" }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
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
            <p className="font-display text-lg font-medium text-[#fcfdff] mb-1">Welcome to paper7</p>
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
