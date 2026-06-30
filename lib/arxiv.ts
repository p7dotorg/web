export interface PaperMeta {
  arxivId: string
  title: string
  authors: string
  abstract: string
  markdown: string
  version: string
  categories: string
}

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ").trim()
}

function mathToLatex(html: string): string {
  return html.replace(
    /<math[^>]*>([\s\S]*?)<\/math>/g,
    (_, inner) => {
      const tex = inner.match(/<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/)?.[1]?.trim()
      return tex ? `$${tex}$` : ""
    }
  )
}

function cleanText(t: string): string {
  return t
    .replace(/\[\s*[\d,\s–\-]+\s*\]/g, "")   // strip citation refs [1], [1, 2]
    .replace(/\s{2,}/g, " ")
    .trim()
}

function stripNoisyElements(html: string): string {
  return html
    // Remove figures (algorithm environments, images, captions)
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    // Remove tables (algorithm pseudocode is often in ltx_tabular)
    .replace(/<table[\s\S]*?<\/table>/gi, "")
    // Remove inline code / algorithm listings
    .replace(/<pre[\s\S]*?<\/pre>/gi, "")
    // Remove footnotes
    .replace(/<span[^>]*class="[^"]*ltx_note[^"]*"[\s\S]*?<\/span>/gi, "")
}

const BROKEN_TEXT_RE = /superscript|subscript|ltx_|\\mathrm|\\mathbb|\\tilde|\\ell|\\leavevmode/i

function extractSections(html: string): string {
  // Skip title/author/abstract header — target only <section> content
  const sectionMatches = [...html.matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)]
  if (!sectionMatches.length) return ""

  const blocks: string[] = []

  for (const [, rawSectionHtml] of sectionMatches) {
    const sectionHtml = stripNoisyElements(rawSectionHtml)

    // Extract heading
    const headingMatch = sectionHtml.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/)
    if (headingMatch) {
      const headingText = htmlToText(headingMatch[1]).replace(/^\d+\.?\s*/, "").trim()
      if (headingText && headingText.length < 120) {
        blocks.push(`## ${headingText}`)
      }
    }

    // Extract paragraphs — skip ones that contain algorithm artifacts
    const paraMatches = [...sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    for (const [, paraHtml] of paraMatches) {
      const withLatex = mathToLatex(paraHtml)
      const text = cleanText(htmlToText(withLatex))
      if (text.length > 40 && !BROKEN_TEXT_RE.test(text)) blocks.push(text)
    }
  }

  return blocks.join("\n\n")
}

export async function fetchPaper(arxivId: string): Promise<PaperMeta | null> {
  const clean = arxivId.replace(/^arxiv:/i, "").trim()

  const res = await fetch(
    `https://export.arxiv.org/api/query?id_list=${clean}&max_results=1`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  const xml = await res.text()

  const title    = xml.match(/<title>(?!arXiv)([\s\S]*?)<\/title>/)?.[1]?.trim().replace(/\s+/g, " ") ?? ""
  const authors  = [...xml.matchAll(/<name>([\s\S]*?)<\/name>/g)].map(m => m[1].trim()).join(", ")
  const abstract = xml.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim().replace(/\s+/g, " ") ?? ""
  const version  = xml.match(/arxiv:version[^>]*>(\d+)<\/arxiv:version>/)?.[1] ?? "1"
  const categories = [
    ...xml.matchAll(/arxiv:primary_category[^/]*term="([^"]+)"/g),
    ...xml.matchAll(/<category[^/]*term="([^"]+)"/g),
  ]
    .map(m => m[1])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(",")

  if (!title) return null

  const ar5ivRes = await fetch(`https://ar5iv.labs.arxiv.org/html/${clean}`, {
    headers: { Accept: "text/html" },
    next: { revalidate: 86400 },
  }).catch(() => null)

  let markdown = abstract
  if (ar5ivRes?.ok) {
    const html = await ar5ivRes.text()
    const extracted = extractSections(html)
    if (extracted.length > 200) markdown = extracted
  }

  return { arxivId: clean, title, authors, abstract, markdown, version: `v${version}`, categories }
}
