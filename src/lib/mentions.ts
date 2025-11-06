import { supabase } from '@/integrations/supabase/client';

/**
 * Extract mentions from text (@username format)
 */
export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Validate and get user IDs for mentioned usernames
 * Returns only users that are mutual followers
 */
export const validateMentions = async (
  usernames: string[],
  currentUserId: string
): Promise<string[]> => {
  if (usernames.length === 0) return [];

  try {
    // Get user IDs for these usernames
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', usernames);

    if (profileError) throw profileError;
    if (!profiles || profiles.length === 0) return [];

    // Validate mutual following for each user
    const validUserIds: string[] = [];

    for (const profile of profiles) {
      const { data: isMutual, error: mutualError } = await supabase.rpc(
        'are_mutual_followers',
        {
          user1_id: currentUserId,
          user2_id: profile.id,
        }
      );

      if (!mutualError && isMutual) {
        validUserIds.push(profile.id);
      }
    }

    return validUserIds;
  } catch (error) {
    console.error('Error validating mentions:', error);
    return [];
  }
};

/**
 * Create mention records in database
 */
export const createMentions = async (
  mentionedUserIds: string[],
  currentUserId: string,
  postId?: string,
  commentId?: string
): Promise<void> => {
  if (mentionedUserIds.length === 0) return;

  try {
    const mentions = mentionedUserIds.map((userId) => ({
      mentioned_user_id: userId,
      mentioned_by_user_id: currentUserId,
      post_id: postId || null,
      comment_id: commentId || null,
    }));

    const { error } = await supabase.from('mentions').insert(mentions);

    if (error) {
      // Ignore duplicate mention errors
      if (!error.message.includes('unique_mention')) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating mentions:', error);
  }
};

/**
 * Process text to create mentions
 * Extracts usernames, validates them, and creates mention records
 */
export const processMentions = async (
  text: string,
  currentUserId: string,
  postId?: string,
  commentId?: string
): Promise<void> => {
  const usernames = extractMentions(text);
  const validUserIds = await validateMentions(usernames, currentUserId);
  await createMentions(validUserIds, currentUserId, postId, commentId);
};
