import { pgTable, text, integer, timestamp, uuid, index } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  email:     text("email").notNull().unique(),
  name:      text("name").notNull(),
  bio:       text("bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const papers = pgTable("papers", {
  arxivId:    text("arxiv_id").primaryKey(),
  title:      text("title").notNull(),
  authors:    text("authors").notNull(),
  abstract:   text("abstract").notNull(),
  markdown:   text("markdown").notNull(),
  version:    text("version").notNull().default("v1"),
  categories: text("categories").notNull().default(""),
  fetchedAt:  timestamp("fetched_at").notNull().defaultNow(),
})

// Reading list: what each user is reading
export const userPapers = pgTable("user_papers", {
  id:      uuid("id").primaryKey().defaultRandom(),
  userId:  uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paperId: text("paper_id").notNull().references(() => papers.arxivId, { onDelete: "cascade" }),
  status:  text("status").notNull().default("reading"), // reading | read | want_to_read
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (t) => [
  index("user_papers_user_idx").on(t.userId),
  index("user_papers_paper_idx").on(t.paperId),
])

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

// Comments on annotations — the social layer
export const comments = pgTable("comments", {
  id:           uuid("id").primaryKey().defaultRandom(),
  annotationId: uuid("annotation_id").notNull().references(() => annotations.id, { onDelete: "cascade" }),
  authorId:     text("author_id").notNull(),
  authorName:   text("author_name").notNull(),
  body:         text("body").notNull(),
  isAi:         integer("is_ai").notNull().default(0),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("comments_annotation_idx").on(t.annotationId),
])

export const otpCodes = pgTable("otp_codes", {
  id:        uuid("id").primaryKey().defaultRandom(),
  email:     text("email").notNull(),
  code:      text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used:      integer("used").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const upvotes = pgTable("upvotes", {
  id:           uuid("id").primaryKey().defaultRandom(),
  annotationId: uuid("annotation_id").notNull().references(() => annotations.id, { onDelete: "cascade" }),
  userId:       text("user_id").notNull(),
})

export const follows = pgTable("follows", {
  id:          uuid("id").primaryKey().defaultRandom(),
  followerId:  text("follower_id").notNull(),  // session email
  followingId: text("following_id").notNull(), // authorId of who is being followed
  createdAt:   timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("follows_follower_idx").on(t.followerId),
  index("follows_following_idx").on(t.followingId),
])
