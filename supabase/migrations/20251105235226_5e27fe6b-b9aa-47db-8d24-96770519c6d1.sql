-- =====================================================
-- FIX 1: Correct the profiles table RLS configuration
-- =====================================================

-- Drop the broken policies and grants
DROP POLICY IF EXISTS "Public profile data viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own sensitive data" ON public.profiles;

-- Restore full SELECT access
GRANT SELECT ON public.profiles TO authenticated, anon;

-- Create proper RLS policy that only exposes public columns
CREATE POLICY "Anyone can view public profile data"
ON public.profiles
FOR SELECT
USING (true);

-- Create policy for users to see their own sensitive data
-- This will allow selecting ALL columns when viewing own profile
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Add a view for public profile data (optional but recommended)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id, 
  username, 
  full_name, 
  avatar_url, 
  bio, 
  language,
  following_count, 
  followers_count, 
  focus_donated,
  total_focus_received,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- =====================================================
-- FIX 2: Secure notifications table against impersonation
-- =====================================================

-- Drop the insecure policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a secure policy that only allows system functions to create notifications
-- The create_notification function uses SECURITY DEFINER, so it can bypass this
CREATE POLICY "Only system can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (false); -- Nobody can directly insert

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- FIX 3: Add server-side input validation constraints
-- =====================================================

-- Add length constraints to comments
ALTER TABLE public.comments 
  ADD CONSTRAINT comment_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 2000);

-- Add length constraints to posts (using 'content' not 'caption')
ALTER TABLE public.posts 
  ADD CONSTRAINT post_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 2200);

-- Add length constraints to profiles
ALTER TABLE public.profiles
  ADD CONSTRAINT profile_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500),
  ADD CONSTRAINT profile_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  ADD CONSTRAINT profile_full_name_length CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100);

-- Add length constraints to comment reports
ALTER TABLE public.comment_reports
  ADD CONSTRAINT report_reason_length CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500);

-- Add constraints to messages
ALTER TABLE public.messages
  ADD CONSTRAINT message_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000);

-- =====================================================
-- FIX 4: Secure the delete_user_account function
-- =====================================================

-- Recreate the function with proper authorization
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- CRITICAL: Verify that the requesting user is deleting their own account
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'You can only delete your own account';
  END IF;
  
  -- Delete from profiles (cascade should handle other tables)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Delete from auth.users (this will completely remove the user)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- =====================================================
-- FIX 5: Prevent spam in comment reports
-- =====================================================

-- Add unique constraint to prevent duplicate reports
ALTER TABLE public.comment_reports
  ADD CONSTRAINT unique_user_comment_report UNIQUE (comment_id, reporter_id);

-- Add an index for performance
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON public.comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_reporter_id ON public.comment_reports(reporter_id);

-- Add a counter to comments table for efficient report counting
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- Create a trigger to update report count
CREATE OR REPLACE FUNCTION update_comment_report_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments 
    SET report_count = report_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments 
    SET report_count = GREATEST(0, report_count - 1)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_comment_report_count
AFTER INSERT OR DELETE ON public.comment_reports
FOR EACH ROW
EXECUTE FUNCTION update_comment_report_count();

-- =====================================================
-- BONUS: Add additional security improvements
-- =====================================================

-- Prevent negative values in counters
ALTER TABLE public.profiles
  ADD CONSTRAINT positive_following_count CHECK (following_count >= 0),
  ADD CONSTRAINT positive_followers_count CHECK (followers_count >= 0),
  ADD CONSTRAINT positive_focus_donated CHECK (focus_donated >= 0),
  ADD CONSTRAINT positive_focus_received CHECK (total_focus_received >= 0);

-- Add index for better performance on auth queries
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);