import { Home, Compass, PlusCircle, Target, User, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function TabBar() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const tabs = [
    { path: '/feed', icon: Home, label: t('feed') },
    { path: '/explorar', icon: Compass, label: t('explore') },
    { path: '/nova', icon: PlusCircle, label: t('new_post') },
    { path: '/chat', icon: MessageCircle, label: t('messages') },
    { path: '/metas', icon: Target, label: t('goals') },
    { path: `/perfil-@${profile?.username || 'usuario'}`, icon: User, label: t('profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="max-w-[420px] mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
