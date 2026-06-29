import pg from "pg"

const { Pool } = pg
const pool = new Pool({ connectionString: "postgresql://lucianfialho@localhost:5432/p7" })

const papers = [
  {
    arxivId: "2410.21276",
    title: "GPT-4o System Card",
    authors: "OpenAI",
    abstract: "GPT-4o is an autoregressive omni model that accepts as input any combination of text, audio, image, and video, and generates any combination of text, audio, and image outputs.",
    markdown: "GPT-4o System Card\n\nGPT-4o is an autoregressive omni model that accepts as input any combination of text, audio, image, and video, and generates any combination of text, audio, and image outputs.\n\nIt matches GPT-4 Turbo performance on text in English and code, with significant improvement on text in non-English languages, while also being much faster and 50% cheaper in the API.\n\nGPT-4o is especially better at vision and audio understanding compared to existing models.",
    version: "v1",
  },
  {
    arxivId: "1706.03762",
    title: "Attention Is All You Need",
    authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
    abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.",
    markdown: "Attention Is All You Need\n\nThe dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.\n\nExperiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.\n\nWe achieve 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU.",
    version: "v5",
  },
  {
    arxivId: "2303.08774",
    title: "GPT-4 Technical Report",
    authors: "OpenAI",
    abstract: "We report the development of GPT-4, a large multimodal model (accepting image and text inputs, emitting text outputs) that, while less capable than humans in many real-world scenarios, exhibits human-level performance on various professional and academic benchmarks.",
    markdown: "GPT-4 Technical Report\n\nWe report the development of GPT-4, a large multimodal model (accepting image and text inputs, emitting text outputs) that exhibits human-level performance on various professional and academic benchmarks.\n\nFor example, it passes a simulated bar exam with a score around the top 10% of test takers; in contrast, GPT-3.5's score was around the bottom 10%.\n\nGPT-4 is a Transformer-based model pre-trained to predict the next token in a document. The post-training alignment process results in improved performance on measures of factuality and adherence to desired behavior.",
    version: "v2",
  },
]

const annotations = [
  {
    paperId: "2410.21276",
    anchorText: "matches GPT-4 Turbo performance on text in English and code",
    anchorStart: 210,
    anchorEnd: 270,
    body: "This claim is heavily qualified — 'matches' on benchmarks doesn't mean equivalent in practice. In coding evals GPT-4o actually regressed on some HumanEval subsets. Read the appendix before taking this at face value.",
    authorId: "seed-1",
    authorName: "ML Practitioner",
    isAi: 0,
    upvotes: 41,
  },
  {
    paperId: "2410.21276",
    anchorText: "50% cheaper in the API",
    anchorStart: 276,
    anchorEnd: 296,
    body: "True at launch. By the time you read this, pricing has likely changed again. OpenAI adjusts rates frequently — always check the current pricing page.",
    authorId: "seed-2",
    authorName: "Dev Rel anon",
    isAi: 0,
    upvotes: 28,
  },
  {
    paperId: "1706.03762",
    anchorText: "dispensing with recurrence and convolutions entirely",
    anchorStart: 289,
    anchorEnd: 339,
    body: "This was the bold bet that paid off. In 2017, dropping LSTMs felt risky — every major NLP lab was invested in recurrence. The fact that they went all-in on attention is what made this paper a paradigm shift, not just an improvement.",
    authorId: "seed-3",
    authorName: "NLP researcher",
    isAi: 0,
    upvotes: 87,
  },
  {
    paperId: "1706.03762",
    anchorText: "28.4 BLEU on the WMT 2014 English-to-German translation task",
    anchorStart: 388,
    anchorEnd: 448,
    body: "BLEU has since fallen out of favor as the go-to metric for translation quality — humans consistently find that higher BLEU doesn't always mean better translations. The field has moved toward COMET and human eval. Ironic that a seminal paper is anchored to a metric we now distrust.",
    authorId: "seed-4",
    authorName: "Computational linguist",
    isAi: 0,
    upvotes: 63,
  },
  {
    paperId: "2303.08774",
    anchorText: "passes a simulated bar exam with a score around the top 10% of test takers",
    anchorStart: 230,
    anchorEnd: 298,
    body: "The 'simulated' qualifier is doing a lot of work here. It's the multiple-choice MBE portion, not the full bar. Real bar exams include essays and performance tests that require sustained legal reasoning — a very different capability.",
    authorId: "seed-5",
    authorName: "Law student",
    isAi: 0,
    upvotes: 52,
  },
  {
    paperId: "2303.08774",
    anchorText: "GPT-3.5's score was around the bottom 10%",
    anchorStart: 299,
    anchorEnd: 342,
    body: "This comparison is the real story. The jump from 3.5 → 4 on legal reasoning is massive. What's wild is GPT-3.5 was already considered impressive when it launched — and it was apparently failing the bar at near-chance level.",
    authorId: "seed-6",
    authorName: "AI benchmarks nerd",
    isAi: 0,
    upvotes: 34,
  },
]

async function seed() {
  const client = await pool.connect()
  try {
    // Insert papers
    for (const p of papers) {
      await client.query(
        `INSERT INTO papers (arxiv_id, title, authors, abstract, markdown, version)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (arxiv_id) DO NOTHING`,
        [p.arxivId, p.title, p.authors, p.abstract, p.markdown, p.version]
      )
    }
    console.log(`✓ ${papers.length} papers`)

    // Insert annotations
    for (const a of annotations) {
      await client.query(
        `INSERT INTO annotations (paper_id, anchor_text, anchor_start, anchor_end, body, author_id, author_name, is_ai, upvotes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.paperId, a.anchorText, a.anchorStart, a.anchorEnd, a.body, a.authorId, a.authorName, a.isAi, a.upvotes]
      )
    }
    console.log(`✓ ${annotations.length} annotations`)
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(console.error)
