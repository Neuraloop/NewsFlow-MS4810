import { Interest } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle } from "lucide-react";

interface InterestChipProps {
  interest: Interest | { name: string };
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
}

export function InterestChip({ interest, onRemove, onClick, active = false }: InterestChipProps) {
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  const getChipColor = () => {
    if (active) return "bg-primary text-white";
    return "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100";
  };

  return (
    <Badge 
      variant="outline" 
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getChipColor()} cursor-pointer`}
      onClick={handleClick}
    >
      {interest.name}
      {onRemove && (
        <button onClick={handleRemove} className="ml-1 p-0.5">
          <MinusCircle className="h-4 w-4" />
        </button>
      )}
    </Badge>
  );
}

export function AddInterestChip({ onClick }: { onClick: () => void }) {
  return (
    <Badge 
      variant="outline" 
      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 cursor-pointer"
      onClick={onClick}
    >
      <PlusCircle className="h-4 w-4 mr-1" />
      Add Interest
    </Badge>
  );
}

export default InterestChip;
