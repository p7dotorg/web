import { pgTable, text, integer, timestamp, uuid, index } from "drizzle-orm/pg-core"

export const papers = pgTable("papers", {
  arxivId:   text("arxiv_id").primaryKey(),
  title:     text("title").notNull(),
  authors:   text("authors").notNull(),
  abstract:  text("abstract").notNull(),
  markdown:  text("markdown").notNull(),
  version:   text("version").notNull().default("v1"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
})

export const annotations = pgTable("annotations", {
  id:          uuid("id").primaryKey().defaultRandom(),
  paperId:     text("paper_id").notNull().references(() => papers.arxivId, { onDelete: "cascade" }),
  anchorText:  text("anchor_text").notNull(),
  anchorStart: integer("anchor_start").notNull(),
  anchorEnd:   integer("anchor_end").notNull(),
  body:        text("body").notNull(),
  authorId:    text("author_id").notNull(),
  authorName:  text("author_name").notNull(),
  isAi:        integer("is_ai").notNull().default(0),
  upvotes:     integer("upvotes").notNull().default(0),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("annotations_paper_idx").on(t.paperId),
])

export const upvotes = pgTable("upvotes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  annotationId: uuid("annotation_id").notNull().references(() => annotations.id, { onDelete: "cascade" }),
  userId:       text("user_id").notNull(),
})
