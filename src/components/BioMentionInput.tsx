import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ApprovedMention {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface BioMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

export const BioMentionInput = ({
  value,
  onChange,
  placeholder = 'Escreva sua bio...',
  className,
  maxLength = 500,
}: BioMentionInputProps) => {
  const { user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ApprovedMention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getCurrentMention = () => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const match = textBeforeCursor.match(/@(\w*)$/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const currentMention = getCurrentMention();
    
    if (currentMention !== null && user?.id) {
      fetchApprovedMentions(currentMention);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, cursorPosition, user?.id]);

  const fetchApprovedMentions = async (search: string) => {
    if (!user?.id) return;

    try {
      // Get approved bio mention requests
      const { data: approvedRequests, error: requestError } = await supabase
        .from('bio_mention_requests')
        .select('mentioned_user_id')
        .eq('requester_id', user.id)
        .eq('status', 'approved');

      if (requestError) throw requestError;

      if (!approvedRequests || approvedRequests.length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const approvedUserIds = approvedRequests.map(r => r.mentioned_user_id);

      // Fetch user details for approved mentions
      const { data: profiles, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', approvedUserIds);

      if (profileError) throw profileError;

      const filtered = (profiles || []).filter((profile) =>
        profile.username.toLowerCase().includes(search.toLowerCase())
      );

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error fetching approved mentions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const requestBioMention = async (username: string) => {
    if (!user?.id) return;

    try {
      // Get user ID from username
      const { data: profile, error: profileError } = await supabase
        .from('public_profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      // Check if already mutual followers
      const { data: isMutual, error: mutualError } = await supabase.rpc(
        'are_mutual_followers',
        {
          user1_id: user.id,
          user2_id: profile.id,
        }
      );

      if (mutualError) throw mutualError;

      if (!isMutual) {
        toast.error('Vocês precisam se seguir mutuamente');
        return;
      }

      // Create bio mention request
      const { error: insertError } = await supabase
        .from('bio_mention_requests')
        .insert({
          requester_id: user.id,
          mentioned_user_id: profile.id,
        });

      if (insertError) {
        if (insertError.message.includes('unique_bio_mention_request')) {
          toast.info('Pedido já enviado, aguarde aprovação');
        } else {
          throw insertError;
        }
      } else {
        toast.success('Pedido de menção enviado!');
      }
    } catch (error) {
      console.error('Error requesting bio mention:', error);
      toast.error('Erro ao solicitar menção');
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
            <p className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Menções aprovadas
            </p>
            {suggestions.map((mention, index) => (
              <button
                key={mention.id}
                onClick={() => insertMention(mention.username)}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                )}
              >
                <Avatar className="w-8 h-8">
                  {mention.avatar_url ? (
                    <img
                      src={mention.avatar_url}
                      alt={mention.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      {mention.full_name[0]?.toUpperCase()}
                    </div>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {mention.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{mention.username}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Aprovado
                </Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        💡 Para mencionar alguém na bio, ambos precisam se seguir e a pessoa deve aprovar
      </p>
    </div>
  );
};
