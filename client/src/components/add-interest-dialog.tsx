import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUGGESTED_TOPICS = [
  "Web Development",
  "Machine Learning",
  "Cybersecurity",
  "Cloud Computing",
  "DevOps",
  "Blockchain",
  "Space Exploration",
  "Green Energy",
  "Biotechnology",
  "Quantum Computing"
];

export function AddInterestDialog({ open, onOpenChange }: AddInterestDialogProps) {
  const [interest, setInterest] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interest.trim()) {
      toast({
        title: "Please enter an interest",
        description: "Interest name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/interests", { name: interest.trim() });
      
      toast({
        title: "Interest added",
        description: `"${interest}" has been added to your interests.`,
      });
      
      // Invalidate the interests query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/interests"] });
      
      // Close the dialog and reset form
      onOpenChange(false);
      setInterest('');
    } catch (error) {
      toast({
        title: "Failed to add interest",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle suggested topic click
  const handleTopicClick = (topic: string) => {
    setInterest(topic);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-2">Add Custom Interest</DialogTitle>
          <DialogDescription>
            Add a new topic that you're interested in to customize your news feed. NewsFlow will use AI to find relevant articles for you.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="interest-name">Interest Topic</Label>
            <Input
              id="interest-name"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g., Quantum Computing, Space Exploration, Renewable Energy"
              className="mt-1"
            />
          </div>
          
          <div className="mb-5">
            <div className="flex items-center mb-2">
              <Label>Suggested Topics</Label>
              <div className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">(Click to add)</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_TOPICS.map(topic => (
                <Button
                  key={topic}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => handleTopicClick(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Interest"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddInterestDialog;
