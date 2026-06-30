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
  }

  const handleAuthSuccess = (user: AuthUser) => {
    setSessionUser(user)
    setShowAuth(false)
    if (draftBody.trim() && selection) {
      // use captured selection/draftBody before state clears
      postAnnotation(selection, draftBody)
    }
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
        className="sticky top-0 z-20 flex items-center justify-between px-8 h-14"
        style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-5">
          <a href="/" className="font-display text-lg font-medium text-[#fcfdff]">paper7</a>
          <a href="/" className="text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors hidden sm:inline">feed</a>
        </div>
        <div className="flex items-center gap-3">
          {cats.slice(0, 2).map(c => (
            <Link
              key={c}
              href={`/category/${encodeURIComponent(c)}`}
              className="text-[10px] px-2 py-0.5 rounded-full text-[#888e90] hover:text-[#fcfdff] transition-colors hidden md:inline"
              style={{ border: "1px solid rgba(255,255,255,0.14)" }}
            >
              {c}
            </Link>
          ))}
          <SavePaperButton
            paperId={paper.arxivId}
            initialStatus={savedStatus}
            session={sessionUser}
          />
          {sessionUser ? (
            <>
              <Link
                href="/me"
                className="text-[12px] font-medium text-[#888e90] hover:text-[#fcfdff] transition-colors"
              >
                {sessionUser.name}
              </Link>
              <button
                onClick={logout}
                className="text-[11px] px-3 py-1 rounded-lg text-[#464a4d] hover:text-[#888e90] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                out
              </button>
            </>
          ) : (
            <button
              onClick={() => { setShowAuth(true) }}
              className="text-[12px] px-4 py-1.5 rounded-lg font-medium text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
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
                <div
                  key={ann.id}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-150 space-y-2"
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
                    <Link
                      href={`/annotations/${ann.id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-[11px] text-[#888e90] hover:text-[#fcfdff] transition-colors flex items-center gap-1"
                    >
                      discuss →
                    </Link>
                  </div>
                </div>
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

      {/* Selection popup */}
      {selection && (
        <div
          className="fixed z-50 rounded-xl p-4 w-80 shadow-2xl"
          style={{
            background: "#0a0a0c",
            border: "1px solid rgba(255,255,255,0.14)",
            left: Math.min(Math.max(selection.x - 160, 16), window.innerWidth - 340),
            top: selection.y - 200,
          }}
        >
          <p className="text-[11px] italic text-[#888e90] mb-3 line-clamp-2">"{selection.text}"</p>

          {showAuth ? (
            <AuthModal
              onSuccess={handleAuthSuccess}
              onCancel={() => { setShowAuth(false); setSelection(null) }}
            />
          ) : (
            <>
              <textarea
                autoFocus
                value={draftBody}
                onChange={e => setDraftBody(e.target.value)}
                placeholder="Add your annotation..."
                className="w-full text-sm text-[#fcfdff] placeholder:text-[#464a4d] rounded-lg p-3 h-24 resize-none focus:outline-none"
                style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.14)" }}
              />
              {sessionUser ? (
                <p className="text-[10px] text-[#464a4d] mt-1">
                  Posting as <span className="text-[#888e90]">{sessionUser.name}</span>
                  <button onClick={logout} className="ml-2 hover:text-[#fcfdff] transition-colors">sign out</button>
                </p>
              ) : (
                <p className="text-[10px] text-[#464a4d] mt-1">
                  You&apos;ll sign in with email to post
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={submit}
                  disabled={posting || !draftBody.trim()}
                  className="flex-1 h-9 rounded-lg text-sm font-medium bg-[#fcfdff] text-black hover:bg-[#f1f7fe] disabled:opacity-30 transition-colors"
                >
                  {posting ? "Saving…" : sessionUser ? "Annotate" : "Continue →"}
                </button>
                <button
                  onClick={() => setSelection(null)}
                  className="px-4 h-9 text-[13px] text-[#888e90] hover:text-[#fcfdff] transition-colors rounded-lg"
                  style={{ border: "1px solid rgba(255,255,255,0.14)" }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
