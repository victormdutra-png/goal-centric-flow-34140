-- Create mentions table
CREATE TABLE public.mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentioned_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Either post_id or comment_id must be set, but not both
  CONSTRAINT mention_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  
  -- Can't mention yourself
  CONSTRAINT no_self_mention CHECK (mentioned_user_id != mentioned_by_user_id),
  
  -- Prevent duplicate mentions in same post/comment
  CONSTRAINT unique_mention UNIQUE (post_id, comment_id, mentioned_user_id, mentioned_by_user_id)
);

-- Enable RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Mentions are viewable by everyone"
ON public.mentions FOR SELECT
USING (true);

CREATE POLICY "Users can create mentions"
ON public.mentions FOR INSERT
WITH CHECK (auth.uid() = mentioned_by_user_id);

CREATE POLICY "Users can delete their own mentions"
ON public.mentions FOR DELETE
USING (auth.uid() = mentioned_by_user_id);

-- Create index for faster queries
CREATE INDEX idx_mentions_mentioned_user ON public.mentions(mentioned_user_id);
CREATE INDEX idx_mentions_post ON public.mentions(post_id);
CREATE INDEX idx_mentions_comment ON public.mentions(comment_id);

-- Function to check if two users are mutual followers
CREATE OR REPLACE FUNCTION public.are_mutual_followers(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = user1_id AND following_id = user2_id
  ) AND EXISTS (
    SELECT 1 FROM public.follows 
    WHERE follower_id = user2_id AND following_id = user1_id
  );
$$;

-- Function to get mutual followers for a user
CREATE OR REPLACE FUNCTION public.get_mutual_followers(user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.id, p.username, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id IN (
    -- Users that follow the given user AND are followed back
    SELECT f1.follower_id
    FROM public.follows f1
    WHERE f1.following_id = user_id
    AND EXISTS (
      SELECT 1 FROM public.follows f2
      WHERE f2.follower_id = user_id AND f2.following_id = f1.follower_id
    )
  )
  ORDER BY p.username;
$$;

-- Trigger function to create notification when user is mentioned
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mentioner_username TEXT;
  v_message TEXT;
BEGIN
  -- Get mentioner username
  SELECT username INTO v_mentioner_username 
  FROM public.profiles 
  WHERE id = NEW.mentioned_by_user_id;
  
  -- Create notification message
  IF NEW.post_id IS NOT NULL THEN
    v_message := v_mentioner_username || ' mencionou você em uma publicação';
  ELSE
    v_message := v_mentioner_username || ' mencionou você em um comentário';
  END IF;
  
  -- Create notification
  PERFORM create_notification(
    NEW.mentioned_user_id,
    'mention',
    NEW.mentioned_by_user_id,
    v_message,
    NEW.post_id,
    NEW.comment_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_mention_created
  AFTER INSERT ON public.mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mention();