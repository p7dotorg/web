import Anthropic from "@anthropic-ai/sdk"

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export interface GeneratedAnnotation {
  anchorText: string
  body: string
}

export async function generateAnnotations({
  title,
  authors,
  content,
}: {
  title: string
  authors: string
  content: string
}): Promise<GeneratedAnnotation[]> {
  if (!client) return []

  const truncated = content.slice(0, 12000)

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are an expert academic reader generating annotations for a social reading platform. Generate 5 high-quality annotations for this paper.

Paper: "${title}"
Authors: ${authors}

Content:
${truncated}

Rules:
- anchorText: an EXACT verbatim quote from the paper content above (20-180 chars). Must appear word-for-word in the text.
- body: 2-4 sentences of non-obvious insight — tension with prior work, unacknowledged limitation, unexpected implication, connection to another field, or a question the paper opens but doesn't answer.
- NEVER paraphrase what the paper already says. NEVER use "This is interesting". Be intellectually honest and specific.
- Vary the angles: one technical, one critical, one about impact, one philosophical, one about methodology.

Return ONLY a JSON array, no markdown:
[{"anchorText": "...", "body": "..."}, ...]`,
        },
      ],
    })

    const block = msg.content[0]
    if (block.type !== "text") return []

    const parsed = JSON.parse(block.text.trim())
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a: GeneratedAnnotation) => a.anchorText && a.body)
  } catch (err) {
    console.error("generateAnnotations error:", err)
    return []
  }
}

export async function generateSeedComment({
  paperTitle,
  anchorText,
  annotationBody,
}: {
  paperTitle: string
  anchorText: string
  annotationBody: string
}): Promise<string | null> {
  if (!client) return null

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a sharp, intellectually curious reader in a discussion about an academic paper.

Paper: "${paperTitle}"

Highlighted passage: "${anchorText}"

Reader's annotation: "${annotationBody}"

Write ONE concise response (2-3 sentences) that either:
- Raises a specific question this annotation opens up
- Points out a tension or implication the annotator may not have considered
- Connects this to a broader debate in the field

Be direct and specific. No sycophantic openers. No "Great annotation!". Speak as a peer, not an assistant.`,
        },
      ],
    })

    const block = msg.content[0]
    return block.type === "text" ? block.text.trim() : null
  } catch (err) {
    console.error("AI seed comment error:", err)
    return null
  }
}
