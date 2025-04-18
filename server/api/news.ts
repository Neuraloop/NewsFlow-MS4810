import axios from 'axios';
import type { Request, Response } from 'express';
import { NewsApiResponse, NewsArticle } from '@shared/schema';

const DEFAULT_NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

export async function getTopHeadlines(
  req: Request, 
  res: Response
) {
  try {
    const { category, page = 1, pageSize = 10 } = req.query;
    const apiKey = req.user?.newsApiKey || DEFAULT_NEWS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        message: 'News API key is required.'
      });
    }
    
    console.log('Fetching top headlines with category:', category || 'general');
    
    const response = await axios.get<NewsApiResponse>(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        country: 'us',
        category,
        page,
        pageSize,
        apiKey,
      },
    });

    // Add category to each article and ensure publishedAt is properly formatted
    const articlesWithCategory = response.data.articles.map(article => ({
      ...article,
      category: (category as string) || 'general',
      // Ensure publishedAt is properly formatted
      publishedAt: article.publishedAt || new Date().toISOString()
    }));

    res.json({
      ...response.data,
      articles: articlesWithCategory,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({ 
        message: `Error loading news: ${error.response?.data?.message || error.message}`
      });
    } else {
      res.status(500).json({ message: 'Failed to fetch news' });
    }
  }
}

export async function searchNews(
  req: Request, 
  res: Response
) {
  try {
    const { q, page = 1, pageSize = 10, from, to, sortBy } = req.query;
    const apiKey = req.user?.newsApiKey || DEFAULT_NEWS_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        message: 'News API key is required.'
      });
    }
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    console.log('Searching news with query:', q);
    
    const response = await axios.get<NewsApiResponse>(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        q,
        page,
        pageSize,
        from,
        to,
        sortBy: sortBy || 'publishedAt',
        apiKey,
      },
    });
    
    // Ensure publishedAt is properly formatted for each article
    const articlesWithDates = response.data.articles.map(article => ({
      ...article,
      category: 'search',
      // Ensure publishedAt is properly formatted
      publishedAt: article.publishedAt || new Date().toISOString()
    }));
    
    res.json({
      ...response.data,
      articles: articlesWithDates,
    });
  } catch (error) {
    console.error('Error searching news:', error);
    if (axios.isAxiosError(error)) {
      res.status(error.response?.status || 500).json({ 
        message: `Error searching news: ${error.response?.data?.message || error.message}`
      });
    } else {
      res.status(500).json({ message: 'Failed to search news' });
    }
  }
}
