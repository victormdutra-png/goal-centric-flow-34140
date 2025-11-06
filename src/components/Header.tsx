import { Link } from 'react-router-dom';
import prumoLogoDark from '@/assets/prumo-logo-dark.png';
import prumoLogoLight from '@/assets/prumo-logo-light.png';
import { NotificationBell } from './NotificationBell';
import { useAppStore } from '@/store/useAppStore';

export const Header = () => {
  const { isDarkMode } = useAppStore();
  
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 py-4 flex items-center justify-between">
        <Link to="/feed" className="flex items-center gap-3 transition-opacity hover:opacity-80 w-fit">
          <img 
            src={isDarkMode ? prumoLogoLight : prumoLogoDark} 
            alt="Prumo Logo" 
            className="w-12 h-12 rounded-xl" 
          />
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
};
