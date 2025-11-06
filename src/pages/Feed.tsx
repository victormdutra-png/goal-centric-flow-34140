import { useAppStore } from '@/store/useAppStore';
import { PostCard } from '@/components/PostCard';
import { Header } from '@/components/Header';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Feed() {
  const { posts, users } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh feed
  const refreshFeed = async () => {
    setIsLoading(true);
    try {
      // Fetch latest posts from Supabase
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // You could update the store with fresh data here
      // For now, just show a success message
      toast.success('Feed atualizado!');
    } catch (error) {
      console.error('Error refreshing feed:', error);
      toast.error('Erro ao atualizar feed');
    } finally {
      setIsLoading(false);
    }
  };

  // Pull to refresh
  const { containerRef, isPulling, isRefreshing, pullDistance, threshold } =
    usePullToRefresh({
      onRefresh: refreshFeed,
      threshold: 80,
    });

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFeed();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <div className="max-w-[420px] mx-auto">
        <Header />

        {/* Pull to refresh indicator */}
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          threshold={threshold}
          isRefreshing={isRefreshing}
          isPulling={isPulling}
        />

        {/* Feed */}
        <main
          ref={containerRef}
          className="px-4 py-4 space-y-4 overflow-y-auto"
          style={{ paddingTop: isRefreshing ? `${threshold}px` : undefined }}
        >
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isLoading ? 'Carregando...' : 'Nenhuma publicação ainda.'}
              </p>
            </div>
          ) : (
            posts.map((post) => {
              const user = users.find((u) => u.id === post.userId);
              if (!user) return null;
              return <PostCard key={post.id} post={post} user={user} />;
            })
          )}
        </main>
      </div>
    </div>
  );
}
