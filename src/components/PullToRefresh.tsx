import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  threshold,
  isRefreshing,
  isPulling,
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const shouldShow = isPulling || isRefreshing;

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50',
        shouldShow ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        transform: `translateY(${isRefreshing ? threshold : pullDistance}px)`,
        height: `${threshold}px`,
      }}
    >
      <div className="flex flex-col items-center gap-2 py-4">
        {isRefreshing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Atualizando...</p>
          </>
        ) : (
          <>
            <div
              className="relative w-8 h-8 rounded-full border-2 border-muted"
              style={{
                borderTopColor: progress >= 100 ? 'hsl(var(--primary))' : 'transparent',
                transform: `rotate(${progress * 3.6}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
            />
            <p className="text-xs text-muted-foreground">
              {progress >= 100 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
