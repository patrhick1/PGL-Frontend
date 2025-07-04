import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ replies, onSelect, disabled }: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;
  
  return (
    <div className="px-4 py-3 bg-muted/50 border-t">
      <p className="text-xs text-muted-foreground mb-2">Quick replies:</p>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelect(reply)}
            disabled={disabled}
            className={cn(
              "text-sm transition-all",
              "hover:bg-primary hover:text-primary-foreground"
            )}
          >
            {reply}
          </Button>
        ))}
      </div>
    </div>
  );
}