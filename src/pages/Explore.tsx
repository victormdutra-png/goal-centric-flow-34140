import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { PostCard } from '@/components/PostCard';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function Explore() {
  const { posts, users, loadPosts, loadUsers } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadPosts(), loadUsers()]);
    };
    loadData();
  }, []);

  // Calculate popular themes based on post count
  const popularThemes = useMemo(() => {
    const themeCounts = new Map<string, number>();
    
    posts.forEach((post) => {
      const theme = post.theme || 'outros';
      const currentCount = themeCounts.get(theme) || 0;
      themeCounts.set(theme, currentCount + 1);
    });

    // Sort by count and get top themes
    const sortedThemes = Array.from(themeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme]) => theme);

    return sortedThemes;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) {
      return posts;
    }

    const query = searchQuery.toLowerCase();
    
    // Se começar com @, buscar por usuário
    if (query.startsWith('@')) {
      const username = query.slice(1); // Remove o @
      return posts.filter((post) => {
        const user = users.find(u => u.id === post.userId);
        const userName = user?.name.toLowerCase() || '';
        const userUsername = user?.username?.toLowerCase() || '';
        
        return userName.includes(username) || userUsername.includes(username);
      });
    }
    
    // Caso contrário, buscar por tema/conteúdo
    return posts.filter((post) => {
      const user = users.find(u => u.id === post.userId);
      const userName = user?.name.toLowerCase() || '';
      const caption = post.caption?.toLowerCase() || '';
      const quizTheme = post.quizTheme?.toLowerCase() || '';
      const theme = post.theme?.toLowerCase() || '';

      return (
        userName.includes(query) ||
        caption.includes(query) ||
        quizTheme.includes(query) ||
        theme.includes(query)
      );
    });
  }, [posts, users, searchQuery]);

  const diversifiedPosts = useMemo(() => {
    const result = [];
    let lastUserId: string | null = null;

    for (const post of filteredPosts) {
      if (post.userId !== lastUserId) {
        result.push(post);
        lastUserId = post.userId;
      }
    }

    const remaining = filteredPosts.filter(
      (p) => !result.some((r) => r.id === p.id)
    );

    return [...result, ...remaining];
  }, [filteredPosts]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[420px] mx-auto">
        <Header />

        {/* Search */}
        <div className="px-4 py-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-[73px] z-30 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar publicações ou @usuário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Popular Themes or Users */}
          {!searchQuery.startsWith('@') ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Temas em Alta</p>
              <div className="flex flex-wrap gap-2">
                {popularThemes.length > 0 ? (
                  popularThemes.map((theme) => (
                    <Button
                      key={theme}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(theme)}
                      className="h-7 text-xs capitalize"
                    >
                      {theme}
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhuma publicação ainda</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">
                Buscando por usuário: <span className="font-semibold">{searchQuery}</span>
              </p>
            </div>
          )}
        </div>

        {/* Posts */}
        <main className="px-4 py-4 space-y-4">
          {diversifiedPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhuma publicação encontrada.' : 'Nenhuma publicação ainda.'}
              </p>
            </div>
          ) : (
            diversifiedPosts.map((post) => {
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
