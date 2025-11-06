import { Post, User } from '@/lib/types';
import { Button } from './ui/button';
import { Heart, Flag, EyeOff, MessageCircle, Send, Edit, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import focusCoin from '@/assets/focus-coin.png';
import { QuizSlider } from './QuizSlider';
import { toast } from 'sonner';
import { MentionInput } from './MentionInput';
import { MentionText } from './MentionText';
import { processMentions } from '@/lib/mentions';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  post: Post;
  user: User;
}

function formatTimeAgo(date: Date): string {
  const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (hours < 1) return 'agora';
  if (hours === 1) return 'há 1 hora';
  if (hours < 24) return `há ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

export function PostCard({ post, user }: PostCardProps) {
  const store = useAppStore();
  const { user: authUser } = useAuth();
  const { currentUserId, likePost, unlikePost, donatePoints, blockUser, addComment, editComment, deleteComment, pinComment, unpinComment, reportComment, users, updateUserActivity, submitQuizAnswers, completeDailyQuest, posts, dailyQuests } = store;
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showDonations, setShowDonations] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const isQuizClosed = post.quizClosesAt && new Date() > post.quizClosesAt;
  const userAnswer = post.quizAnswers?.find(a => a.userId === currentUserId);
  const hasUserAnswered = !!userAnswer || hasAnswered;
  const hasLiked = post.likedBy.includes(currentUserId);
  const hasDonated = post.donatedBy.includes(currentUserId);

  const handleQuizAnswer = (questionIndex: number, optionIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const handleSubmitQuizAnswers = () => {
    if (!post.quizQuestions || userAnswers.length !== post.quizQuestions.length) {
      return;
    }
    submitQuizAnswers(post.id, userAnswers);
    setHasAnswered(true);
    updateUserActivity();
  };

  const handleLike = () => {
    if (hasLiked) {
      unlikePost(post.id);
    } else {
      likePost(post.id);
      updateUserActivity();
      checkDailyEngagement();
    }
  };

  const handleAddComment = async () => {
    if (commentText.trim() && authUser?.id) {
      addComment(post.id, commentText);
      
      // Process mentions asynchronously (non-blocking)
      processMentions(commentText, authUser.id, undefined, post.id).catch((error) => {
        console.error('Error processing mentions:', error);
      });
      
      setCommentText('');
      updateUserActivity();
      checkDailyEngagement();
    }
  };

  const checkDailyEngagement = () => {
    // Check if daily engagement quest should be completed
    const engagementQuest = dailyQuests.find(q => q.id === 'daily-engagement');
    if (!engagementQuest || engagementQuest.completed) return;

    // Count unique posts with user comments
    const userComments = new Set<string>();
    posts.forEach(p => {
      p.comments?.forEach(c => {
        if (c.userId === currentUserId) {
          userComments.add(p.id);
        }
      });
    });

    // Count unique posts with user likes
    const userLikes = posts.filter(p => p.likedBy.includes(currentUserId)).length;

    // Complete quest if requirements met
    if (userComments.size >= 2 && userLikes >= 2) {
      completeDailyQuest('daily-engagement');
    }
  };

  const handleDonate = () => {
    if (post.userId === currentUserId) {
      toast.error('Você não pode doar para sua própria publicação!');
      return;
    }
    if (!hasDonated) {
      donatePoints(post.id);
      updateUserActivity();
      
      // Notify post owner (in a real app, this would be a push notification)
      const donor = users.find(u => u.id === currentUserId);
      if (donor && post.userId !== currentUserId) {
        toast.success(`Você doou 2 FOCUS para ${user.name}!`);
      }
    }
  };

  const handleReport = () => {
    // Would send to moderation in real app
    alert('Publicação denunciada');
  };

  const handleBlock = () => {
    blockUser(post.userId);
    alert('Você não verá mais publicações deste usuário');
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment(post.id, commentId);
  };

  const handleEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(text);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (editingCommentText.trim()) {
      editComment(post.id, commentId, editingCommentText);
      setEditingCommentId(null);
      setEditingCommentText('');
    }
  };

  const handlePinComment = (commentId: string) => {
    const pinnedCount = post.comments?.filter(c => c.pinned).length || 0;
    if (pinnedCount >= 3) {
      toast.error('Você já fixou 3 comentários. Desafixe um para fixar outro.');
      return;
    }
    pinComment(post.id, commentId);
    toast.success('Comentário fixado com sucesso!');
  };

  const handleUnpinComment = (commentId: string) => {
    unpinComment(post.id, commentId);
    toast.success('Comentário desafixado!');
  };

  const handleReportComment = (commentId: string) => {
    if (reportReason.trim()) {
      reportComment(post.id, commentId, reportReason);
      setReportingCommentId(null);
      setReportReason('');
      toast.success('Comentário denunciado. Nossa equipe irá revisar.');
    }
  };

  const calculateScore = () => {
    if (!post.quizQuestions || !userAnswer) return 0;
    return post.quizQuestions.reduce((score, q, idx) => {
      return score + (userAnswer.answers[idx] === q.correctIndex ? 1 : 0);
    }, 0);
  };

  return (
    <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Link to={`/perfil-@${user.username}`} className="text-2xl hover:opacity-80 transition-opacity">
          {user.avatar}
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/perfil-@${user.username}`} className="hover:underline">
            <h3 className="font-semibold text-card-foreground truncate">{user.name}</h3>
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatTimeAgo(post.createdAt)}
          </p>
        </div>
        
        {/* Options menu */}
        {post.userId !== currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                •••
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="w-4 h-4 mr-2" />
                Denunciar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock}>
                <EyeOff className="w-4 h-4 mr-2" />
                Não gostei
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content with Quiz Slider */}
      <div className="relative">
        {post.kind === 'photo' && post.mediaUrl && (
          <div className="relative">
            <img src={post.mediaUrl} alt="" className="w-full" />
            {post.musicUrl && (
              <div className="absolute bottom-2 right-2">
                <audio src={post.musicUrl} controls className="h-8 opacity-90" />
              </div>
            )}
          </div>
        )}

        {post.kind === 'video' && post.mediaUrl && (
          <video src={post.mediaUrl} controls className="w-full" />
        )}

        {/* Quiz Slider Overlay - only for photo/video with quiz */}
        {(post.kind === 'photo' || post.kind === 'video') && post.quizQuestions && (
          <QuizSlider
            questions={post.quizQuestions}
            quizClosesAt={post.quizClosesAt}
            userAnswers={userAnswers}
            hasUserAnswered={hasUserAnswered}
            onAnswerSelect={handleQuizAnswer}
            onSubmit={handleSubmitQuizAnswers}
            calculateScore={calculateScore}
          />
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 py-3">
          <MentionText text={post.caption} className="text-sm text-card-foreground" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={cn("gap-1.5", hasLiked && "text-red-500")}
          >
            <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
            <span className="text-xs">{post.likes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDonations(true)}
            className={cn("gap-1.5", hasDonated && "text-primary")}
          >
            <img src={focusCoin} alt="FOCUS" className="w-4 h-4" />
            <span className="text-xs">{post.points} FOCUS</span>
          </Button>

          {/* Comments only for photo/video */}
          {(post.kind === 'photo' || post.kind === 'video') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{post.comments?.length || 0}</span>
            </Button>
          )}
        </div>

        {/* Donation Popup */}
        {showDonations && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">FOCUS</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowDonations(false)}>✕</Button>
            </div>
            {!hasDonated && post.userId !== currentUserId && (
              <Button onClick={handleDonate} size="sm" className="w-full">
                <img src={focusCoin} alt="FOCUS" className="w-4 h-4 mr-2" />
                Doar 2 FOCUS
              </Button>
            )}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <p className="text-xs text-muted-foreground">
                Total: {post.points} FOCUS ({post.donatedBy.length} {post.donatedBy.length === 1 ? 'doação' : 'doações'})
              </p>
              {post.donatedBy.map((userId) => {
                const donor = users.find((u) => u.id === userId);
                if (!donor) return null;
                return (
                  <div key={userId} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <span className="text-lg">{donor.avatar}</span>
                    <p className="text-sm font-semibold">{donor.name}</p>
                    <span className="text-xs text-muted-foreground ml-auto">+2 FOCUS</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments section */}
        {showComments && (post.kind === 'photo' || post.kind === 'video') && (
          <div className="space-y-3 pt-3 border-t border-border">
            {post.comments?.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((comment) => {
              const commentUser = users.find((u) => u.id === comment.userId);
              const isOwnComment = comment.userId === currentUserId;
              const isPostOwner = post.userId === currentUserId;
              const isEditing = editingCommentId === comment.id;
              
              return (
                <div key={comment.id} className="flex gap-2">
                  <div className="text-lg">{commentUser?.avatar}</div>
                  <div className="flex-1">
                    <div className={cn("bg-muted rounded-lg px-3 py-2", comment.pinned && "border-2 border-primary")}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">{commentUser?.name}</p>
                            {comment.pinned && (
                              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Fixado</span>
                            )}
                          </div>
                          {isEditing ? (
                            <Input
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveEditComment(comment.id)}
                              className="mt-1 h-8 text-sm"
                              autoFocus
                            />
                          ) : (
                            <MentionText text={comment.text} className="text-sm text-card-foreground mt-0.5" />
                          )}
                        </div>
                        {(isOwnComment || isPostOwner) && !isEditing && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                •••
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isPostOwner && (
                                <>
                                  {comment.pinned ? (
                                    <DropdownMenuItem onClick={() => handleUnpinComment(comment.id)}>
                                      <Flag className="w-3 h-3 mr-2" />
                                      Desafixar
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => handlePinComment(comment.id)}>
                                      <Flag className="w-3 h-3 mr-2" />
                                      Fixar
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              {isOwnComment && (
                                <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.text)}>
                                  <Edit className="w-3 h-3 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive">
                                <Trash2 className="w-3 h-3 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                              {!isOwnComment && (
                                <DropdownMenuItem onClick={() => setReportingCommentId(comment.id)} className="text-destructive">
                                  <Flag className="w-3 h-3 mr-2" />
                                  Denunciar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => handleSaveEditComment(comment.id)} className="h-6 text-xs">
                            Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-6 text-xs">
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {formatTimeAgo(comment.createdAt)}
                    </p>
                    
                    {/* Report dialog */}
                    {reportingCommentId === comment.id && (
                      <div className="mt-2 p-2 bg-background rounded border border-border">
                        <p className="text-xs font-semibold mb-2">Por que você está denunciando este comentário?</p>
                        <Input
                          placeholder="Motivo da denúncia..."
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="mb-2 h-8 text-xs"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReportComment(comment.id)} className="h-6 text-xs">
                            Enviar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setReportingCommentId(null);
                            setReportReason('');
                          }} className="h-6 text-xs">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            <div className="flex gap-2 items-end">
              <MentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder="Adicione um comentário... (use @ para mencionar)"
                className="flex-1 min-h-[40px]"
                maxLength={500}
              />
              <Button 
                size="sm" 
                onClick={handleAddComment} 
                disabled={!commentText.trim()}
                className="h-10"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
