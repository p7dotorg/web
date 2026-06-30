import type { PaperMeta } from "./arxiv"

interface CrossrefWork {
  title?: string[]
  author?: { given?: string; family?: string }[]
  abstract?: string
  DOI?: string
  published?: { "date-parts": number[][] }
  "container-title"?: string[]
  publisher?: string
  subject?: string[]
}

function stripJats(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Returns arXiv ID if DOI is an arXiv DOI (10.48550/arXiv.XXXX.XXXXX)
export function extractArxivFromDoi(doi: string): string | null {
  const m = doi.match(/10\.48550\/arXiv\.(\d{4}\.\d{4,5})/i)
  return m ? m[1] : null
}

// Returns true if string looks like a DOI
export function isDoi(s: string): boolean {
  return /^10\.\d{4,}\/\S+/.test(s.trim()) ||
    /^https?:\/\/(dx\.)?doi\.org\/10\.\d{4,}\/\S+/.test(s.trim())
}

// Normalise raw input to bare DOI string
export function normalizeDoi(s: string): string {
  return s.trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .trim()
}

export async function fetchFromCrossref(doi: string): Promise<PaperMeta | null> {
  try {
    const res = await fetch(
      `https://api.crossref.org/works/${doi}`,
      {
        headers: {
          "User-Agent": "paper7/1.0 (mailto:hi@paper7.org)",
          "Accept": "application/json",
        },
        cache: "no-store",
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    const w: CrossrefWork = json.message

    const title = w.title?.[0] ?? "Untitled"
    const authors = (w.author ?? [])
      .map(a => [a.given, a.family].filter(Boolean).join(" "))
      .join(", ")

    const abstract = w.abstract ? stripJats(w.abstract) : ""
    const journal = w["container-title"]?.[0] ?? w.publisher ?? ""
    const year = w.published?.["date-parts"]?.[0]?.[0]

    // Build markdown content from what we have
    const lines: string[] = []
    if (journal) lines.push(`Published in: ${journal}${year ? ` (${year})` : ""}`)
    if (abstract) lines.push(abstract)
    const markdown = lines.join("\n\n") || title

    const categories = (w.subject ?? []).slice(0, 3).join(", ")

    return {
      arxivId: doi,
      title,
      authors,
      abstract,
      markdown,
      version: "crossref",
      categories,
    }
  } catch {
    return null
  }
}
