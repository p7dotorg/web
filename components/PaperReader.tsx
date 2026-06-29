"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface Annotation {
  id: string
  anchorText: string
  anchorStart: number
  anchorEnd: number
  body: string
  authorName: string
  isAi: number
  upvotes: number
  createdAt: string
}

interface Paper {
  arxivId: string
  title: string
  authors: string
  abstract: string
  markdown: string
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
}: {
  paper: Paper
  initialAnnotations: Annotation[]
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [active, setActive] = useState<Annotation | null>(null)
  const [draftBody, setDraftBody] = useState("")
  const [posting, setPosting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !contentRef.current) return
    const text = sel.toString().trim()
    if (text.length < 10) return
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    // Compute char offset within the text content
    const fullText = contentRef.current.innerText
    const start = fullText.indexOf(text)
    if (start === -1) return
    setSelection({ text, start, end: start + text.length, x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 12 })
    setActive(null)
  }, [])

  const submit = async () => {
    if (!selection || !draftBody.trim()) return
    setPosting(true)
    const res = await fetch(`/api/papers/${paper.arxivId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anchorText: selection.text,
        anchorStart: selection.start,
        anchorEnd: selection.end,
        body: draftBody,
      }),
    })
    if (res.ok) {
      const ann = await res.json()
      setAnnotations(prev => [ann, ...prev])
    }
    setDraftBody("")
    setSelection(null)
    setPosting(false)
  }

  const upvote = async (id: string) => {
    const res = await fetch(`/api/papers/${paper.arxivId}/annotations/${id}/upvote`, { method: "POST" })
    if (res.ok) {
      const { upvotes } = await res.json()
      setAnnotations(prev => prev.map(a => a.id === id ? { ...a, upvotes } : a))
    }
  }

  const highlighted = annotations.map(a => a.anchorText)

  function renderText(text: string) {
    if (!highlighted.length) return text
    // Simple highlight — mark first occurrence of each anchor
    let result = text
    highlighted.forEach(h => {
      result = result.replace(h, `<mark class="bg-yellow-300/30 cursor-pointer hover:bg-yellow-300/50 transition-colors">${h}</mark>`)
    })
    return result
  }

  const paragraphs = paper.markdown.split(/\n{2,}/).filter(p => p.trim().length > 0)

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-neutral-200" onMouseUp={handleMouseUp}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <a href="/" className="text-yellow-400 font-black text-xl">p7</a>
        <span className="text-neutral-500 text-xs">{paper.arxivId}</span>
      </header>

      <div className="max-w-7xl mx-auto flex gap-8 px-6 py-10">
        {/* Paper content */}
        <article className="flex-1 min-w-0 max-w-3xl">
          <h1 className="text-2xl font-bold text-white leading-snug mb-2">{paper.title}</h1>
          <p className="text-neutral-500 text-sm mb-8">{paper.authors}</p>

          <div
            ref={contentRef}
            className="prose prose-invert prose-neutral max-w-none text-[15px] leading-7 select-text"
          >
            {paragraphs.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: renderText(p) }} className="mb-4" />
            ))}
          </div>
        </article>

        {/* Sidebar annotations */}
        <aside className="w-80 shrink-0 hidden lg:block">
          <h2 className="text-neutral-500 text-xs uppercase tracking-wider mb-4">
            Annotations ({annotations.length})
          </h2>
          <div className="space-y-3">
            {annotations.map(ann => (
              <div
                key={ann.id}
                className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm cursor-pointer hover:border-yellow-400/50 transition-colors"
                onClick={() => setActive(active?.id === ann.id ? null : ann)}
              >
                <blockquote className="text-neutral-500 text-xs italic mb-2 line-clamp-2">
                  "{ann.anchorText}"
                </blockquote>
                <p className="text-neutral-200">{ann.body}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-neutral-600 text-xs">{ann.authorName}</span>
                  <button
                    onClick={e => { e.stopPropagation(); upvote(ann.id) }}
                    className="text-neutral-500 hover:text-yellow-400 transition-colors text-xs flex items-center gap-1"
                  >
                    ▲ {ann.upvotes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Selection popup — add annotation */}
      {selection && (
        <div
          className="fixed z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-4 w-80"
          style={{ left: Math.min(selection.x - 160, window.innerWidth - 340), top: selection.y - 180 }}
        >
          <p className="text-neutral-500 text-xs italic mb-3 line-clamp-2">"{selection.text}"</p>
          <textarea
            autoFocus
            value={draftBody}
            onChange={e => setDraftBody(e.target.value)}
            placeholder="Add your annotation..."
            className="w-full bg-neutral-800 text-white text-sm rounded-lg p-3 h-24 resize-none
                       focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={submit}
              disabled={posting || !draftBody.trim()}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40
                         text-black font-bold text-sm py-2 rounded-lg transition-colors"
            >
              {posting ? "Saving..." : "Annotate"}
            </button>
            <button
              onClick={() => setSelection(null)}
              className="px-4 py-2 text-neutral-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
