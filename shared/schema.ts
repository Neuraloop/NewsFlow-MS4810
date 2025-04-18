import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  newsApiKey: text("news_api_key"),
  geminiApiKey: text("gemini_api_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedArticles = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  source: text("source"),
  category: text("category"),
  publishedAt: timestamp("published_at"),
  savedAt: timestamp("saved_at").defaultNow(),
});

export const userInterestsPivot = pgTable("user_interests_pivot", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  interestId: integer("interest_id").notNull().references(() => interests.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey(t.userId, t.interestId),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  newsApiKey: true,
  geminiApiKey: true,
});

export const insertInterestSchema = createInsertSchema(interests).pick({
  name: true,
});

export const insertSavedArticleSchema = createInsertSchema(savedArticles).pick({
  title: true,
  description: true,
  url: true,
  imageUrl: true,
  source: true,
  category: true,
  publishedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type Interest = typeof interests.$inferSelect;
export type SavedArticle = typeof savedArticles.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type InsertSavedArticle = z.infer<typeof insertSavedArticleSchema>;

// API Response Types
export type NewsArticle = {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  source: {
    name: string;
  };
  publishedAt: string;
  content: string;
  category?: string;
};

export type NewsApiResponse = {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
};
