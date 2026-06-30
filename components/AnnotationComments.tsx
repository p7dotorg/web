"use client"

import { useState, useEffect } from "react"
import AuthModal, { AuthUser } from "./AuthModal"

interface Comment {
  id: string
  authorName: string
  body: string
  isAi: number
  createdAt: string
}

interface Props {
  annotationId: string
  initialComments: Comment[]
  session: { email: string; name: string; id?: string } | null
}

export default function AnnotationComments({ annotationId, initialComments, session: serverSession }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [draft, setDraft] = useState("")
  const [posting, setPosting] = useState(false)
  const [session, setSession] = useState<AuthUser | null>(serverSession)
  const [showAuth, setShowAuth] = useState(false)

  // Re-validate session client-side (SSR cookie may not have been sent)
  useEffect(() => {
    if (!serverSession) {
      fetch("/api/auth/session")
        .then(r => r.json())
        .then(u => { if (u?.email) setSession(u) })
        .catch(() => {})
    }
  }, [serverSession])

  const submit = async () => {
    if (!draft.trim()) return
    if (!session) { setShowAuth(true); return }
    setPosting(true)
    const res = await fetch(`/api/annotations/${annotationId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [...prev, c])
      setDraft("")
    }
    setPosting(false)
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })

  const aiComments = comments.filter(c => c.isAi)
  const humanComments = comments.filter(c => !c.isAi)

  return (
    <div className="space-y-5">
      <p className="text-[10px] font-medium tracking-widest text-[#464a4d] uppercase">
        Discussion ({comments.length})
      </p>

      {/* AI seed comment — pinned at top */}
      {aiComments.map(c => (
        <div
          key={c.id}
          className="rounded-xl p-4 space-y-2"
          style={{
            background: "rgba(255,197,61,0.04)",
            border: "1px solid rgba(255,197,61,0.18)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-semibold tracking-widest px-2 py-0.5 rounded-full uppercase"
              style={{ background: "rgba(255,197,61,0.12)", color: "#ffc53d", border: "1px solid rgba(255,197,61,0.2)" }}
            >
              AI
            </span>
            <span className="text-[11px] text-[#888e90]">paper7</span>
            <span className="text-[11px] text-[#464a4d]">·</span>
            <span className="text-[11px] text-[#464a4d]">{fmt(c.createdAt)}</span>
          </div>
          <p className="text-[13px] text-[rgba(252,253,255,0.82)] leading-relaxed">{c.body}</p>
        </div>
      ))}

      {/* Human comments */}
      {humanComments.map(c => (
        <div key={c.id} className="flex gap-3">
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-medium text-black mt-0.5"
            style={{ background: "#fcfdff" }}
          >
            {c.authorName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[13px] font-medium text-[#fcfdff]">{c.authorName}</span>
              <span className="text-[11px] text-[#464a4d]">{fmt(c.createdAt)}</span>
            </div>
            <p className="text-[13px] text-[rgba(252,253,255,0.8)] leading-relaxed">{c.body}</p>
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <p className="text-[13px] text-[#464a4d]">
          {session ? "Be the first to comment." : "No discussion yet."}
        </p>
      )}

      {/* Comment input */}
      {session ? (
        <div className="flex gap-3 pt-1">
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-medium text-black mt-1"
            style={{ background: "#fcfdff" }}
          >
            {session.name[0].toUpperCase()}
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Reply to the discussion…"
              rows={2}
              className="w-full text-sm text-[#fcfdff] placeholder:text-[#464a4d] rounded-xl px-3 py-2.5 resize-none focus:outline-none"
              style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.14)" }}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit() }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#464a4d]">⌘↵ to submit</span>
              <button
                onClick={submit}
                disabled={posting || !draft.trim()}
                className="h-8 px-4 rounded-lg text-[12px] font-medium bg-[#fcfdff] text-black hover:bg-[rgba(252,253,255,0.9)] disabled:opacity-30 transition-colors"
              >
                {posting ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAuth(true)}
          className="text-[12px] px-4 py-2 rounded-lg transition-colors text-[#888e90] hover:text-[#fcfdff]"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Sign in to join the discussion
        </button>
      )}

      {/* Auth modal */}
      {showAuth && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAuth(false)}
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
            <p className="font-display text-lg font-medium text-[#fcfdff] mb-1">Sign in to comment</p>
            <p className="text-[12px] text-[#888e90] mb-5">Enter your email — we'll send a code.</p>
            <AuthModal
              onSuccess={u => { setSession(u); setShowAuth(false) }}
              onCancel={() => setShowAuth(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}
