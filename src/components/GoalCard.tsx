import { Goal } from '@/lib/types';
import { Button } from './ui/button';
import { Target } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onUpdateProgress?: () => void;
}

export function GoalCard({ goal, onUpdateProgress }: GoalCardProps) {
  const progressPct = Math.round((goal.currentValue / goal.targetValue) * 100);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-card-foreground truncate">{goal.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{goal.description}</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {goal.theme}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-card-foreground">{progressPct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {goal.currentValue} / {goal.targetValue}
        </p>
      </div>

      {/* Actions */}
      {onUpdateProgress && (
        <Button variant="outline" size="sm" onClick={onUpdateProgress} className="w-full">
          Atualizar Progresso
        </Button>
      )}
    </div>
  );
}
