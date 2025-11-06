import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MutualFollower {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export const MentionInput = ({
  value,
  onChange,
  placeholder = 'Escreva algo...',
  className,
  maxLength,
}: MentionInputProps) => {
  const { user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MutualFollower[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract current mention being typed
  const getCurrentMention = () => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);
    return match ? match[1] : null;
  };

  // Fetch mutual followers when @ is typed
  useEffect(() => {
    const currentMention = getCurrentMention();
    
    if (currentMention !== null && user?.id) {
      fetchMutualFollowers(currentMention);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, cursorPosition, user?.id]);

  const fetchMutualFollowers = async (search: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_mutual_followers', {
        user_id: user.id,
      });

      if (error) throw error;

      const filtered = (data || []).filter((follower: MutualFollower) =>
        follower.username.toLowerCase().includes(search.toLowerCase())
      );

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error fetching mutual followers:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const insertMention = (username: string) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    
    const newValue =
      textBeforeCursor.substring(0, mentionStart) +
      `@${username} ` +
      textAfterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Set cursor position after the mention
    setTimeout(() => {
      const newPosition = mentionStart + username.length + 2;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
      textareaRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertMention(suggestions[selectedIndex].username);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          setCursorPosition(target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('resize-none', className)}
        maxLength={maxLength}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute bottom-full left-0 right-0 mb-2 max-h-60 overflow-y-auto z-50">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-2 py-1">
              Seguidores mútuos
            </p>
            {suggestions.map((follower, index) => (
              <button
                key={follower.id}
                onClick={() => insertMention(follower.username)}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                )}
              >
                <Avatar className="w-8 h-8">
                  {follower.avatar_url ? (
                    <img
                      src={follower.avatar_url}
                      alt={follower.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      {follower.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {follower.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{follower.username}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
