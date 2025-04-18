import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff } from 'lucide-react';

interface ApiKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeysDialog({ open, onOpenChange }: ApiKeysDialogProps) {
  const { user, updateApiKeysMutation } = useAuth();
  const [newsApiKey, setNewsApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showNewsApiKey, setShowNewsApiKey] = useState(false);
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);

  // Initialize form values from user data
  useEffect(() => {
    if (user) {
      setNewsApiKey(user.newsApiKey || '');
      setGeminiApiKey(user.geminiApiKey || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateApiKeysMutation.mutate({ 
      newsApiKey: newsApiKey || undefined,
      geminiApiKey: geminiApiKey || undefined 
    });
    
    // Close the dialog on success
    if (!updateApiKeysMutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-2">API Key Settings</DialogTitle>
          <DialogDescription>
            Configure your API keys to enable all features of NewsFlow. We never share your API keys with third parties.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="news-api-key">NewsAPI Key</Label>
            <div className="relative mt-1">
              <Input
                id="news-api-key"
                type={showNewsApiKey ? "text" : "password"}
                value={newsApiKey}
                onChange={(e) => setNewsApiKey(e.target.value)}
                placeholder="Enter your NewsAPI key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowNewsApiKey(!showNewsApiKey)}
              >
                {showNewsApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <a 
              href="https://newsapi.org/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary mt-1 inline-block dark:text-primary-light"
            >
              Get a free API key from NewsAPI.org
            </a>
          </div>
          
          <div className="mb-5">
            <Label htmlFor="gemini-api-key">Google Gemini API Key</Label>
            <div className="relative mt-1">
              <Input
                id="gemini-api-key"
                type={showGeminiApiKey ? "text" : "password"}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowGeminiApiKey(!showGeminiApiKey)}
              >
                {showGeminiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary mt-1 inline-block dark:text-primary-light"
            >
              Get a Gemini API key from Google AI
            </a>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateApiKeysMutation.isPending}
            >
              {updateApiKeysMutation.isPending ? "Saving..." : "Save API Keys"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeysDialog;
