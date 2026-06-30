import SiteNav from "@/components/SiteNav"
import SiteFooter from "@/components/SiteFooter"

const projects = [
  {
    name: "paper7",
    tagline: "arXiv papers as clean Markdown",
    description:
      "Converts any arXiv paper to clean, readable Markdown — 97% smaller than PDF. No dependencies, no API key. A single Bash script that strips LaTeX noise, tables, and figures so LLMs can actually read research.",
    url: "https://github.com/p7dotorg/paper7",
    language: "Bash",
    badge: "core",
  },
  {
    name: "sdk",
    tagline: "TypeScript SDK for arXiv & PubMed",
    description:
      "Typed Effect v4 services for fetching and parsing academic papers. Drop-in research layer for TypeScript apps — arXiv and PubMed as first-class services with full type safety.",
    url: "https://github.com/p7dotorg/sdk",
    language: "TypeScript",
    badge: null,
  },
  {
    name: "paper-reviewer",
    tagline: "Adversarial pre-submission reviewer",
    description:
      "Red-teams your paper before you submit it. Checks for hallucinated citations, weak methodology, lack of novelty, and AI-generic writing. A hostile Reviewer 2 — automated.",
    url: "https://github.com/p7dotorg/paper-reviewer",
    language: "Python",
    badge: null,
  },
]

const langColor: Record<string, string> = {
  TypeScript: "#3178c6",
  Bash: "#4eaa25",
  Python: "#3572A5",
}

export default function OpenSourcePage() {
  return (
    <div className="min-h-screen bg-black text-[#fcfdff] flex flex-col">
      <SiteNav />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-8 py-16">

        {/* Header */}
        <div className="mb-14">
          <p className="text-[10px] font-medium tracking-widest text-[#464a4d] uppercase mb-4">
            Open source
          </p>
          <h1 className="font-display text-4xl font-medium tracking-tight text-[#fcfdff] mb-4">
            Built in the open.
          </h1>
          <p className="text-[15px] text-[#888e90] leading-relaxed max-w-xl">
            Everything we build is public. These are the tools that power paper7 — and that you can use independently.
          </p>
          <a
            href="https://github.com/p7dotorg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 text-[12px] text-[#888e90] hover:text-[#fcfdff] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            github.com/p7dotorg
          </a>
        </div>

        {/* Projects */}
        <div className="space-y-3">
          {projects.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl p-6 transition-colors"
              style={{
                background: "#0a0a0c",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[13px] font-semibold text-[#fcfdff] group-hover:text-white transition-colors">
                      {p.name}
                    </span>
                    {p.badge && (
                      <span
                        className="text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(255,89,0,0.12)",
                          color: "#ff5900",
                          border: "1px solid rgba(255,89,0,0.2)",
                        }}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#888e90] mb-3">{p.tagline}</p>
                  <p className="text-[13px] text-[#6e7578] leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="shrink-0 text-[#464a4d] group-hover:text-[#888e90] transition-colors mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: langColor[p.language] ?? "#888" }}
                  />
                  <span className="text-[11px] text-[#464a4d]">{p.language}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
