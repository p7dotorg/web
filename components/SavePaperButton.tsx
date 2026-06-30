"use client"

import { useState } from "react"

type Status = "reading" | "read" | "want_to_read"

interface Props {
  paperId: string
  initialStatus?: Status | null
  session: { id?: string; email: string; name: string } | null
}

const LABELS: Record<Status, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  read: "Read",
}

export default function SavePaperButton({ paperId, initialStatus = null, session }: Props) {
  const [status, setStatus] = useState<Status | null>(initialStatus)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!session) return null

  async function save(s: Status) {
    setLoading(true)
    setOpen(false)
    try {
      if (!status) {
        const res = await fetch("/api/user/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId, status: s }),
        })
        if (res.ok) setStatus(s)
      } else {
        const res = await fetch(`/api/user/papers/${encodeURIComponent(paperId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: s }),
        })
        if (res.ok) setStatus(s)
      }
    } finally {
      setLoading(false)
    }
  }

  async function remove() {
    setLoading(true)
    setOpen(false)
    try {
      await fetch(`/api/user/papers/${encodeURIComponent(paperId)}`, { method: "DELETE" })
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const isSaved = status !== null

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (!isSaved) { save("want_to_read"); return }
          setOpen(o => !o)
        }}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all"
        style={isSaved ? {
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#fcfdff",
        } : {
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#888e90",
        }}
      >
        {loading ? (
          <span style={{ opacity: 0.5 }}>…</span>
        ) : isSaved ? (
          <>
            <span>✓</span>
            <span>{LABELS[status!]}</span>
            <span style={{ opacity: 0.4, fontSize: 10 }}>▾</span>
          </>
        ) : (
          <>
            <span>+</span>
            <span>Save paper</span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[160px]"
            style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {(["want_to_read", "reading", "read"] as Status[]).map(s => (
              <button
                key={s}
                onClick={() => save(s)}
                className="w-full text-left px-4 py-2 text-[13px] transition-colors"
                style={{
                  color: status === s ? "#fcfdff" : "#888e90",
                  background: status === s ? "rgba(255,255,255,0.05)" : "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = status === s ? "rgba(255,255,255,0.05)" : "transparent")}
              >
                {status === s && <span className="mr-2">✓</span>}
                {LABELS[s]}
              </button>
            ))}
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
            <button
              onClick={remove}
              className="w-full text-left px-4 py-2 text-[13px] text-[#888e90] transition-colors"
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={e => (e.currentTarget.style.color = "#888e90")}
            >
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  )
}
