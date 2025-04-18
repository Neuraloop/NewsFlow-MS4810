import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NewsArticle } from "@shared/schema";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, Zap, Loader2 } from "lucide-react";

interface ArticleDialogProps {
  article: NewsArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleDialog({ article, open, onOpenChange }: ArticleDialogProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (open && article) {
      setSummary(null);
      setSummaryError(null);
      setLoadingSummary(true);

      // Request summary from the server with timestamp to avoid caching
      apiRequest("POST", "/api/ai/summarize-article", {
        title: article.title,
        content: article.content,
        description: article.description,
        url: article.url,
        timestamp: Date.now() // Add timestamp to prevent caching
      })
        .then(res => res.json())
        .then(data => {
          setSummary(data.summary);
          if (data.error) {
            setSummaryError(data.error);
          }
        })
        .catch(err => {
          setSummaryError("Sorry, could not generate a summary for this article.");
          console.error("Error generating summary:", err);
        })
        .finally(() => {
          setLoadingSummary(false);
        });
    }
  }, [open, article]);

  if (!article) {
    return null;
  }

  // Format the published date
  const formattedDate = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            {article.category && (
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {article.category}
              </Badge>
            )}
            {formattedDate && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{formattedDate}</span>
            )}
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{article.source.name}</span>
          </div>
          <DialogTitle className="text-2xl font-semibold mb-4 text-neutral-800 dark:text-white">
            {article.title}
          </DialogTitle>
        </DialogHeader>
        
        {article.urlToImage && (
          <div className="w-full h-64 bg-neutral-200 rounded-lg overflow-hidden mb-5 dark:bg-neutral-700">
            <img 
              src={article.urlToImage} 
              alt={article.title} 
              className="object-cover w-full h-full" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=No+Image';
              }}
            />
          </div>
        )}
        
        <div className="prose max-w-none mb-6 text-neutral-700 dark:text-neutral-300">
          <p>{article.description}</p>
          {article.content && <p>{article.content.replace(/\[\+\d+ chars\]$/, '')}</p>}
        </div>

        {/* AI Summary Section */}
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold flex items-center text-neutral-800 dark:text-white">
              <Zap className="h-5 w-5 mr-2 text-primary" />
              AI-Generated Summary
            </h3>
            {summaryError && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSummary(null);
                  setSummaryError(null);
                  setLoadingSummary(true);
                  
                  apiRequest("POST", "/api/ai/summarize-article", {
                    title: article.title,
                    content: article.content,
                    description: article.description,
                    url: article.url,
                    timestamp: Date.now() // Add timestamp to avoid caching
                  })
                    .then(res => res.json())
                    .then(data => {
                      setSummary(data.summary);
                      if (data.error) {
                        setSummaryError(data.error);
                      }
                    })
                    .catch(err => {
                      setSummaryError("Sorry, could not generate a summary for this article.");
                      console.error("Error generating summary:", err);
                    })
                    .finally(() => {
                      setLoadingSummary(false);
                    });
                }}
                className="text-xs"
              >
                Retry
              </Button>
            )}
          </div>
          <div className="text-neutral-700 dark:text-neutral-300">
            {loadingSummary ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Generating summary...</span>
              </div>
            ) : summaryError ? (
              <div className="text-red-500">
                <p className="mb-2">{summaryError}</p>
                {summaryError.includes('API key') && (
                  <p className="text-sm">
                    Please add your API keys in the profile page to enable AI-powered summaries.
                  </p>
                )}
              </div>
            ) : summary ? (
              <div className="prose dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-li:my-1 max-w-none"
                   dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br>').replace(/\*\s/g, '• ').replace(/\#\#/g, '<h3>').replace(/\#/g, '<h2>') }} />
            ) : (
              <p>No summary available.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Save Article
            </span>
          </Button>
          <Button asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              Read Original Article
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ArticleDialog;
