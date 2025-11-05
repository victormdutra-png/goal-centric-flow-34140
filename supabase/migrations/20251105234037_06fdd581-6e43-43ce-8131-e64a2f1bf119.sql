-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create policy for viewing public profile data (everyone can see basic info)
CREATE POLICY "Public profile data viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Grant SELECT on only non-sensitive columns to everyone
-- Revoke default SELECT grant first
REVOKE SELECT ON public.profiles FROM public, authenticated, anon;

-- Grant SELECT only on public columns
GRANT SELECT (id, username, full_name, avatar_url, bio, language, 
              following_count, followers_count, focus_donated, 
              total_focus_received, created_at, updated_at) 
ON public.profiles TO authenticated, anon;

-- Create policy for users to view their own sensitive data
CREATE POLICY "Users can view own sensitive data"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Grant full SELECT to users for their own records
GRANT SELECT ON public.profiles TO authenticated;