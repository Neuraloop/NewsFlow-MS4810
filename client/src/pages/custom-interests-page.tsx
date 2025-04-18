import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import ArticleCard from "@/components/article-card";
import ArticleDialog from "@/components/article-dialog";
import { NewsArticle, NewsApiResponse, Interest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Plus, AlertCircle } from "lucide-react";
import InterestChip, { AddInterestChip } from "@/components/interest-chip";
import AddInterestDialog from "@/components/add-interest-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeProvider } from "@/hooks/use-theme";

export default function CustomInterestsPage() {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addInterestDialogOpen, setAddInterestDialogOpen] = useState(false);
  const [activeInterest, setActiveInterest] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const { toast } = useToast();

  // Fetch user interests
  const { 
    data: interests, 
    isLoading: loadingInterests,
    isError: interestsError
  } = useQuery<Interest[]>({
    queryKey: ["/api/interests"],
  });

  // Use state to track timestamp to force refresh
  const [timestamp, setTimestamp] = useState(Date.now());
  
  // Generate custom news based on active interest
  const { 
    data: customNews, 
    isLoading: loadingCustomNews,
    refetch: refetchCustomNews,
    isRefetching: isRefetchingCustomNews,
    isError: customNewsError,
    error: customNewsErrorDetails
  } = useQuery<NewsApiResponse>({
    queryKey: ["/api/ai/generate-news-for-interests", activeInterest, page, timestamp],
    queryFn: async ({ queryKey }) => {
      if (!activeInterest) {
        return { status: "ok", totalResults: 0, articles: [] };
      }
      
      console.log('Fetching custom news for interest:', activeInterest, 'page:', page, 'timestamp:', timestamp);
      
      try {
        const res = await apiRequest("POST", "/api/ai/generate-news-for-interests", {
          interests: [activeInterest],
          timestamp: timestamp, // Use state-controlled timestamp
          page: page
        });
        
        const data = await res.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching custom news:', error);
        throw error;
      }
    },
    enabled: !!activeInterest,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1
  });

  // Delete interest mutation
  const deleteInterestMutation = useMutation({
    mutationFn: async (interestId: number) => {
      await apiRequest("DELETE", `/api/interests/${interestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
      toast({
        title: "Interest removed",
        description: "The interest has been removed from your list.",
      });
      
      // Reset active interest if it was deleted
      if (interests && 
          activeInterest && 
          !interests.some(interest => interest.name === activeInterest)) {
        setActiveInterest(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove interest",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // When the interest changes, reset the page and articles
  useEffect(() => {
    setPage(1);
    setAllArticles([]);
    if (activeInterest) {
      setTimestamp(Date.now()); // Update timestamp when interest changes
    }
  }, [activeInterest]);

  // When the page changes or custom news is loaded, update allArticles
  useEffect(() => {
    if (customNews?.articles && page === 1) {
      setAllArticles(customNews.articles);
    } else if (customNews?.articles && page > 1) {
      // Filter out duplicate articles by URL
      const newArticles = customNews.articles.filter(
        article => !allArticles.some(existing => 
          existing.url === article.url || 
          existing.title === article.title
        )
      );
      
      console.log(`Found ${newArticles.length} new articles out of ${customNews.articles.length} total`);
      
      if (newArticles.length > 0) {
        setAllArticles(prev => [...prev, ...newArticles]);
      }
    }
  }, [customNews, page]);

  // Set the active interest to the first one if none is selected and interests are loaded
  useEffect(() => {
    if (interests && interests.length > 0 && !activeInterest) {
      setActiveInterest(interests[0].name);
    }
  }, [interests, activeInterest]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setDialogOpen(true);
  };

  const handleInterestClick = (interest: Interest) => {
    setActiveInterest(interest.name);
  };

  const handleRemoveInterest = (interest: Interest) => {
    if (confirm(`Are you sure you want to remove "${interest.name}" from your interests?`)) {
      deleteInterestMutation.mutate(interest.id);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleRefreshNews = () => {
    setPage(1);
    setAllArticles([]); // Clear existing articles
    setTimestamp(Date.now()); // Update timestamp to force new queries
  };

  return (
    <ThemeProvider>
      <div className="bg-neutral-50 text-neutral-800 min-h-screen flex flex-col dark:bg-neutral-800 dark:text-neutral-100">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          {/* Interest Chips */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">Your Custom Interests</h2>
              <Button 
                variant="outline" 
                className="text-sm font-medium flex items-center gap-1"
                onClick={() => setAddInterestDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Interest
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {loadingInterests ? (
                <div className="p-2">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              ) : interestsError ? (
                <div className="text-red-500 dark:text-red-400 text-sm">
                  Error loading interests. Please try again.
                </div>
              ) : interests && interests.length > 0 ? (
                interests.map(interest => (
                  <InterestChip 
                    key={interest.id} 
                    interest={interest} 
                    active={activeInterest === interest.name}
                    onClick={() => handleInterestClick(interest)}
                    onRemove={() => handleRemoveInterest(interest)}
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

          {/* Custom News for Selected Interest */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-neutral-800 dark:text-white">
                {activeInterest ? `${activeInterest} News` : "Custom News"}
              </h2>
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={handleRefreshNews}
                disabled={isRefetchingCustomNews || !activeInterest}
              >
                {isRefetchingCustomNews ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh News
                  </>
                )}
              </Button>
            </div>

            {customNewsError && !loadingCustomNews && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load custom news: {customNewsErrorDetails?.message || "Please try again later"}
                </AlertDescription>
              </Alert>
            )}

            {!activeInterest && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Interest Selected</AlertTitle>
                <AlertDescription>
                  Please select or add a custom interest to see relevant news articles.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingCustomNews && page === 1 ? (
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
              ) : activeInterest ? (
                <div className="col-span-3 text-center py-12 text-neutral-500 dark:text-neutral-400">
                  No news articles found. Try adjusting your interests or check back later.
                </div>
              ) : null}
            </div>

            {allArticles && allArticles.length > 0 && activeInterest && (
              <div className="mt-8 flex justify-center">
                <Button 
                  onClick={handleLoadMore}
                  disabled={loadingCustomNews && page > 1}
                >
                  {loadingCustomNews && page > 1 ? (
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
