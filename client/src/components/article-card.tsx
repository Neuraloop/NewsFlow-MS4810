import { NewsArticle } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: NewsArticle;
  layout?: "horizontal" | "vertical";
  onClick: () => void;
}

export function ArticleCard({ article, layout = "vertical", onClick }: ArticleCardProps) {
  const {
    title,
    description,
    source,
    publishedAt,
    urlToImage,
    category
  } = article;

  // Format the published date
  const formattedDate = publishedAt
    ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
    : undefined;

  // Determine category badge color based on the category
  const getBadgeColor = (category?: string) => {
    if (!category) return "bg-accent/10 text-accent-dark";
    
    switch (category.toLowerCase()) {
      case 'technology':
        return "bg-primary/10 text-primary";
      case 'sports':
        return "bg-green-500/10 text-green-600";
      case 'business':
        return "bg-secondary/10 text-secondary";
      case 'health':
        return "bg-emerald-500/10 text-emerald-600";
      case 'science':
        return "bg-purple-500/10 text-purple-600";
      case 'entertainment':
        return "bg-pink-500/10 text-pink-600";
      default:
        return "bg-accent/10 text-accent-dark";
    }
  };

  if (layout === "horizontal") {
    return (
      <Card 
        className="relative flex flex-col md:flex-row gap-4 hover:shadow-md transition-shadow cursor-pointer" 
        onClick={onClick}
      >
        <div className="w-full md:w-2/5 h-48 md:h-auto bg-neutral-200 rounded-t-lg md:rounded-l-lg md:rounded-tr-none overflow-hidden dark:bg-neutral-800">
          {urlToImage ? (
            <img 
              src={urlToImage} 
              alt={title} 
              className="object-cover w-full h-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x360?text=No+Image';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
              <span className="text-neutral-400 dark:text-neutral-500">No Image</span>
            </div>
          )}
        </div>
        <div className="w-full md:w-3/5 flex flex-col p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`${getBadgeColor(category)}`}>
              {category || "General"}
            </Badge>
            {formattedDate && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{formattedDate}</span>
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2 text-neutral-800 dark:text-white">{title}</h3>
          <p className="text-neutral-600 line-clamp-3 mb-3 dark:text-neutral-300">{description}</p>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">{source.name}</span>
            <span className="text-primary hover:text-primary-dark text-sm font-medium">Read More</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="h-48 bg-neutral-200 rounded-t-lg overflow-hidden dark:bg-neutral-800">
        {urlToImage ? (
          <img 
            src={urlToImage} 
            alt={title} 
            className="object-cover w-full h-full" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x360?text=No+Image';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-800">
            <span className="text-neutral-400 dark:text-neutral-500">No Image</span>
          </div>
        )}
      </div>
      <CardContent className="p-4 flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={`${getBadgeColor(category)}`}>
            {category || "General"}
          </Badge>
          {formattedDate && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{formattedDate}</span>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-neutral-800 dark:text-white">
          {title}
        </h3>
        <p className="text-neutral-600 text-sm line-clamp-3 mb-3 dark:text-neutral-300">
          {description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{source.name}</span>
          <span className="text-primary hover:text-primary-dark text-sm font-medium">Read More</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ArticleCard;
