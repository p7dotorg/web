export interface RelatedPaper {
  arxivId: string | null
  title: string
  authors: string
  year: number | null
  citationCount: number
}

export async function fetchRelated(arxivId: string): Promise<RelatedPaper[]> {
  try {
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}/references?fields=title,authors,year,citationCount,externalIds&limit=8`,
      { next: { revalidate: 86400 } }
    )
    if (!res.ok) return []
    const { data } = await res.json()
    return (data ?? [])
      .filter((r: any) => r.citedPaper?.title)
      .map((r: any) => ({
        arxivId: r.citedPaper.externalIds?.ArXiv ?? null,
        title: r.citedPaper.title,
        authors: (r.citedPaper.authors ?? []).map((a: any) => a.name).join(", "),
        year: r.citedPaper.year ?? null,
        citationCount: r.citedPaper.citationCount ?? 0,
      }))
      .sort((a: RelatedPaper, b: RelatedPaper) => b.citationCount - a.citationCount)
      .slice(0, 6)
  } catch {
    return []
  }
}
