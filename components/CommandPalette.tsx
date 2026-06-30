"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { SearchResult } from "@/app/api/search/route"

const CATEGORIES = [
  "cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE",
  "stat.ML", "math.OC", "cs.RO", "q-bio.NC",
]

const SHORTCUTS = [
  { label: "Search by arXiv ID or DOI", hint: "e.g. 2401.12345 or 10.xxxx/…", action: null },
  { label: "Browse cs.AI", hint: "category", action: "/category/cs.AI" },
  { label: "Browse cs.LG", hint: "category", action: "/category/cs.LG" },
  { label: "Browse cs.CL", hint: "category", action: "/category/cs.CL" },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      setSearchResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const isArxivId = (q: string) => /^\d{4}\.\d{4,5}(v\d+)?$/.test(q.trim())
  const isUrl = (q: string) => q.includes("arxiv.org")
  const isDoi = (q: string) =>
    /^10\.\d{4,}\/\S+/.test(q.trim()) ||
    /^https?:\/\/(dx\.)?doi\.org\/10\.\d{4,}\/\S+/.test(q.trim())
  const normalizeDoi = (q: string) =>
    q.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim()

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

  const isDirectInput = (q: string) => isArxivId(q) || isUrl(q) || isDoi(q)

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2 || isDirectInput(q)) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data: SearchResult[] = await res.json()
        setSearchResults(data)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  useEffect(() => {
    doSearch(query)
    setSelected(0)
  }, [query, doSearch])

  const catResults = query.length >= 2
    ? CATEGORIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : []

  const items: Array<{ label: string; hint: string; sublabel?: string; action: () => void }> = []

  if (query) {
    if (isDoi(query)) {
      const doi = normalizeDoi(query)
      const arxivMatch = doi.match(/10\.48550\/arXiv\.(\d{4}\.\d{4,5})/i)
      const target = arxivMatch ? `/${arxivMatch[1]}` : `/doi/${doi}`
      items.push({
        label: `Open DOI ${doi}`,
        hint: "Crossref",
        action: () => router.push(target),
      })
    } else if (isArxivId(query) || isUrl(query)) {
      items.push({
        label: `Open paper ${resolveId(query)}`,
        hint: "arXiv",
        action: () => router.push(`/${resolveId(query)}`),
      })
    } else if (searchResults.length > 0) {
      searchResults.forEach(r => {
        items.push({
          label: r.title,
          sublabel: r.authors.split(",")[0] + (r.authors.includes(",") ? " et al." : ""),
          hint: r.source === "local"
            ? `${r.annotationCount > 0 ? `▲ ${r.annotationCount} notes` : "annotated"}`
            : "arXiv",
          action: () => router.push(r.id.startsWith("10.") ? `/doi/${r.id}` : `/${r.id}`),
        })
      })
    } else if (searching) {
      items.push({ label: "Searching…", hint: "", action: () => {} })
    } else {
      catResults.forEach(c => {
        items.push({
          label: `Browse ${c}`,
          hint: "category",
          action: () => router.push(`/category/${encodeURIComponent(c)}`),
        })
      })
      if (!items.length) {
        items.push({
          label: `Open "${query}" as arXiv ID`,
          hint: "press enter",
          action: () => router.push(`/${query.trim()}`),
        })
      }
    }

    catResults.forEach(c => {
      if (!items.find(i => i.label === `Browse ${c}`)) {
        items.push({
          label: `Browse ${c}`,
          hint: "category",
          action: () => router.push(`/category/${encodeURIComponent(c)}`),
        })
      }
    })
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
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search papers, arXiv ID, DOI…"
            className="flex-1 h-12 text-sm text-[#fcfdff] placeholder:text-[#464a4d] bg-transparent focus:outline-none"
          />
          {searching && (
            <span className="text-[11px] text-[#464a4d]">searching…</span>
          )}
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
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-[#fcfdff] truncate">{item.label}</div>
                {item.sublabel && (
                  <div className="text-[11px] text-[#464a4d] truncate mt-0.5">{item.sublabel}</div>
                )}
              </div>
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
