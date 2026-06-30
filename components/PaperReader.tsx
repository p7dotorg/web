"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import katex from "katex"
import "katex/dist/katex.min.css"
import AuthModal, { AuthUser } from "./AuthModal"
import SavePaperButton from "./SavePaperButton"

interface Annotation {
  id: string
  anchorText: string
  anchorStart: number
  anchorEnd: number
  body: string
  authorName: string
  isAi: number
  upvotes: number
  createdAt: Date | string
}

interface Paper {
  arxivId: string
  title: string
  authors: string
  abstract: string
  markdown: string
  categories?: string
}

interface RelatedPaper {
  arxivId: string | null
  title: string
  authors: string
  year: number | null
  citationCount: number
}

interface Selection {
  text: string
  start: number
  end: number
  x: number
  y: number
}

export default function PaperReader({
  paper,
  initialAnnotations,
  related = [],
}: {
  paper: Paper
  initialAnnotations: Annotation[]
  related?: RelatedPaper[]
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [active, setActive] = useState<Annotation | null>(null)
  const [draftBody, setDraftBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [annotating, setAnnotating] = useState(false) // step 2: show form
  const [savedStatus, setSavedStatus] = useState<"reading" | "read" | "want_to_read" | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(u => {
        if (u?.email) {
          setSessionUser(u)
          fetch("/api/user/papers")
            .then(r => r.json())
            .then((list: { paperId: string; status: string }[]) => {
              const entry = list.find(p => p.paperId === paper.arxivId)
              if (entry) setSavedStatus(entry.status as "reading" | "read" | "want_to_read")
            })
            .catch(() => {})
        }
      })
      .catch(() => {})
  }, [])

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" })
    setSessionUser(null)
  }

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName !== "MARK") return
    const text = target.textContent ?? ""
    const ann = annotations.find(a => a.anchorText === text)
    if (ann) {
      setActive(prev => prev?.id === ann.id ? null : ann)
      setSelection(null)
    }
  }, [annotations])

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !contentRef.current) return
    const text = sel.toString().trim()
    if (text.length < 10) return
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const fullText = contentRef.current.innerText
    const start = fullText.indexOf(text)
    if (start === -1) return
    setSelection({ text, start, end: start + text.length, x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 12 })
    setActive(null)
  }, [])

  const postAnnotation = async (currentSelection: Selection, body: string) => {
    setPosting(true)
    const res = await fetch(`/api/papers/${paper.arxivId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anchorText: currentSelection.text,
        anchorStart: currentSelection.start,
        anchorEnd: currentSelection.end,
        body,
      }),
    })
    if (res.ok) {
      const ann = await res.json()
      setAnnotations(prev => [ann, ...prev])
    }
    setDraftBody("")
    setSelection(null)
    setShowAuth(false)
    setPosting(false)
  }

  const submit = async () => {
    if (!selection || !draftBody.trim()) return
    if (!sessionUser) { setShowAuth(true); return }
    await postAnnotation(selection, draftBody)
    setAnnotating(false)
  }

  const handleAuthSuccess = (user: AuthUser) => {
    setSessionUser(user)
    setShowAuth(false)
    if (draftBody.trim() && selection) {
      postAnnotation(selection, draftBody)
      setAnnotating(false)
    } else {
      setAnnotating(true)
    }
  }

  const openAnnotateForm = () => {
    if (!sessionUser) { setShowAuth(true); return }
    setAnnotating(true)
  }

  const closeSelection = () => {
    setSelection(null)
    setAnnotating(false)
    setDraftBody("")
  }

  const upvote = async (id: string) => {
    const res = await fetch(`/api/papers/${paper.arxivId}/annotations/${id}/upvote`, { method: "POST" })
    if (res.ok) {
      const { upvotes } = await res.json()
      setAnnotations(prev => prev.map(a => a.id === id ? { ...a, upvotes } : a))
    }
  }

  function renderMath(text: string): string {
    // Render display math $$...$$ first, then inline $...$
    return text
      .replace(/\$\$([^$]+)\$\$/g, (_, tex) => {
        try { return katex.renderToString(tex.trim(), { throwOnError: false, displayMode: true }) }
        catch { return tex }
      })
      .replace(/\$([^$\n]+)\$/g, (_, tex) => {
        try { return katex.renderToString(tex.trim(), { throwOnError: false }) }
        catch { return tex }
      })
  }

  function renderText(text: string) {
    let result = renderMath(text)
    const anchors = annotations.map(a => a.anchorText).filter(Boolean)
    anchors.forEach(h => {
      result = result.replace(
        h,
        `<mark style="background:rgba(255,197,61,0.15);color:#fcfdff;cursor:pointer;border-radius:2px;padding:0 1px">${h}</mark>`
      )
    })
    return result
  }

  const paragraphs = paper.markdown.split(/\n{2,}/).filter(p => p.trim().length > 0)
  const isHeading = (p: string) => p.startsWith("## ")
  const cats = (paper.categories ?? "").split(",").map(c => c.trim()).filter(Boolean)

  return (
    <div className="min-h-screen bg-black text-[#fcfdff]" onMouseUp={handleMouseUp} onClick={handleContentClick}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 h-14"
        style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <a href="/" className="font-display text-lg font-medium text-[#fcfdff]">paper7</a>
          <a href="/" className="text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors hidden sm:inline">feed</a>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Categories — desktop only */}
          {cats.slice(0, 2).map(c => (
            <Link
              key={c}
              href={`/category/${encodeURIComponent(c)}`}
              className="text-[10px] px-2 py-0.5 rounded-full text-[#888e90] hover:text-[#fcfdff] transition-colors hidden lg:inline"
              style={{ border: "1px solid rgba(255,255,255,0.14)" }}
            >
              {c}
            </Link>
          ))}

          {/* Save paper — desktop only */}
          <div className="hidden sm:block">
            <SavePaperButton
              paperId={paper.arxivId}
              initialStatus={savedStatus}
              session={sessionUser}
            />
          </div>

          {/* Auth — always visible */}
          {sessionUser ? (
            <>
              {/* Avatar → /me (all sizes) */}
              <Link
                href="/me"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-black shrink-0"
                style={{ background: "#fcfdff" }}
                title={sessionUser.name}
              >
                {sessionUser.name[0].toUpperCase()}
              </Link>
              {/* Name — desktop only */}
              <Link
                href="/me"
                className="hidden sm:inline text-[12px] font-medium text-[#888e90] hover:text-[#fcfdff] transition-colors"
              >
                {sessionUser.name}
              </Link>
              {/* Out — always visible */}
              <button
                onClick={logout}
                className="h-8 px-3 rounded-lg text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="h-8 px-3 sm:px-4 rounded-lg text-[12px] font-medium text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.14)" }}
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-10 px-8 py-12">
        {/* Paper content */}
        <article className="flex-1 min-w-0 max-w-2xl">
          <header className="mb-10 space-y-3">
            <h1
              className="font-display text-[clamp(26px,4vw,38px)] leading-tight text-[#fcfdff]"
              style={{ letterSpacing: "-0.5px" }}
            >
              {paper.title}
            </h1>
            <p className="text-[13px] text-[#888e90] leading-relaxed">{paper.authors}</p>
            {cats.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {cats.map(c => (
                  <Link
                    key={c}
                    href={`/category/${encodeURIComponent(c)}`}
                    className="text-[10px] px-2 py-0.5 rounded-full text-[#888e90] hover:text-[#fcfdff] transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            )}
          </header>

          <div
            ref={contentRef}
            className="text-[15px] leading-7 text-[rgba(252,253,255,0.86)] select-text space-y-4"
          >
            {paragraphs.map((p, i) =>
              isHeading(p) ? (
                <h2
                  key={i}
                  className="font-display text-xl font-medium text-[#fcfdff] mt-8 mb-2"
                  style={{ letterSpacing: "-0.3px" }}
                >
                  {p.replace(/^## /, "")}
                </h2>
              ) : (
                <p key={i} dangerouslySetInnerHTML={{ __html: renderText(p) }} className="leading-[1.75]" />
              )
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="w-72 shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-8">
            {/* Annotations */}
            <div className="space-y-3">
              <p className="text-[10px] font-medium tracking-widest text-[#888e90] uppercase">
                Annotations ({annotations.length})
              </p>
              {annotations.length === 0 && (
                <div
                  className="rounded-xl p-4 space-y-1"
                  style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[12px] text-[#888e90]">No annotations yet.</p>
                  <p className="text-[11px] text-[#464a4d]">Select any passage to add the first one.</p>
                </div>
              )}
              {annotations.map(ann => (
                <Link
                  key={ann.id}
                  href={`/annotations/${ann.id}`}
                  className="block rounded-xl p-4 transition-all duration-150 space-y-2 group"
                  style={{
                    background: active?.id === ann.id ? "#101012" : "#0a0a0c",
                    border: `1px solid ${active?.id === ann.id ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)"}`,
                  }}
                  onClick={() => setActive(active?.id === ann.id ? null : ann)}
                >
                  <p className="text-[11px] italic text-[#888e90] line-clamp-1">"{ann.anchorText}"</p>
                  <p className="text-[13px] text-[rgba(252,253,255,0.86)] leading-relaxed line-clamp-3">{ann.body}</p>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#464a4d]">{ann.authorName}</span>
                      <button
                        onClick={e => { e.stopPropagation(); upvote(ann.id) }}
                        className="text-[11px] text-[#888e90] hover:text-[#fcfdff] transition-colors flex items-center gap-0.5"
                      >
                        ▲ {ann.upvotes}
                      </button>
                    </div>
                    <span className="text-[11px] text-[#464a4d] group-hover:text-[#888e90] transition-colors">
                      discuss →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Related papers */}
            {related.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-medium tracking-widest text-[#888e90] uppercase">
                  References
                </p>
                {related.map((r, i) => (
                  r.arxivId ? (
                    <Link
                      key={i}
                      href={`/${r.arxivId}`}
                      className="block rounded-xl p-3 space-y-1 transition-colors"
                      style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[12px] text-[rgba(252,253,255,0.86)] leading-snug line-clamp-2">{r.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[#888e90] truncate max-w-[70%]">
                          {r.authors.split(",")[0]}{r.authors.includes(",") ? " et al." : ""}
                          {r.year ? ` · ${r.year}` : ""}
                        </span>
                        {r.citationCount > 0 && (
                          <span className="text-[10px] text-[#464a4d]">{r.citationCount.toLocaleString()} cit.</span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div
                      key={i}
                      className="rounded-xl p-3 space-y-1 opacity-60"
                      style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-[12px] text-[rgba(252,253,255,0.86)] leading-snug line-clamp-2">{r.title}</p>
                      <span className="text-[10px] text-[#888e90]">
                        {r.authors.split(",")[0]}{r.year ? ` · ${r.year}` : ""}
                      </span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Active annotation — bottom sheet (mobile) + highlight sync */}
      {active && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setActive(null)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-5 space-y-3 lg:hidden"
            style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.14)", borderBottom: "none" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.14)] mx-auto mb-1" />

            <p className="text-[11px] italic text-[#888e90] line-clamp-2">
              "{active.anchorText}"
            </p>

            <p className="text-[15px] text-[rgba(252,253,255,0.9)] leading-relaxed">
              {active.body}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[12px] text-[#888e90]">{active.authorName}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { upvote(active.id); setActive(prev => prev ? { ...prev, upvotes: prev.upvotes + 1 } : null) }}
                  className="flex items-center gap-1.5 text-[13px] text-[#888e90] hover:text-[#fcfdff] transition-colors"
                >
                  <span>▲</span>
                  <span>{active.upvotes}</span>
                </button>
                <button
                  onClick={() => setActive(null)}
                  className="text-[13px] text-[#888e90] hover:text-[#fcfdff] transition-colors px-3 py-1 rounded-lg"
                  style={{ border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 1 — mini toolbar floating above selection */}
      {selection && !annotating && !showAuth && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeSelection} />
          <div
            className="fixed z-50 flex items-center gap-1 rounded-lg px-1 py-1 shadow-2xl"
            style={{
              background: "#0a0a0c",
              border: "1px solid rgba(255,255,255,0.16)",
              left: Math.min(Math.max(selection.x - 70, 12), (typeof window !== "undefined" ? window.innerWidth : 800) - 160),
              top: selection.y - 52,
            }}
          >
            <button
              onClick={openAnnotateForm}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md text-[13px] font-medium text-[#fcfdff] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
            >
              <span>✎</span>
              <span>Annotate</span>
            </button>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
            <button
              onClick={closeSelection}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[#888e90] hover:text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[16px]"
            >
              ×
            </button>
          </div>
        </>
      )}

      {/* Step 2 — annotation form */}
      {selection && annotating && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={closeSelection} />
          <div
            className="fixed z-50 rounded-2xl p-5 w-[340px] shadow-2xl"
            style={{
              background: "#0a0a0c",
              border: "1px solid rgba(255,255,255,0.14)",
              left: Math.min(Math.max(selection.x - 170, 12), (typeof window !== "undefined" ? window.innerWidth : 800) - 360),
              top: Math.min(selection.y - 20, (typeof window !== "undefined" ? window.innerHeight : 800) - 260),
            }}
          >
            <p className="text-[11px] italic text-[#888e90] mb-3 line-clamp-2 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              &ldquo;{selection.text}&rdquo;
            </p>
            <textarea
              autoFocus
              value={draftBody}
              onChange={e => setDraftBody(e.target.value)}
              placeholder="What does this passage mean? What's missing? What's surprising?"
              className="w-full text-[14px] text-[#fcfdff] placeholder:text-[#464a4d] rounded-xl p-3 h-28 resize-none focus:outline-none leading-relaxed"
              style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.10)" }}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit() }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-[#464a4d]">
                {sessionUser ? <>as <span className="text-[#888e90]">{sessionUser.name}</span></> : "⌘↵ to post"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={closeSelection}
                  className="px-3 h-8 text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors rounded-lg"
                  style={{ border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={posting || !draftBody.trim()}
                  className="px-4 h-8 rounded-lg text-[12px] font-medium bg-[#fcfdff] text-black hover:bg-[rgba(252,253,255,0.9)] disabled:opacity-30 transition-colors"
                >
                  {posting ? "Saving…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Auth modal triggered from toolbar */}
      {showAuth && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowAuth(false)} />
          <div
            className="fixed z-50 rounded-2xl p-6 w-80 shadow-2xl"
            style={{
              background: "#0a0a0c",
              border: "1px solid rgba(255,255,255,0.14)",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <p className="font-display text-lg font-medium text-[#fcfdff] mb-1">Sign in to annotate</p>
            <p className="text-[12px] text-[#888e90] mb-5">Enter your email — we'll send a code.</p>
            <AuthModal
              onSuccess={handleAuthSuccess}
              onCancel={() => { setShowAuth(false); setSelection(null) }}
            />
          </div>
        </>
      )}
    </div>
  )
}
