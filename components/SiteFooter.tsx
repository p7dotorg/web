import Link from "next/link"

export default function SiteFooter() {
  return (
    <footer
      className="px-4 sm:px-8 py-10"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-sm font-medium text-[#fcfdff] hover:opacity-80 transition-opacity">
            paper7
          </Link>
          <Link href="/" className="text-[12px] text-[#464a4d] hover:text-[#888e90] transition-colors">
            papers
          </Link>
          <Link href="/feed" className="text-[12px] text-[#464a4d] hover:text-[#888e90] transition-colors">
            following
          </Link>
          <Link href="/opensource" className="text-[12px] text-[#464a4d] hover:text-[#888e90] transition-colors">
            open source
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/p7dotorg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#464a4d] hover:text-[#888e90] transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
