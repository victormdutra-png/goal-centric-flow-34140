import { useAppStore } from '@/store/useAppStore';
import { PostCard } from '@/components/PostCard';
import { Header } from '@/components/Header';

export default function Feed() {
  const { posts, users } = useAppStore();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-[420px] mx-auto">
        <Header />

        {/* Feed */}
        <main className="px-4 py-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
            </div>
          ) : (
            posts.map((post) => {
              const user = users.find((u) => u.id === post.userId)!;
              return <PostCard key={post.id} post={post} user={user} />;
            })
          )}
        </main>
      </div>
    </div>
  );
}
