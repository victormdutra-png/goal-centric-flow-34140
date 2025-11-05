import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { GoalCard } from '@/components/GoalCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Flame, Trophy, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import focusCoin from '@/assets/focus-coin.png';

export default function Goals() {
  const { 
    goals, 
    currentUserId, 
    updateGoalProgress, 
    dailyQuests,
    weeklyQuests,
    monthlyQuests,
    followerQuests,
    uniqueQuests,
    completeDailyQuest,
    completeWeeklyQuest,
    completeMonthlyQuest,
    claimFollowerQuest,
    claimUniqueQuest,
    checkDailyLogin,
    posts,
    userPoints,
    followers,
  } = useAppStore();
  
  const userGoals = goals.filter((g) => g.userId === currentUserId);
  const currentUserPoints = userPoints.get(currentUserId);

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    checkDailyLogin();
  }, [checkDailyLogin]);

  const handleUpdateProgress = (goalId: string) => {
    setSelectedGoal(goalId);
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setNewValue(goal.currentValue.toString());
    }
  };

  const handleSaveProgress = () => {
    if (!selectedGoal) return;

    const goal = goals.find((g) => g.id === selectedGoal);
    if (!goal) return;

    const value = parseFloat(newValue);
    if (isNaN(value) || value < 0 || value > goal.targetValue) {
      toast.error('Valor inválido');
      return;
    }

    updateGoalProgress(selectedGoal, value);
    toast.success('Progresso atualizado!');
    setSelectedGoal(null);
  };

  const handleCompleteDailyQuest = (questId: string) => {
    const userPosts = posts.filter((p) => p.userId === currentUserId);
    const hasPostWithEnoughLikes = userPosts.some((p) => p.likes >= 2);

    if (questId === 'daily-engagement' && !hasPostWithEnoughLikes) {
      toast.error('Você precisa postar algo e receber 2 likes primeiro!');
      return;
    }

    completeDailyQuest(questId);
    toast.success('Quest diária concluída! FOCUS recebidos! 🎉');
  };

  const handleClaimFollowerQuest = (questId: string) => {
    claimFollowerQuest(questId);
    toast.success('Recompensa resgatada! 🎉');
  };

  const handleClaimUniqueQuest = (questId: string) => {
    claimUniqueQuest(questId);
    toast.success('Recompensa resgatada! 🎉');
  };

  const currentFollowers = followers.get(currentUserId)?.length || 0;

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-[420px] mx-auto">
          <Header />

          {/* Points Display */}
          <div className="px-4 py-4 bg-card border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seu FOCUS</p>
                <div className="flex items-center gap-2">
                  <img src={focusCoin} alt="FOCUS" className="w-8 h-8" />
                  <p className="text-2xl font-bold text-primary">
                    {currentUserPoints?.totalPoints || 0}
                  </p>
                </div>
              </div>
              <Trophy className="w-8 h-8 text-secondary" />
            </div>
          </div>

          {/* Daily Quests */}
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-bold text-foreground">Metas Diárias</h2>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Check-in Diário</p>
                  <div className="flex items-center gap-1 mt-1">
                    <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                    <p className="text-xs text-secondary">+1 FOCUS</p>
                  </div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-secondary" />
              </div>
            </Card>

            {dailyQuests.filter(q => q.id !== 'daily-checkin').map((quest) => (
              <Card key={quest.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{quest.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {quest.id === 'daily-engagement' 
                        ? 'Comentar em 2 publicações diferentes e receber 2 curtidas em suas publicações'
                        : quest.description}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                      <p className="text-xs text-secondary">+{quest.reward} FOCUS</p>
                    </div>
                  </div>
                  {quest.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteDailyQuest(quest.id)}
                    >
                      Resgatar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Follower Quests */}
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Metas de Seguidores</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Você tem {currentFollowers} seguidor{currentFollowers !== 1 ? 'es' : ''}
            </p>

            {(() => {
              // Find the next unclaimed quest
              const nextQuest = followerQuests.find(q => !q.claimed);
              if (!nextQuest) return null;

              return (
                <Card className="p-4 space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {nextQuest.targetFollowers} Seguidores
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                          <p className="text-xs text-secondary">+{nextQuest.reward} FOCUS</p>
                        </div>
                      </div>
                      {nextQuest.completed ? (
                        <Button
                          size="sm"
                          onClick={() => handleClaimFollowerQuest(nextQuest.id)}
                        >
                          Resgatar
                        </Button>
                      ) : null}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium text-card-foreground">
                          {currentFollowers} / {nextQuest.targetFollowers}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (currentFollowers / nextQuest.targetFollowers) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}
          </div>

          {/* Weekly Quests */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Metas Semanais</h2>
            {weeklyQuests.map((quest) => (
              <Card key={quest.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{quest.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Progresso: {quest.progress}/{quest.target}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                      <p className="text-xs text-secondary">+{quest.reward} FOCUS</p>
                    </div>
                  </div>
                  {quest.completed && !quest.claimed ? (
                    <Button size="sm" onClick={() => completeWeeklyQuest(quest.id)}>
                      Resgatar
                    </Button>
                  ) : quest.claimed ? (
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          {/* Monthly Quests */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Metas Mensais</h2>
            {monthlyQuests.map((quest) => (
              <Card key={quest.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{quest.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vídeos: {quest.progress.videos}/{quest.target.videos} | Fotos: {quest.progress.photos}/{quest.target.photos}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                      <p className="text-xs text-secondary">+{quest.reward} FOCUS</p>
                    </div>
                  </div>
                  {quest.completed && !quest.claimed ? (
                    <Button size="sm" onClick={() => completeMonthlyQuest(quest.id)}>
                      Resgatar
                    </Button>
                  ) : quest.claimed ? (
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          {/* Unique Quests */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Quests Únicas</h2>

            {uniqueQuests.map((quest) => (
              <Card key={quest.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{quest.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                      <p className="text-xs text-secondary">+{quest.reward} FOCUS</p>
                    </div>
                  </div>
                  {quest.claimed ? (
                    <CheckCircle2 className="w-6 h-6 text-secondary" />
                  ) : quest.completed ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaimUniqueQuest(quest.id)}
                    >
                      Resgatar
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Update Progress Dialog */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Atualizar Progresso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progress">Novo valor</Label>
              <Input
                id="progress"
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {goals.find((g) => g.id === selectedGoal)?.targetValue || 0}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGoal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProgress}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
