-- Fix the security definer view issue
-- Drop and recreate the view with security_invoker=on
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker=on)
AS
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