import axios from 'axios';
import type { Request, Response } from 'express';
import { NewsArticle } from '@shared/schema';

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Define multiple API endpoints to try in case one fails
export const GEMINI_API_URLS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
];

export const GEMINI_API_URL = GEMINI_API_URLS[0];

export async function summarizeArticle(req: Request, res: Response) {
  try {
    const { title, content, description, url } = req.body;
    const apiKey = req.user?.geminiApiKey || DEFAULT_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        message: 'Gemini API key is required. Please add it in your profile settings.'
      });
    }

    if (!title || (!content && !description)) {
      return res.status(400).json({ message: 'Article title and content or description are required' });
    }

    const articleText = content || description;
    console.log('Sending summarization request to Gemini API:', { title, url });

    // Try all available API endpoints with different prompt formats
    for (let i = 0; i < GEMINI_API_URLS.length; i++) {
      try {
        console.log(`Trying Gemini API endpoint ${i+1}/${GEMINI_API_URLS.length}:`, GEMINI_API_URLS[i]);
        
        // Different prompt formats for different attempts
        let prompt = "";
        if (i === 0) {
          prompt = `Provide a concise, informative summary of this news article:
          Title: ${title}
          Content: ${articleText}
          
          Format your response in markdown with:
          1. A brief overview (2-3 sentences)
          2. A bullet list with 3-5 key points
          3. Any important implications or context`;
        } else if (i === 1) {
          prompt = `Summarize this news article in a clear, concise way:
          Title: ${title}
          Content: ${articleText}
          
          Keep it brief but informative.`;
        } else {
          prompt = `Create a simple summary of this article:
          Title: ${title}
          Content: ${articleText}`;
        }
        
        const response = await axios.post(
          `${GEMINI_API_URLS[i]}?key=${apiKey}`,
          {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
              topP: 0.95,
              topK: 40
            }
          },
          {
            timeout: 15000 // 15 seconds timeout
          }
        );

        console.log(`Received response from Gemini API endpoint ${i+1}`);

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const summary = response.data.candidates[0].content.parts[0].text;
          return res.json({ summary });
        }
      } catch (apiError) {
        console.error(`Error with Gemini API endpoint ${i+1}:`, apiError);
        // Continue to next endpoint
      }
    }
    
    // Try one more time with a simplified request format that might be more compatible
    try {
      const simplifiedRequest = {
        prompt: {
          text: `Summarize this news article: ${title} - ${articleText.substring(0, 1000)}`
        },
        temperature: 0.2,
        maxOutputTokens: 800
      };
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        simplifiedRequest
      );
      
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const summary = response.data.candidates[0].content.parts[0].text;
        return res.json({ summary });
      }
    } catch (simpleError) {
      console.error('Error with simplified Gemini API format:', simpleError);
    }
    
    // If everything failed, use the fallback
    console.log('No valid summary received from Gemini API, using fallback');
    const fallbackSummary = `## Summary of "${title}"

${description || (content ? content.substring(0, 150) : '')}...

Key points:
* This article discusses ${title}
* The content covers important information about the topic
* For more details, read the full article`;

    return res.json({ 
      summary: fallbackSummary,
      error: 'Gemini API response did not contain expected content format',
      fallback: true 
    });
  } catch (error) {
    console.error('Error generating article summary:', error);
    
    // Create a basic summary based on available content as fallback
    const title = req.body.title || '';
    const description = req.body.description || '';
    
    const fallbackSummary = `## Summary of "${title}"

${description || 'No description available.'}

Key points:
* This article discusses ${title}
* For more details, read the full article`;

    // Still return a 200 with the fallback summary
    return res.json({ 
      summary: fallbackSummary,
      error: 'Failed to generate an AI summary: ' + (error instanceof Error ? error.message : 'Unknown error'),
      fallback: true 
    });
  }
}

export async function generateNewsForInterests(req: Request, res: Response) {
  const { interests, timestamp, page = 1 } = req.body;
  const apiKey = req.user?.geminiApiKey || DEFAULT_GEMINI_API_KEY;
  const newsApiKey = req.user?.newsApiKey || process.env.NEWS_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ 
      message: 'Gemini API key is required. Please add it in your profile settings.'
    });
  }

  if (!newsApiKey) {
    return res.status(400).json({ 
      message: 'News API key is required.'
    });
  }

  if (!interests || !interests.length) {
    return res.status(400).json({ message: 'Interests are required' });
  }

  console.log('Generating news for interests:', interests, 'Timestamp:', timestamp, 'Page:', page);

  // Default to using the interest as the query
  let query: string = interests[0];
  let newsResponse;

  // First try to get custom queries from Gemini
  try {
    // Build a prompt that encourages variety based on timestamp and page
    const prompt = `I'm interested in the following topics: ${interests.join(', ')}.
                  Please generate 3 diverse, specific, well-formed search queries that would help find the latest news articles about these topics.
                  ${timestamp ? `Make these queries optimized for freshness (timestamp: ${timestamp}).` : ''}
                  ${page > 1 ? `These should be different from previous queries (page: ${page}).` : ''}
                  Return only the search queries, each on a new line, without any other text, numbering or explanation.`;
    
    // Try all available API endpoints
    let searchQueries: string[] = [];
    for (let i = 0; i < GEMINI_API_URLS.length; i++) {
      try {
        console.log(`Trying Gemini API endpoint ${i+1}/${GEMINI_API_URLS.length} for interests:`, GEMINI_API_URLS[i]);
        
        const response = await axios.post(
          `${GEMINI_API_URLS[i]}?key=${apiKey}`,
          {
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 256,
              topP: 0.9,
              topK: 40
            }
          },
          {
            timeout: 10000 // 10 seconds timeout
          }
        );

        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          searchQueries = response.data.candidates[0].content.parts[0].text
            .split('\n')
            .filter((q: string) => q.trim().length > 0)
            .slice(0, 3);

          console.log('Generated search queries:', searchQueries);
          
          if (searchQueries.length > 0) {
            break; // Success, exit the loop
          }
        }
      } catch (apiError) {
        console.error(`Error with Gemini API endpoint ${i+1} for interests:`, apiError);
        // Continue to next endpoint
      }
    }
    
    // If we got search queries, use them
    if (searchQueries.length > 0) {
      // Use a different query based on the page number
      const queryIndex = Math.min((page - 1) % searchQueries.length, searchQueries.length - 1);
      query = searchQueries[queryIndex];
      console.log('Selected query:', query, 'for page:', page);
    } else {
      // Add timestamp to the query for variety based on page number
      query = `${interests[0]} ${timestamp ? new Date(timestamp).getMonth() + 1 : ''} ${page}`;
      console.log('Using default query with timestamp:', query);
    }

    // Now fetch news with either the generated query or the default
    newsResponse = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: query,
        apiKey: newsApiKey,
        pageSize: 10,
        language: 'en',
        sortBy: 'publishedAt',
        page: page
      }
    });

    // Process and return the result
    const interestsStr = interests.join(', ');
    const articlesWithCategory = newsResponse.data.articles.map((article: NewsArticle) => ({
      ...article,
      category: interestsStr,
      publishedAt: article.publishedAt || new Date().toISOString()
    }));

    return res.json({
      ...newsResponse.data,
      articles: articlesWithCategory,
      searchQuery: query
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Final fallback attempt
    try {
      const finalQuery = interests[0];
      console.log('Using final fallback with direct search for:', finalQuery);
      
      const fallbackResponse = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: finalQuery,
          apiKey: newsApiKey,
          pageSize: 10,
          language: 'en',
          sortBy: 'relevancy'
        }
      });
      
      const interestsStr = interests.join(', ');
      const articlesWithCategory = fallbackResponse.data.articles.map((article: NewsArticle) => ({
        ...article,
        category: interestsStr,
        publishedAt: article.publishedAt || new Date().toISOString()
      }));
      
      return res.json({
        ...fallbackResponse.data,
        articles: articlesWithCategory,
        searchQuery: finalQuery,
        fallback: true
      });
    } catch (fallbackError) {
      console.error('Final fallback error:', fallbackError);
      return res.status(500).json({ message: 'Failed to generate news for interests' });
    }
  }
}
