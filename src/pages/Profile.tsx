import { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Flame, Heart, Camera, Users, Trophy, Settings, ChevronRight, Trash2, Edit, MessageCircle, Bell, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import focusCoin from '@/assets/focus-coin.png';
import { languages, Language } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BioMentionInput } from '@/components/BioMentionInput';
import { BioMentionRequests } from '@/components/BioMentionRequests';
import { extractMentions, validateMentions } from '@/lib/mentions';
import { MentionText } from '@/components/MentionText';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { signOut, user: authUser, profile: authProfile } = useAuth();
  const {
    users, 
    goals, 
    posts, 
    isDarkMode, 
    toggleDarkMode, 
    currentUserId,
    followers,
    followUser,
    unfollowUser,
    dailyQuests,
    followerQuests,
    uniqueQuests,
    deletePost,
    updatePost,
    updateUserAvatar,
    updateUserBio,
    activityStreak,
    userPoints,
  } = useAppStore();

  // Use real Supabase data if viewing own profile, otherwise use store data
  const storeUser = users.find((u) => u.id === id);
  const isOwnProfile = authUser?.id === id;
  
  // Map Supabase profile to User type for own profile
  const user = isOwnProfile && authProfile ? {
    id: authProfile.id,
    name: authProfile.full_name,
    username: authProfile.username,
    avatar: authProfile.avatar_url || '👤',
    bio: authProfile.bio || '',
    streakDays: 0,
  } : storeUser;

  const [editingPhoto, setEditingPhoto] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [showFollowers, setShowFollowers] = useState(false);
  const [showLikes, setShowLikes] = useState<string | null>(null);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showBioMentions, setShowBioMentions] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [notificationsMuted, setNotificationsMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('pt-BR');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Usuário não encontrado</p>
      </div>
    );
  }

  const userGoals = goals.filter((g) => g.userId === user.id);
  const userPosts = posts.filter((p) => p.userId === user.id);
  const userFollowers = followers.get(user.id) || [];
  const isFollowing = userFollowers.includes(currentUserId);

  const completedDailyQuests = dailyQuests.filter((q) => q.completed).length;
  const completedFollowerQuests = followerQuests.filter((q) => q.completed).length;
  const completedUniqueQuests = uniqueQuests.filter((q) => q.completed).length;
  
  const userActivityStreak = activityStreak.get(user.id);
  const activityDays = userActivityStreak?.days || 0;

  // Calculate FOCUS points
  const userPointsData = userPoints.get(user.id);
  const totalFocusFromGoals = userPointsData?.totalPoints || 0;
  
  // Calculate FOCUS donated to others
  const focusDonated = useMemo(() => {
    return posts.reduce((total, post) => {
      if (post.donatedBy.includes(user.id)) {
        return total + 2; // Each donation is 2 FOCUS
      }
      return total;
    }, 0);
  }, [posts, user.id]);
  
  // Calculate FOCUS from own posts (content creation)
  const focusFromContent = useMemo(() => {
    return userPosts.reduce((total, post) => total + post.points, 0);
  }, [userPosts]);
  
  const totalFocusReceived = totalFocusFromGoals + focusFromContent;

  const handleSupport = () => {
    if (isFollowing) {
      unfollowUser(user.id);
      toast.success('Deixou de seguir');
    } else {
      followUser(user.id);
      toast.success('Agora você está seguindo!');
    }
  };

  const handlePhotoEdit = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Foto atualizada!');
      setEditingPhoto(false);
      
      // Refresh auth profile to show new avatar
      window.location.reload();
    } catch (error: any) {
      toast.error('Erro ao atualizar foto: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleBioEdit = () => {
    setNewBio(user.bio);
    setEditingBio(true);
  };

  const handleBioSave = async () => {
    if (!authUser?.id) return;

    try {
      // Extract and validate mentions
      const usernames = extractMentions(newBio);
      
      if (usernames.length > 0) {
        // Validate all mentions are approved
        const validUserIds = await validateMentions(usernames, authUser.id);
        
        // Check if all mentions are valid
        if (validUserIds.length !== usernames.length) {
          toast.error('Algumas menções não são válidas. Você só pode mencionar usuários que aprovaram seu pedido.');
          return;
        }
      }

      // Update bio in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ bio: newBio })
        .eq('id', authUser.id);

      if (error) throw error;

      // Update local store
      updateUserBio(newBio);
      toast.success('Descrição atualizada!');
      setEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      toast.error('Erro ao atualizar descrição');
    }
  };

  const handleDeletePost = () => {
    if (postToDelete) {
      deletePost(postToDelete);
      toast.success('Publicação excluída!');
      setPostToDelete(null);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditCaption(post.caption || '');
  };

  const handleSaveEditPost = () => {
    if (editingPost) {
      updatePost(editingPost.id, { caption: editCaption.trim() });
      toast.success('Publicação atualizada!');
      setEditingPost(null);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      const newValue = !notificationsMuted;
      const { error } = await supabase
        .from('profiles')
        .update({ notifications_muted: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setNotificationsMuted(newValue);
      toast.success(newValue ? 'Notificações silenciadas' : 'Notificações ativadas');
    } catch (error: any) {
      toast.error('Erro ao atualizar notificações');
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id);

      if (error) throw error;

      setSelectedLanguage(lang);
      toast.success('Idioma alterado!');
    } catch (error: any) {
      toast.error('Erro ao alterar idioma');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.rpc('delete_user_account', { user_id: user.id });

      if (error) throw error;

      toast.success('Conta excluída com sucesso');
      signOut();
    } catch (error: any) {
      toast.error('Erro ao excluir conta: ' + error.message);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-[420px] mx-auto">
          <Header />
          
          {/* User Header */}
          <header className="bg-card border-b border-border">
            <div className="px-4 py-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  {user.avatar.startsWith('http') ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-5xl">{user.avatar}</div>
                  )}
                  {isOwnProfile && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
                        onClick={handlePhotoEdit}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelect}
                        disabled={uploadingPhoto}
                      />
                    </>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold text-card-foreground">{user.name}</h1>
                  <p className="text-sm text-primary font-medium">@{user.username || user.name.toLowerCase().replace(/\s+/g, '')}</p>
                  <MentionText text={user.bio} className="text-sm text-muted-foreground mt-1" />
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary mt-1"
                      onClick={handleBioEdit}
                    >
                      Editar descrição
                    </Button>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold text-card-foreground">
                        {activityDays} {activityDays === 1 ? 'dia' : 'dias'} ativo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {!isOwnProfile && (
                <div className="space-y-2">
                  <Button onClick={handleSupport} className="w-full" size="sm" variant={isFollowing ? "outline" : "default"}>
                    <Heart className="w-4 h-4 mr-1.5" />
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                  <Button 
                    onClick={() => navigate(`/messages?user=${id}`)} 
                    className="w-full" 
                    size="sm" 
                    variant="outline"
                  >
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    Iniciar Bate-papo
                  </Button>
                </div>
              )}
            </div>
          </header>

          {/* Stats Panel */}
          <div className="px-4 py-4 grid grid-cols-3 gap-3">
            <Card 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowFollowers(true)}
            >
              <div className="flex flex-col items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{userFollowers.length}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex flex-col items-center gap-2">
                <img src={focusCoin} alt="FOCUS" className="w-5 h-5" />
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-muted-foreground">FOCUS Obtidos:</p>
                    <p className="text-sm font-bold text-secondary">{totalFocusReceived}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-muted-foreground">FOCUS Doados:</p>
                    <p className="text-sm font-bold text-destructive">{focusDonated}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowSettings(true)}
            >
              <div className="flex flex-col items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">•••</p>
                  <p className="text-xs text-muted-foreground">Config</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Posts */}
          <div className="px-4 py-4 space-y-3">
            <h2 className="text-lg font-bold text-foreground">Publicações</h2>
            {userPosts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma publicação ainda</p>
            ) : (
              userPosts.map((post) => (
                <Card key={post.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-secondary">
                        {post.kind === 'photo' ? '📷' : post.kind === 'video' ? '🎥' : '❓'}
                      </span>
                      <h3 className="font-semibold text-card-foreground text-sm capitalize">
                        {post.kind === 'quiz' ? `Quiz de ${post.quizTheme}` : post.kind}
                      </h3>
                    </div>
                    {isOwnProfile && (
                      <div className="flex gap-1">
                        {post.kind !== 'quiz' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditPost(post)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => setPostToDelete(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {post.mediaUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      {post.kind === 'photo' ? (
                        <img src={post.mediaUrl} alt="" className="w-full" />
                      ) : post.kind === 'video' ? (
                        <video src={post.mediaUrl} controls className="w-full" />
                      ) : null}
                    </div>
                  )}
                  {post.caption && (
                    <p className="text-sm text-card-foreground mt-2">{post.caption}</p>
                  )}
                   <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <button 
                      onClick={() => setShowLikes(post.id)}
                      className="hover:underline cursor-pointer"
                    >
                      ❤️ {post.likes}
                    </button>
                    <span className="flex items-center gap-1">
                      <img src={focusCoin} alt="FOCUS" className="w-3 h-3" />
                      {post.points} FOCUS
                    </span>
                    {post.kind !== 'quiz' && post.comments && (
                      <button 
                        onClick={() => setShowComments(post.id)}
                        className="hover:underline cursor-pointer"
                      >
                        💬 {post.comments.length}
                      </button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Seguidores ({userFollowers.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
            {userFollowers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Nenhum seguidor ainda</p>
            ) : (
              userFollowers.map((followerId) => {
                const follower = users.find((u) => u.id === followerId);
                if (!follower) return null;
                return (
                  <div key={followerId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <span className="text-2xl">{follower.avatar}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{follower.name}</p>
                      <p className="text-xs text-muted-foreground">{follower.bio}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Likes Dialog */}
      <Dialog open={!!showLikes} onOpenChange={() => setShowLikes(null)}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Curtidas</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
            {showLikes && (() => {
              const post = userPosts.find(p => p.id === showLikes);
              if (!post || post.likedBy.length === 0) {
                return <p className="text-center text-muted-foreground py-4">Nenhuma curtida ainda</p>;
              }
              return post.likedBy.map((userId) => {
                const liker = users.find((u) => u.id === userId);
                if (!liker) return null;
                return (
                  <div key={userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                    <span className="text-2xl">{liker.avatar}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{liker.name}</p>
                      <p className="text-xs text-muted-foreground">{liker.bio}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={!!showComments} onOpenChange={() => setShowComments(null)}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Comentários</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
            {showComments && (() => {
              const post = userPosts.find(p => p.id === showComments);
              if (!post || !post.comments || post.comments.length === 0) {
                return <p className="text-center text-muted-foreground py-4">Nenhum comentário ainda</p>;
              }
              return post.comments.map((comment) => {
                const commenter = users.find((u) => u.id === comment.userId);
                if (!commenter) return null;
                return (
                  <div key={comment.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted">
                    <span className="text-2xl">{commenter.avatar}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{commenter.name}</p>
                      <p className="text-xs text-card-foreground mt-1">{comment.text}</p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <Label htmlFor="dark-mode" className="cursor-pointer">
                Modo Escuro
              </Label>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>

            <div 
              className="p-3 bg-card rounded-lg border border-border cursor-pointer hover:bg-muted/50"
              onClick={() => {
                setShowSettings(false);
                setShowNotifications(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Notificações</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div 
              className="p-3 bg-card rounded-lg border border-border cursor-pointer hover:bg-muted/50"
              onClick={() => {
                setShowSettings(false);
                setShowLanguage(true);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Idioma</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {isOwnProfile && (
              <>
                <div 
                  className="p-3 bg-card rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setShowSettings(false);
                    setShowBioMentions(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Menções na Bio</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div 
                  className="p-3 bg-card rounded-lg border border-destructive/50 cursor-pointer hover:bg-destructive/10"
                  onClick={() => {
                    setShowSettings(false);
                    setShowDeleteAccount(true);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-destructive">Excluir Conta</span>
                    <ChevronRight className="w-4 h-4 text-destructive" />
                  </div>
                </div>
              </>
            )}

            <div className="p-3 bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between cursor-pointer" onClick={signOut}>
                <span className="text-sm text-destructive">Sair</span>
                <ChevronRight className="w-4 h-4 text-destructive" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Notificações</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
              <Label htmlFor="mute-notifications" className="cursor-pointer">
                Silenciar todas as notificações
              </Label>
              <Switch 
                id="mute-notifications" 
                checked={notificationsMuted} 
                onCheckedChange={handleToggleNotifications} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Dialog */}
      <Dialog open={showLanguage} onOpenChange={setShowLanguage}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Idioma</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedLanguage} onValueChange={(value) => handleLanguageChange(value as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(languages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conta Permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os seus dados, incluindo publicações, comentários e informações pessoais serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bio Mentions Management Dialog */}
      <Dialog open={showBioMentions} onOpenChange={setShowBioMentions}>
        <DialogContent className="max-w-[400px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Menções na Bio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <BioMentionRequests />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bio Dialog */}
      <Dialog open={editingBio} onOpenChange={setEditingBio}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Editar Descrição</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <BioMentionInput
              value={newBio}
              onChange={setNewBio}
              placeholder="Sua descrição... (use @ para mencionar)"
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {newBio.length}/500 caracteres
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBio(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBioSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A publicação será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle>Editar Publicação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-caption">Legenda</Label>
            <Textarea
              id="edit-caption"
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Adicione uma legenda..."
              maxLength={500}
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {editCaption.length}/500 caracteres
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPost(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditPost}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
