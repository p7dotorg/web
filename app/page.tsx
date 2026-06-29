import { redirect } from "next/navigation"

async function search(formData: FormData) {
  "use server"
  const q = formData.get("q")?.toString().trim()
  if (!q) return
  const id = q
    .replace(/^https?:\/\/arxiv\.org\/(abs|pdf)\//i, "")
    .replace(/^arxiv:/i, "")
    .replace(/v\d+$/, "")
    .trim()
  redirect(`/${id}`)
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
          <h1 className="text-6xl font-black text-white tracking-tight">p7</h1>
          <p className="mt-3 text-neutral-400 text-lg">
            Annotate academic papers. Understand the subtext.
          </p>
        </div>

        <form action={search} className="flex gap-2">
          <input
            name="q"
            autoFocus
            placeholder="arXiv ID or URL — e.g. 2401.12345"
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3
                       text-white placeholder:text-neutral-500 focus:outline-none
                       focus:border-yellow-400 transition-colors text-sm"
          />
          <button
            type="submit"
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold
                       px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
          >
            Open →
          </button>
        </form>

        <p className="text-neutral-600 text-sm">
          Like Genius, but for papers.
        </p>
      </div>
    </main>
  )
}
