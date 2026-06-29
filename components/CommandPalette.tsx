"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

const CATEGORIES = [
  "cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE",
  "stat.ML", "math.OC", "cs.RO", "q-bio.NC",
]

const SHORTCUTS = [
  { label: "Search by arXiv ID", hint: "e.g. 2401.12345", action: null },
  { label: "Browse cs.AI", hint: "category", action: "/category/cs.AI" },
  { label: "Browse cs.LG", hint: "category", action: "/category/cs.LG" },
  { label: "Browse cs.CL", hint: "category", action: "/category/cs.CL" },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const isArxivId = (q: string) => /^\d{4}\.\d{4,5}(v\d+)?$/.test(q.trim())
  const isUrl = (q: string) => q.includes("arxiv.org")

  const resolveId = (q: string) => {
    if (isUrl(q)) {
      return q
        .replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//i, "")
        .replace(/\.pdf$/i, "")
        .replace(/v\d+$/, "")
        .trim()
    }
    return q.trim().replace(/v\d+$/, "")
  }

  const catResults = query.length >= 2
    ? CATEGORIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : []

  const items: Array<{ label: string; hint: string; action: () => void }> = []

  if (query) {
    if (isArxivId(query) || isUrl(query)) {
      items.push({
        label: `Open paper ${resolveId(query)}`,
        hint: "arXiv",
        action: () => router.push(`/${resolveId(query)}`),
      })
    }
    catResults.forEach(c => {
      items.push({
        label: `Browse ${c}`,
        hint: "category",
        action: () => router.push(`/category/${encodeURIComponent(c)}`),
      })
    })
    if (!items.length) {
      items.push({
        label: `Search "${query}"`,
        hint: "press enter to open as arXiv ID",
        action: () => router.push(`/${query.trim()}`),
      })
    }
  } else {
    SHORTCUTS.forEach(s => {
      items.push({
        label: s.label,
        hint: s.hint,
        action: s.action ? () => router.push(s.action!) : () => inputRef.current?.focus(),
      })
    })
  }

  const go = (idx: number) => {
    items[idx]?.action()
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(i => Math.min(i + 1, items.length - 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)) }
    if (e.key === "Enter") { e.preventDefault(); go(selected) }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed z-50 rounded-2xl overflow-hidden shadow-2xl w-full max-w-lg"
        style={{
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.14)",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div
          className="flex items-center gap-3 px-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-[#464a4d] text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search papers, browse categories…"
            className="flex-1 h-12 text-sm text-[#fcfdff] placeholder:text-[#464a4d] bg-transparent focus:outline-none"
          />
          <kbd
            className="text-[10px] text-[#464a4d] px-1.5 py-0.5 rounded"
            style={{ border: "1px solid rgba(255,255,255,0.10)" }}
          >
            esc
          </kbd>
        </div>

        <div className="py-1 max-h-72 overflow-y-auto">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              onMouseEnter={() => setSelected(i)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
              style={{ background: i === selected ? "rgba(255,255,255,0.06)" : "transparent" }}
            >
              <span className="text-[13px] text-[#fcfdff]">{item.label}</span>
              <span className="text-[11px] text-[#464a4d] ml-4 shrink-0">{item.hint}</span>
            </button>
          ))}
        </div>

        <div
          className="flex items-center gap-4 px-4 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-[10px] text-[#464a4d]">↑↓ navigate</span>
          <span className="text-[10px] text-[#464a4d]">↵ open</span>
          <span className="text-[10px] text-[#464a4d]">esc close</span>
        </div>
      </div>
    </>
  )
}
