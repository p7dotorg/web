import Anthropic from "@anthropic-ai/sdk"

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

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
