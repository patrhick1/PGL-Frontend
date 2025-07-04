import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  progress: number;
  phase: string;
  keywordsFound?: number;
}

export function ProgressIndicator({ progress, phase, keywordsFound = 0 }: ProgressIndicatorProps) {
  const phases = [
    { key: 'introduction', label: 'Introduction', threshold: 0 },
    { key: 'deep_discovery', label: 'Deep Discovery', threshold: 25 },
    { key: 'media_optimization', label: 'Media Optimization', threshold: 50 },
    { key: 'synthesis', label: 'Synthesis', threshold: 75 },
  ];
  
  const currentPhaseIndex = phases.findIndex(p => p.key === phase);
  
  return (
    <div className="px-4 py-3 border-b bg-muted/30">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Profile Setup Progress</h3>
        <div className="flex items-center gap-3 text-sm">
          {keywordsFound > 0 && (
            <span className="text-primary font-medium">
              {keywordsFound} keywords found
            </span>
          )}
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>
      
      <Progress value={progress} className="h-2 mb-3" />
      
      <div className="flex justify-between text-xs">
        {phases.map((p, index) => (
          <span
            key={p.key}
            className={cn(
              "transition-colors",
              index <= currentPhaseIndex
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}