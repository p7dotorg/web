"use client"

export default function SearchTrigger() {
  return (
    <button
      className="hidden sm:flex items-center gap-3 h-9 px-4 rounded-lg text-sm text-[#464a4d] hover:text-[#888e90] transition-colors w-full max-w-xs mx-8"
      style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.08)" }}
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        )
      }
    >
      <span className="flex-1 text-left">Search papers…</span>
      <kbd
        className="text-[10px] px-1.5 py-0.5 rounded"
        style={{ border: "1px solid rgba(255,255,255,0.14)", color: "#464a4d" }}
      >
        ⌘K
      </kbd>
    </button>
  )
}
