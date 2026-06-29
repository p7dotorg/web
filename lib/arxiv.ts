export interface PaperMeta {
  arxivId: string
  title: string
  authors: string
  abstract: string
  markdown: string
  version: string
}

export async function fetchPaper(arxivId: string): Promise<PaperMeta | null> {
  const clean = arxivId.replace(/^arxiv:/i, "").trim()

  // Fetch metadata from arXiv API
  const res = await fetch(
    `https://export.arxiv.org/api/query?id_list=${clean}&max_results=1`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  const xml = await res.text()

  const title   = xml.match(/<title>(?!arXiv)([\s\S]*?)<\/title>/)?.[1]?.trim().replace(/\s+/g, " ") ?? ""
  const authors = [...xml.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => m[1].trim()).join(", ")
  const abstract = xml.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim().replace(/\s+/g, " ") ?? ""
  const version = xml.match(/arxiv:version[^>]*>(\d+)<\/arxiv:version>/)?.[1] ?? "1"

  if (!title) return null

  // Fetch markdown via ar5iv (HTML → clean text fallback)
  const ar5ivRes = await fetch(`https://ar5iv.labs.arxiv.org/html/${clean}`, {
    headers: { Accept: "text/html" },
    next: { revalidate: 86400 },
  }).catch(() => null)

  let markdown = abstract
  if (ar5ivRes?.ok) {
    const html = await ar5ivRes.text()
    // Extract body text sections, strip HTML tags
    const sections = [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)]
    if (sections.length > 0) {
      markdown = sections
        .map(s => s[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .filter(s => s.length > 100)
        .join("\n\n")
    }
  }

  return { arxivId: clean, title, authors, abstract, markdown, version: `v${version}` }
}
