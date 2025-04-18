import { users, interests, savedArticles, userInterestsPivot } from "@shared/schema";
import type { User, InsertUser, Interest, InsertInterest, SavedArticle, InsertSavedArticle, UpdateUser } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: UpdateUser): Promise<User>;
  
  // Interests
  getInterests(userId: number): Promise<Interest[]>;
  createInterest(interest: InsertInterest & { userId: number }): Promise<Interest>;
  deleteInterest(id: number, userId: number): Promise<void>;
  
  // Saved Articles
  getSavedArticles(userId: number): Promise<SavedArticle[]>;
  saveArticle(article: InsertSavedArticle & { userId: number }): Promise<SavedArticle>;
  deleteSavedArticle(id: number, userId: number): Promise<void>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Use PostgreSQL session store in production, memory store otherwise
    this.sessionStore = process.env.NODE_ENV === 'production'
      ? new PostgresSessionStore({ pool, tableName: 'sessions', createTableIfMissing: true })
      : new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: UpdateUser): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getInterests(userId: number): Promise<Interest[]> {
    return await db.select().from(interests).where(eq(interests.userId, userId));
  }

  async createInterest(interest: InsertInterest & { userId: number }): Promise<Interest> {
    const [newInterest] = await db
      .insert(interests)
      .values(interest)
      .returning();
    return newInterest;
  }

  async deleteInterest(id: number, userId: number): Promise<void> {
    await db
      .delete(interests)
      .where(
        and(
          eq(interests.id, id),
          eq(interests.userId, userId)
        )
      );
  }

  async getSavedArticles(userId: number): Promise<SavedArticle[]> {
    return await db
      .select()
      .from(savedArticles)
      .where(eq(savedArticles.userId, userId))
      .orderBy(savedArticles.savedAt);
  }

  async saveArticle(article: InsertSavedArticle & { userId: number }): Promise<SavedArticle> {
    const [savedArticle] = await db
      .insert(savedArticles)
      .values(article)
      .returning();
    return savedArticle;
  }

  async deleteSavedArticle(id: number, userId: number): Promise<void> {
    await db
      .delete(savedArticles)
      .where(
        and(
          eq(savedArticles.id, id),
          eq(savedArticles.userId, userId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
