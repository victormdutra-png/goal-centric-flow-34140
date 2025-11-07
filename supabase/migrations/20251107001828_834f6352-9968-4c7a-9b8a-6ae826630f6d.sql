-- Fix PII exposure by restricting profiles table access
-- Drop the overly permissive "Anyone can view public profile data" policy
DROP POLICY IF EXISTS "Anyone can view public profile data" ON public.profiles;

-- The "Users can view own full profile" policy already exists and is correct:
-- CREATE POLICY "Users can view own full profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Ensure public_profiles view is available for public data access
-- (The view already exists, this is just a comment for clarity)
-- Users should query public_profiles view for public profile information
-- and profiles table only for their own complete profile data