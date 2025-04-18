import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Header from "@/components/header";
import ArticleCard from "@/components/article-card";
import ArticleDialog from "@/components/article-dialog";
import { NewsArticle, NewsApiResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { ThemeProvider } from "@/hooks/use-theme";

export default function CategoryPage() {
  const [, params] = useRoute<{ category: string }>("/category/:category");
  const category = params?.category || "general";
  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);

  // Fetch news for this category with pagination
  const { 
    data: categoryNews, 
    isLoading: loading, 
    refetch,
    isRefetching
  } = useQuery<NewsApiResponse>({
    queryKey: ["/api/news/top-headlines", category, page],
  });

  // When the page or category changes, update the allArticles state
  useEffect(() => {
    if (categoryNews?.articles && page === 1) {
      setAllArticles(categoryNews.articles);
    } else if (categoryNews?.articles && page > 1) {
      setAllArticles(prev => [...prev, ...categoryNews.articles]);
    }
  }, [categoryNews, page]);

  // Reset page and articles when category changes
  useEffect(() => {
    setPage(1);
    setAllArticles([]);
  }, [category]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRefresh = () => {
    setPage(1);
    refetch();
  };

  return (
    <ThemeProvider>
      <div className="bg-neutral-50 text-neutral-800 min-h-screen flex flex-col dark:bg-neutral-800 dark:text-neutral-100">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-neutral-800 dark:text-white">{categoryTitle} News</h2>
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={handleRefresh}
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading && page === 1 ? (
                <div className="col-span-3 flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
              ) : allArticles && allArticles.length > 0 ? (
                allArticles.map((article, index) => (
                  <ArticleCard 
                    key={index} 
                    article={article} 
                    onClick={() => handleArticleClick(article)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-neutral-500 dark:text-neutral-400">
                  No {categoryTitle.toLowerCase()} news found. Try refreshing or check back later.
                </div>
              )}
            </div>

            {allArticles && allArticles.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button 
                  onClick={handleLoadMore}
                  disabled={loading && page > 1}
                >
                  {loading && page > 1 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More News"
                  )}
                </Button>
              </div>
            )}
          </section>
        </main>

        {/* Article Dialog for expanded view */}
        <ArticleDialog 
          article={selectedArticle} 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
        />
      </div>
    </ThemeProvider>
  );
}
