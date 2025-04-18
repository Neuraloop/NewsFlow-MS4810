import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import ArticleCard from "@/components/article-card";
import ArticleDialog from "@/components/article-dialog";
import { NewsArticle, NewsApiResponse, Interest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import InterestChip, { AddInterestChip } from "@/components/interest-chip";
import AddInterestDialog from "@/components/add-interest-dialog";
import { ThemeProvider } from "@/hooks/use-theme";

export default function HomePage() {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addInterestDialogOpen, setAddInterestDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);

  // Fetch user interests
  const { data: interests, isLoading: loadingInterests } = useQuery<Interest[]>({
    queryKey: ["/api/interests"],
  });

  // State to refresh the featured news queries
  const [featuredTimestamp, setFeaturedTimestamp] = useState(Date.now());
  
  // State to refresh the latest news queries  
  const [latestTimestamp, setLatestTimestamp] = useState(Date.now());

  // Fetch featured news with timestamp to prevent caching
  const { 
    data: featuredNews, 
    isLoading: loadingFeatured, 
    refetch: refetchFeatured,
    isRefetching: isRefetchingFeatured
  } = useQuery<NewsApiResponse>({
    queryKey: ["/api/news/top-headlines", "general", 1, featuredTimestamp],
    staleTime: 60000, // 1 minute
  });

  // Fetch latest news with pagination and timestamp
  const { 
    data: latestNews, 
    isLoading: loadingLatest, 
    refetch: refetchLatest,
    isRefetching: isRefetchingLatest
  } = useQuery<NewsApiResponse>({
    queryKey: ["/api/news/top-headlines", undefined, page, latestTimestamp],
    staleTime: 60000, // 1 minute
  });

  // When the page changes, update the allArticles state
  useEffect(() => {
    if (latestNews?.articles && page === 1) {
      setAllArticles(latestNews.articles);
    } else if (latestNews?.articles && page > 1) {
      setAllArticles(prev => [...prev, ...latestNews.articles]);
    }
  }, [latestNews, page]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRefreshFeatured = () => {
    // Update timestamp to force a fresh fetch
    setFeaturedTimestamp(Date.now());
  };

  const handleRefreshLatest = () => {
    setPage(1);
    setAllArticles([]); // Clear existing articles
    // Update timestamp to force a fresh fetch
    setLatestTimestamp(Date.now());
  };

  return (
    <ThemeProvider>
      <div className="bg-neutral-50 text-neutral-800 min-h-screen flex flex-col dark:bg-neutral-800 dark:text-neutral-100">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Interest Chips */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">Your Interests</h2>
              <Button 
                variant="link" 
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={() => setAddInterestDialogOpen(true)}
              >
                Manage Interests
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {loadingInterests ? (
                <div className="p-2">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              ) : interests && interests.length > 0 ? (
                interests.map(interest => (
                  <InterestChip 
                    key={interest.id} 
                    interest={interest} 
                    active={true}
                  />
                ))
              ) : (
                <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                  No interests added yet. Add some to personalize your news feed.
                </div>
              )}
              <AddInterestChip onClick={() => setAddInterestDialogOpen(true)} />
            </div>
          </div>

          {/* Featured News */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">Featured News</h2>
              <Button 
                variant="link" 
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={handleRefreshFeatured}
                disabled={isRefetchingFeatured}
              >
                {isRefetchingFeatured ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {loadingFeatured ? (
                <div className="col-span-2 flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
              ) : featuredNews?.articles && featuredNews.articles.length > 0 ? (
                featuredNews.articles.slice(0, 2).map((article, index) => (
                  <ArticleCard 
                    key={index} 
                    article={article} 
                    layout="horizontal" 
                    onClick={() => handleArticleClick(article)}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-neutral-500 dark:text-neutral-400">
                  No featured news found. Try refreshing.
                </div>
              )}
            </div>
          </section>

          {/* Latest News */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">Latest News</h2>
              <div className="flex items-center gap-3">
                <Button 
                  variant="link" 
                  className="text-sm font-medium text-primary hover:text-primary-dark"
                  onClick={handleRefreshLatest}
                  disabled={isRefetchingLatest}
                >
                  {isRefetchingLatest ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Refreshing
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingLatest && page === 1 ? (
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
                  No news articles found. Try refreshing or check back later.
                </div>
              )}
            </div>

            {allArticles && allArticles.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button 
                  id="load-more" 
                  onClick={handleLoadMore}
                  disabled={loadingLatest && page > 1}
                >
                  {loadingLatest && page > 1 ? (
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

        {/* Add Interest Dialog */}
        <AddInterestDialog 
          open={addInterestDialogOpen} 
          onOpenChange={setAddInterestDialogOpen} 
        />
      </div>
    </ThemeProvider>
  );
}
