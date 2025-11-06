import { create } from 'zustand';
import { Post, Goal, User, UserPoints, Comment } from '@/lib/types';
import { users as initialUsers, goals as initialGoals } from '@/lib/fixtures';
import { supabase } from '@/integrations/supabase/client';

interface DailyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  lastCompletedDate?: Date;
}

interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  claimed: boolean;
  progress: number;
  target: number;
  lastCompletedDate?: Date;
}

interface MonthlyQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  claimed: boolean;
  progress: { videos: number; photos: number };
  target: { videos: number; photos: number };
  lastCompletedDate?: Date;
}

interface FollowerQuest {
  id: string;
  targetFollowers: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

interface UniqueQuest {
  id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  claimed: boolean;
  type: 'first-photo' | 'first-video' | 'likes' | 'comments' | 'first-donation' | 'first-quiz-correct';
  target?: number;
}

interface AppState {
  // Data
  users: User[];
  goals: Goal[];
  posts: Post[];
  currentUserId: string;
  userPoints: Map<string, UserPoints>;
  dailyQuests: DailyQuest[];
  weeklyQuests: WeeklyQuest[];
  monthlyQuests: MonthlyQuest[];
  followerQuests: FollowerQuest[];
  uniqueQuests: UniqueQuest[];
  followers: Map<string, string[]>;
  lastLoginDate: Date | null;
  blockedUsers: string[];
  activityStreak: Map<string, { days: number; lastActivity: Date }>;
  error?: string;

  // UI State
  isDarkMode: boolean;

  // Actions
  setCurrentUserId: (userId: string) => void;
  toggleDarkMode: () => void;
  loadPosts: () => Promise<void>;
  loadUsers: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  updateGoalProgress: (goalId: string, newValue: number) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  donatePoints: (postId: string) => void;
  submitQuizAnswers: (postId: string, answers: number[]) => void;
  addComment: (postId: string, text: string) => void;
  editComment: (postId: string, commentId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  pinComment: (postId: string, commentId: string) => void;
  unpinComment: (postId: string, commentId: string) => void;
  reportComment: (postId: string, commentId: string, reason: string) => void;
  completeDailyQuest: (questId: string) => void;
  completeWeeklyQuest: (questId: string) => void;
  completeMonthlyQuest: (questId: string) => void;
  claimFollowerQuest: (questId: string) => void;
  claimUniqueQuest: (questId: string) => void;
  checkDailyLogin: () => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  blockUser: (userId: string) => void;
  updateUserAvatar: (avatar: string) => void;
  updateUserBio: (bio: string) => void;
  updateUserActivity: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial data
  users: initialUsers,
  goals: initialGoals,
  posts: [],
  currentUserId: '', // Will be set by auth
  userPoints: new Map(initialUsers.map(u => [u.id, { userId: u.id, totalPoints: 0, availablePoints: 0 }])),
  
  // Add action to set current user ID
  setCurrentUserId: (userId: string) => set({ currentUserId: userId }),
  dailyQuests: [
    {
      id: 'daily-checkin',
      title: 'Check-in Diário',
      description: 'Faça check-in no aplicativo',
      reward: 1,
      completed: false,
    },
    {
      id: 'daily-engagement',
      title: 'Engajamento Diário',
      description: 'Comente em 2 publicações diferentes e dê 2 curtidas em publicações diferentes',
      reward: 2,
      completed: false,
    },
  ],
  weeklyQuests: [
    {
      id: 'weekly-quiz',
      title: 'Mestre dos Questionários',
      description: 'Responda a 5 questionários durante a semana de forma correta',
      reward: 5,
      completed: false,
      claimed: false,
      progress: 0,
      target: 5,
    },
    {
      id: 'weekly-donations',
      title: 'Generosidade Semanal',
      description: 'Faça 2 doações de FOCUS durante a semana',
      reward: 5,
      completed: false,
      claimed: false,
      progress: 0,
      target: 2,
    },
  ],
  monthlyQuests: [
    {
      id: 'monthly-content',
      title: 'Criador Ativo',
      description: 'Publique 5 vídeos e 3 fotos durante o mês',
      reward: 20,
      completed: false,
      claimed: false,
      progress: { videos: 0, photos: 0 },
      target: { videos: 5, photos: 3 },
    },
  ],
  followerQuests: [
    { id: 'followers-10', targetFollowers: 10, reward: 1, completed: false, claimed: false },
    { id: 'followers-20', targetFollowers: 20, reward: 2, completed: false, claimed: false },
    { id: 'followers-40', targetFollowers: 40, reward: 4, completed: false, claimed: false },
    { id: 'followers-80', targetFollowers: 80, reward: 6, completed: false, claimed: false },
    { id: 'followers-160', targetFollowers: 160, reward: 8, completed: false, claimed: false },
    { id: 'followers-300', targetFollowers: 300, reward: 10, completed: false, claimed: false },
    { id: 'followers-600', targetFollowers: 600, reward: 15, completed: false, claimed: false },
    { id: 'followers-1200', targetFollowers: 1200, reward: 20, completed: false, claimed: false },
    { id: 'followers-2500', targetFollowers: 2500, reward: 30, completed: false, claimed: false },
    { id: 'followers-5000', targetFollowers: 5000, reward: 40, completed: false, claimed: false },
    { id: 'followers-10000', targetFollowers: 10000, reward: 50, completed: false, claimed: false },
    { id: 'followers-20000', targetFollowers: 20000, reward: 75, completed: false, claimed: false },
    { id: 'followers-50000', targetFollowers: 50000, reward: 100, completed: false, claimed: false },
    { id: 'followers-75000', targetFollowers: 75000, reward: 125, completed: false, claimed: false },
    { id: 'followers-100000', targetFollowers: 100000, reward: 150, completed: false, claimed: false },
    { id: 'followers-200000', targetFollowers: 200000, reward: 175, completed: false, claimed: false },
    { id: 'followers-300000', targetFollowers: 300000, reward: 200, completed: false, claimed: false },
    { id: 'followers-400000', targetFollowers: 400000, reward: 250, completed: false, claimed: false },
    { id: 'followers-500000', targetFollowers: 500000, reward: 300, completed: false, claimed: false },
    { id: 'followers-750000', targetFollowers: 750000, reward: 400, completed: false, claimed: false },
    { id: 'followers-1000000', targetFollowers: 1000000, reward: 500, completed: false, claimed: false },
  ],
  uniqueQuests: [
    {
      id: 'first-video',
      title: 'Primeira Publicação de Vídeo',
      description: 'Publique seu primeiro vídeo',
      reward: 5,
      completed: false,
      claimed: false,
      type: 'first-video',
    },
    {
      id: 'first-photo',
      title: 'Primeira Publicação de Foto',
      description: 'Publique sua primeira foto',
      reward: 5,
      completed: false,
      claimed: false,
      type: 'first-photo',
    },
    {
      id: 'likes-20',
      title: '20 Curtidas',
      description: 'Primeira publicação a atingir 20 curtidas',
      reward: 10,
      completed: false,
      claimed: false,
      type: 'likes',
      target: 20,
    },
    {
      id: 'comments-20',
      title: '20 Comentários',
      description: 'Primeira publicação a atingir 20 comentários',
      reward: 10,
      completed: false,
      claimed: false,
      type: 'comments',
      target: 20,
    },
    {
      id: 'first-donation',
      title: 'Primeira Doação',
      description: 'Primeira vez a conceder FOCUS para outro usuário',
      reward: 10,
      completed: false,
      claimed: false,
      type: 'first-donation',
    },
    {
      id: 'first-quiz-correct',
      title: 'Primeiro Quiz Correto',
      description: 'Primeiro questionário a ser respondido corretamente',
      reward: 10,
      completed: false,
      claimed: false,
      type: 'first-quiz-correct',
    },
  ],
  followers: new Map(),
  lastLoginDate: null,
  blockedUsers: [],
  activityStreak: new Map(),

  // UI State
  isDarkMode: false,

  // Actions
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  loadPosts: async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const posts = data.map((post: any) => ({
          id: post.id,
          userId: post.user_id,
          kind: post.kind,
          mediaUrl: post.media_url,
          caption: post.caption,
          theme: post.theme,
          musicUrl: post.music_url,
          likes: post.likes || 0,
          comments: post.comments || [],
          donations: post.donations || 0,
          points: post.points || 0,
          createdAt: new Date(post.created_at),
          quizTheme: post.quiz_theme,
          quizQuestions: post.quiz_questions,
          likedBy: post.liked_by || [],
          donatedBy: post.donated_by || [],
        }));
        set({ posts });
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      set({ error: 'Erro ao carregar publicações' });
    }
  },
  
  loadUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const users = data.map((profile: any) => ({
          id: profile.id,
          name: profile.full_name || profile.username,
          username: profile.username,
          avatar: profile.avatar_url || '',
          bio: profile.bio || '',
          isVerified: profile.is_verified || false,
          followersCount: profile.followers_count || 0,
          followingCount: profile.following_count || 0,
          streakDays: 0,
        }));
        set({ users });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      set({ error: 'Erro ao carregar usuários' });
    }
  },
  
  addPost: (post) =>
    set((state) => {
      const newPosts = [post, ...state.posts];
      const newUniqueQuests = [...state.uniqueQuests];
      const newMonthlyQuests = [...state.monthlyQuests];
      
      // Check for first post quests
      if (post.kind === 'photo' && !state.uniqueQuests.find(q => q.id === 'first-photo')?.completed) {
        const index = newUniqueQuests.findIndex(q => q.id === 'first-photo');
        if (index !== -1) newUniqueQuests[index] = { ...newUniqueQuests[index], completed: true };
      }
      if (post.kind === 'video' && !state.uniqueQuests.find(q => q.id === 'first-video')?.completed) {
        const index = newUniqueQuests.findIndex(q => q.id === 'first-video');
        if (index !== -1) newUniqueQuests[index] = { ...newUniqueQuests[index], completed: true };
      }

      // Update monthly quest progress
      const monthlyQuestIndex = newMonthlyQuests.findIndex(q => q.id === 'monthly-content');
      if (monthlyQuestIndex !== -1 && post.userId === state.currentUserId) {
        const quest = newMonthlyQuests[monthlyQuestIndex];
        const newProgress = { ...quest.progress };
        
        if (post.kind === 'video') newProgress.videos++;
        if (post.kind === 'photo') newProgress.photos++;
        
        const isCompleted = newProgress.videos >= quest.target.videos && newProgress.photos >= quest.target.photos;
        
        newMonthlyQuests[monthlyQuestIndex] = {
          ...quest,
          progress: newProgress,
          completed: isCompleted,
        };
      }

      return { posts: newPosts, uniqueQuests: newUniqueQuests, monthlyQuests: newMonthlyQuests };
    }),

  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post
      ),
    })),

  deletePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
    })),
  
  updateGoalProgress: (goalId, newValue) =>
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === goalId ? { ...goal, currentValue: newValue } : goal
      ),
    })),

  likePost: (postId) =>
    set((state) => {
      const post = state.posts.find((p) => p.id === postId);
      if (!post || post.likedBy.includes(state.currentUserId)) return state;

      const newPosts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes + 1, likedBy: [...p.likedBy, state.currentUserId] }
          : p
      );

      // Check unique quests for likes
      const updatedPost = newPosts.find(p => p.id === postId)!;
      const newUniqueQuests = [...state.uniqueQuests];
      
      if (updatedPost.likes >= 20 && !state.uniqueQuests.find(q => q.id === 'likes-20')?.completed) {
        const index = newUniqueQuests.findIndex(q => q.id === 'likes-20');
        if (index !== -1) newUniqueQuests[index] = { ...newUniqueQuests[index], completed: true };
      }

      return { posts: newPosts, uniqueQuests: newUniqueQuests };
    }),

  unlikePost: (postId) =>
    set((state) => {
      const post = state.posts.find((p) => p.id === postId);
      if (!post || !post.likedBy.includes(state.currentUserId)) return state;

      const newPosts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likes - 1, likedBy: p.likedBy.filter(id => id !== state.currentUserId) }
          : p
      );

      return { posts: newPosts };
    }),

  donatePoints: (postId) =>
    set((state) => {
      const post = state.posts.find((p) => p.id === postId);
      // Don't allow donating to own post
      if (!post || post.userId === state.currentUserId || post.donatedBy.includes(state.currentUserId)) return state;

      const currentUserPoints = state.userPoints.get(state.currentUserId);
      if (!currentUserPoints || currentUserPoints.availablePoints < 2) {
        return state;
      }

      const newUserPoints = new Map(state.userPoints);
      
      // Deduct 2 points from current user (decrease available)
      newUserPoints.set(state.currentUserId, {
        ...currentUserPoints,
        availablePoints: currentUserPoints.availablePoints - 2,
      });

      // Add 2 points to post owner (increase total received)
      const recipientPoints = newUserPoints.get(post.userId);
      if (recipientPoints) {
        newUserPoints.set(post.userId, {
          ...recipientPoints,
          totalPoints: recipientPoints.totalPoints + 2,
        });
      }
      
      // Update Supabase profiles for FOCUS tracking (async, non-blocking)
      const updateDatabase = async () => {
        try {
          // Get current donor profile
          const { data: donorProfile } = await supabase
            .from('profiles')
            .select('focus_donated')
            .eq('id', state.currentUserId)
            .single();
          
          if (donorProfile) {
            // Increment focus_donated for donor
            await supabase
              .from('profiles')
              .update({ focus_donated: donorProfile.focus_donated + 2 })
              .eq('id', state.currentUserId);
          }
          
          // Get current recipient profile
          const { data: recipientProfile } = await supabase
            .from('profiles')
            .select('total_focus_received')
            .eq('id', post.userId)
            .single();
          
          if (recipientProfile) {
            // Increment total_focus_received for recipient
            await supabase
              .from('profiles')
              .update({ total_focus_received: recipientProfile.total_focus_received + 2 })
              .eq('id', post.userId);
          }
        } catch (error) {
          console.error('Error updating FOCUS in database:', error);
        }
      };
      updateDatabase();

      const newPosts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, points: p.points + 2, donatedBy: [...p.donatedBy, state.currentUserId] }
          : p
      );

      // Check unique quest for first donation
      const newUniqueQuests = [...state.uniqueQuests];
      if (!state.uniqueQuests.find(q => q.id === 'first-donation')?.completed) {
        const index = newUniqueQuests.findIndex(q => q.id === 'first-donation');
        if (index !== -1) newUniqueQuests[index] = { ...newUniqueQuests[index], completed: true };
      }

      // Update weekly donations quest
      const newWeeklyQuests = [...state.weeklyQuests];
      const weeklyDonationIndex = newWeeklyQuests.findIndex(q => q.id === 'weekly-donations');
      if (weeklyDonationIndex !== -1) {
        const quest = newWeeklyQuests[weeklyDonationIndex];
        const newProgress = quest.progress + 1;
        newWeeklyQuests[weeklyDonationIndex] = {
          ...quest,
          progress: newProgress,
          completed: newProgress >= quest.target,
        };
      }

      return { posts: newPosts, userPoints: newUserPoints, uniqueQuests: newUniqueQuests, weeklyQuests: newWeeklyQuests };
    }),

  addComment: (postId, text) =>
    set((state) => {
      const comment: Comment = {
        id: `c${Date.now()}`,
        userId: state.currentUserId,
        text,
        createdAt: new Date(),
      };

      const newPosts = state.posts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...(post.comments || []), comment] }
          : post
      );

      // Check unique quest for 20 comments
      const updatedPost = newPosts.find(p => p.id === postId);
      const newUniqueQuests = [...state.uniqueQuests];
      
      if (updatedPost && updatedPost.comments && updatedPost.comments.length >= 20) {
        if (!state.uniqueQuests.find(q => q.id === 'comments-20')?.completed) {
          const index = newUniqueQuests.findIndex(q => q.id === 'comments-20');
          if (index !== -1) newUniqueQuests[index] = { ...newUniqueQuests[index], completed: true };
        }
      }

      return { posts: newPosts, uniqueQuests: newUniqueQuests };
    }),

  editComment: (postId, commentId, text) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments?.map((comment) =>
                comment.id === commentId ? { ...comment, text } : comment
              ),
            }
          : post
      ),
    })),

  deleteComment: (postId, commentId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments?.filter((comment) => comment.id !== commentId),
            }
          : post
      ),
    })),

  pinComment: (postId, commentId) =>
    set((state) => {
      const post = state.posts.find(p => p.id === postId);
      if (!post) return state;

      // Check if there are already 3 pinned comments
      const pinnedCount = post.comments?.filter(c => c.pinned).length || 0;
      if (pinnedCount >= 3) {
        // Return state unchanged and indicate error
        return { ...state, error: 'Máximo de 3 comentários fixados atingido' };
      }

      return {
        posts: state.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments?.map((comment) =>
                  comment.id === commentId ? { ...comment, pinned: true } : comment
                ),
              }
            : p
        ),
        error: undefined,
      };
    }),

  unpinComment: (postId, commentId) =>
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments?.map((comment) =>
                comment.id === commentId ? { ...comment, pinned: false } : comment
              ),
            }
          : post
      ),
    })),

  reportComment: (postId, commentId, reason) =>
    set((state) => {
      // In a real app, this would send the report to a moderation system
      console.log('Comentário denunciado:', { postId, commentId, reason });
      return state;
    }),

  completeDailyQuest: (questId) =>
    set((state) => {
      const quest = state.dailyQuests.find((q) => q.id === questId);
      if (!quest || quest.lastCompletedDate) return state;

      // For daily-checkin, it's already marked as completed, just need to claim
      // For other quests, validate quest completion
      if (questId === 'daily-engagement') {
        // Check if user has commented on 2 different posts
        const userComments = new Set<string>();
        state.posts.forEach(post => {
          post.comments?.forEach(comment => {
            if (comment.userId === state.currentUserId) {
              userComments.add(post.id);
            }
          });
        });

        // Check if user has liked 2 different posts
        const userLikes = state.posts.filter(post => 
          post.likedBy.includes(state.currentUserId)
        ).length;

        if (userComments.size < 2 || userLikes < 2) {
          return state;
        }
      }

      const newUserPoints = new Map(state.userPoints);
      const currentUserPoints = newUserPoints.get(state.currentUserId);
      if (currentUserPoints) {
        newUserPoints.set(state.currentUserId, {
          ...currentUserPoints,
          totalPoints: currentUserPoints.totalPoints + quest.reward,
          availablePoints: currentUserPoints.availablePoints + quest.reward,
        });
      }

      return {
        dailyQuests: state.dailyQuests.map((q) =>
          q.id === questId ? { ...q, completed: true, lastCompletedDate: new Date() } : q
        ),
        userPoints: newUserPoints,
      };
    }),

  completeWeeklyQuest: (questId) =>
    set((state) => {
      const quest = state.weeklyQuests.find((q) => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return state;

      const newUserPoints = new Map(state.userPoints);
      const currentUserPoints = newUserPoints.get(state.currentUserId);
      if (currentUserPoints) {
        newUserPoints.set(state.currentUserId, {
          ...currentUserPoints,
          totalPoints: currentUserPoints.totalPoints + quest.reward,
          availablePoints: currentUserPoints.availablePoints + quest.reward,
        });
      }

      return {
        weeklyQuests: state.weeklyQuests.map((q) =>
          q.id === questId ? { ...q, claimed: true, lastCompletedDate: new Date() } : q
        ),
        userPoints: newUserPoints,
      };
    }),

  completeMonthlyQuest: (questId) =>
    set((state) => {
      const quest = state.monthlyQuests.find((q) => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return state;

      const newUserPoints = new Map(state.userPoints);
      const currentUserPoints = newUserPoints.get(state.currentUserId);
      if (currentUserPoints) {
        newUserPoints.set(state.currentUserId, {
          ...currentUserPoints,
          totalPoints: currentUserPoints.totalPoints + quest.reward,
          availablePoints: currentUserPoints.availablePoints + quest.reward,
        });
      }

      return {
        monthlyQuests: state.monthlyQuests.map((q) =>
          q.id === questId ? { ...q, claimed: true, lastCompletedDate: new Date() } : q
        ),
        userPoints: newUserPoints,
      };
    }),

  claimFollowerQuest: (questId) =>
    set((state) => {
      const quest = state.followerQuests.find((q) => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return state;

      const newUserPoints = new Map(state.userPoints);
      const currentUserPoints = newUserPoints.get(state.currentUserId);
      if (currentUserPoints) {
        newUserPoints.set(state.currentUserId, {
          ...currentUserPoints,
          totalPoints: currentUserPoints.totalPoints + quest.reward,
          availablePoints: currentUserPoints.availablePoints + quest.reward,
        });
      }

      return {
        followerQuests: state.followerQuests.map((q) =>
          q.id === questId ? { ...q, claimed: true } : q
        ),
        userPoints: newUserPoints,
      };
    }),

  claimUniqueQuest: (questId) =>
    set((state) => {
      const quest = state.uniqueQuests.find((q) => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return state;

      const newUserPoints = new Map(state.userPoints);
      const currentUserPoints = newUserPoints.get(state.currentUserId);
      if (currentUserPoints) {
        newUserPoints.set(state.currentUserId, {
          ...currentUserPoints,
          totalPoints: currentUserPoints.totalPoints + quest.reward,
          availablePoints: currentUserPoints.availablePoints + quest.reward,
        });
      }

      return {
        uniqueQuests: state.uniqueQuests.map((q) =>
          q.id === questId ? { ...q, claimed: true } : q
        ),
        userPoints: newUserPoints,
      };
    }),

  checkDailyLogin: () =>
    set((state) => {
      const now = new Date();
      // Convert to UTC-3 (Brasília Time)
      const utcMinus3 = new Date(now.getTime() - (3 * 60 * 60 * 1000));
      const today = utcMinus3.toDateString();
      const lastLogin = state.lastLoginDate ? new Date(state.lastLoginDate.getTime() - (3 * 60 * 60 * 1000)).toDateString() : null;

      if (lastLogin === today) return state;

      // Check if we need to reset daily quests (new day in UTC-3)
      let newDailyQuests = [...state.dailyQuests];
      if (lastLogin && lastLogin !== today) {
        // Reset daily quests for new day
        newDailyQuests = state.dailyQuests.map(q => ({ ...q, completed: false, lastCompletedDate: undefined }));
      }

      // Check if we need to reset weekly quests (Monday in UTC-3)
      let newWeeklyQuests = [...state.weeklyQuests];
      const dayOfWeek = utcMinus3.getDay(); // 0 = Sunday, 1 = Monday
      const lastLoginDate = state.lastLoginDate ? new Date(state.lastLoginDate.getTime() - (3 * 60 * 60 * 1000)) : null;
      const lastDayOfWeek = lastLoginDate ? lastLoginDate.getDay() : null;
      
      if (dayOfWeek === 1 && lastDayOfWeek !== 1) {
        // Reset weekly quests on Monday
        newWeeklyQuests = state.weeklyQuests.map(q => ({ 
          ...q, 
          completed: false,
          claimed: false,
          progress: 0,
          lastCompletedDate: undefined 
        }));
      }

      // Check if we need to reset monthly quests (1st day of month in UTC-3)
      let newMonthlyQuests = [...state.monthlyQuests];
      const dayOfMonth = utcMinus3.getDate();
      const lastDayOfMonth = lastLoginDate ? lastLoginDate.getDate() : null;
      
      if (dayOfMonth === 1 && lastDayOfMonth !== 1) {
        // Reset monthly quests on 1st of month
        newMonthlyQuests = state.monthlyQuests.map(q => ({ 
          ...q, 
          completed: false,
          claimed: false,
          progress: { videos: 0, photos: 0 },
          lastCompletedDate: undefined 
        }));
      }

      // Mark check-in quest as completed (but not claimed yet - requires manual claim)
      newDailyQuests = newDailyQuests.map((q) => {
        if (q.id === 'daily-checkin') {
          return { ...q, completed: true, lastCompletedDate: new Date() };
        }
        return q;
      });

      // No automatic points - user must click "Resgatar" to claim

      return {
        lastLoginDate: now,
        dailyQuests: newDailyQuests,
        weeklyQuests: newWeeklyQuests,
        monthlyQuests: newMonthlyQuests,
      };
    }),

  followUser: (userId) =>
    set((state) => {
      const newFollowers = new Map(state.followers);
      const currentFollowers = newFollowers.get(userId) || [];
      if (!currentFollowers.includes(state.currentUserId)) {
        newFollowers.set(userId, [...currentFollowers, state.currentUserId]);
      }

      // Save to Supabase (async, non-blocking)
      const saveToDatabase = async () => {
        try {
          await supabase
            .from('follows')
            .insert({
              follower_id: state.currentUserId,
              following_id: userId,
            });
        } catch (error) {
          console.error('Error saving follow to database:', error);
        }
      };
      saveToDatabase();

      // Check and auto-complete follower quests
      const totalFollowers = newFollowers.get(state.currentUserId)?.length || 0;
      const newFollowerQuests = state.followerQuests.map((q) => {
        if (totalFollowers >= q.targetFollowers && !q.completed) {
          return { ...q, completed: true };
        }
        return q;
      });

      return { followers: newFollowers, followerQuests: newFollowerQuests };
    }),

  unfollowUser: (userId) =>
    set((state) => {
      const newFollowers = new Map(state.followers);
      const currentFollowers = newFollowers.get(userId) || [];
      newFollowers.set(
        userId,
        currentFollowers.filter((id) => id !== state.currentUserId)
      );

      // Delete from Supabase (async, non-blocking)
      const deleteFromDatabase = async () => {
        try {
          await supabase
            .from('follows')
            .delete()
            .eq('follower_id', state.currentUserId)
            .eq('following_id', userId);
        } catch (error) {
          console.error('Error deleting follow from database:', error);
        }
      };
      deleteFromDatabase();

      return { followers: newFollowers };
    }),

  blockUser: (userId) =>
    set((state) => ({
      blockedUsers: [...state.blockedUsers, userId],
    })),

  updateUserAvatar: (avatar) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === state.currentUserId ? { ...user, avatar } : user
      ),
    })),

  updateUserBio: (bio) =>
    set((state) => ({
      users: state.users.map((user) =>
        user.id === state.currentUserId ? { ...user, bio } : user
      ),
    })),

  submitQuizAnswers: (postId, answers) =>
    set((state) => {
      const post = state.posts.find((p) => p.id === postId);
      if (!post || !post.quizQuestions) return state;

      // Calculate score
      const score = post.quizQuestions.reduce((total, q, idx) => {
        return total + (answers[idx] === q.correctIndex ? 1 : 0);
      }, 0);

      // Add quiz answer
      const newQuizAnswer = {
        userId: state.currentUserId,
        answers,
        answeredAt: new Date(),
      };

      const newPosts = state.posts.map((p) =>
        p.id === postId
          ? { ...p, quizAnswers: [...(p.quizAnswers || []), newQuizAnswer] }
          : p
      );

      // Award points for correct answers (1 FOCUS per correct answer)
      const newUserPoints = new Map(state.userPoints);
      const currentUserPoints = newUserPoints.get(state.currentUserId);
      if (currentUserPoints && score > 0) {
        newUserPoints.set(state.currentUserId, {
          ...currentUserPoints,
          totalPoints: currentUserPoints.totalPoints + score,
          availablePoints: currentUserPoints.availablePoints + score,
        });
      }

      // Check unique quest for first quiz correct
      const newUniqueQuests = [...state.uniqueQuests];
      if (score > 0 && !state.uniqueQuests.find(q => q.id === 'first-quiz-correct')?.completed) {
        const index = newUniqueQuests.findIndex(q => q.id === 'first-quiz-correct');
        if (index !== -1) newUniqueQuests[index] = { ...newUniqueQuests[index], completed: true };
      }

      // Update weekly quiz quest
      const newWeeklyQuests = [...state.weeklyQuests];
      const weeklyQuizIndex = newWeeklyQuests.findIndex(q => q.id === 'weekly-quiz');
      if (weeklyQuizIndex !== -1 && score > 0) {
        const quest = newWeeklyQuests[weeklyQuizIndex];
        const newProgress = quest.progress + 1;
        newWeeklyQuests[weeklyQuizIndex] = {
          ...quest,
          progress: newProgress,
          completed: newProgress >= quest.target,
        };
      }

      return { posts: newPosts, userPoints: newUserPoints, uniqueQuests: newUniqueQuests, weeklyQuests: newWeeklyQuests };
    }),

  updateUserActivity: () =>
    set((state) => {
      const currentUser = state.users.find((u) => u.id === state.currentUserId);
      if (!currentUser) return state;

      const today = new Date().toDateString();
      const lastActive = currentUser.lastActiveDate?.toDateString();
      
      let newStreakDays = currentUser.streakDays;
      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastActive === yesterday.toDateString();
        
        newStreakDays = wasYesterday ? currentUser.streakDays + 1 : 1;
      }

      // Update activity streak
      const newActivityStreak = new Map(state.activityStreak);
      const currentStreak = newActivityStreak.get(state.currentUserId);
      const now = new Date();
      
      if (currentStreak) {
        const lastActivityDate = new Date(currentStreak.lastActivity).toDateString();
        if (lastActivityDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const wasYesterday = lastActivityDate === yesterday.toDateString();
          
          newActivityStreak.set(state.currentUserId, {
            days: wasYesterday ? currentStreak.days + 1 : 1,
            lastActivity: now,
          });
        }
      } else {
        newActivityStreak.set(state.currentUserId, { days: 1, lastActivity: now });
      }

      return {
        users: state.users.map((user) =>
          user.id === state.currentUserId
            ? { ...user, streakDays: newStreakDays, lastActiveDate: new Date() }
            : user
        ),
        activityStreak: newActivityStreak,
      };
    }),
}));
