import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MentionTextProps {
  text: string;
  className?: string;
}

export const MentionText = ({ text, className }: MentionTextProps) => {
  // Parse text and identify mentions (@username)
  const parseMentions = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add mention as link (we'll need to fetch user ID in real implementation)
      const username = match[1];
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="text-primary font-medium hover:underline cursor-pointer"
        >
          @{username}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts;
  };

  return (
    <p className={cn('whitespace-pre-wrap break-words', className)}>
      {parseMentions(text)}
    </p>
  );
};
