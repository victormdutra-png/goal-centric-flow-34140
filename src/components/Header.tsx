import { Link } from 'react-router-dom';
import prumoLogo from '@/assets/prumo-logo.png';

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="px-4 py-4">
        <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80 w-fit">
        <img 
          src={prumoLogo} 
          alt="Prumo Logo" 
          className="w-12 h-12 rounded-xl dark:brightness-[0.8] dark:contrast-[1.2] dark:hue-rotate-[10deg]" 
        />
        </Link>
      </div>
    </header>
  );
};
