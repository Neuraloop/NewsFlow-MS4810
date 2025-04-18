import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getTopHeadlines, searchNews } from "./api/news";
import { summarizeArticle, generateNewsForInterests } from "./api/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up authentication routes
  setupAuth(app);

  // News API routes
  app.get("/api/news/top-headlines", getTopHeadlines);
  app.get("/api/news/search", searchNews);

  // Gemini AI routes
  app.post("/api/ai/summarize-article", summarizeArticle);
  app.post("/api/ai/generate-news-for-interests", generateNewsForInterests);

  // User interests routes
  app.get("/api/interests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const interests = await storage.getInterests(req.user!.id);
      res.json(interests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });

  app.post("/api/interests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const interest = await storage.createInterest({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json(interest);
    } catch (error) {
      res.status(500).json({ message: "Failed to create interest" });
    }
  });

  app.delete("/api/interests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      await storage.deleteInterest(parseInt(req.params.id), req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete interest" });
    }
  });

  // Saved articles routes
  app.get("/api/saved-articles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const articles = await storage.getSavedArticles(req.user!.id);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved articles" });
    }
  });

  app.post("/api/saved-articles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const article = await storage.saveArticle({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to save article" });
    }
  });

  app.delete("/api/saved-articles/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      await storage.deleteSavedArticle(parseInt(req.params.id), req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete saved article" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
