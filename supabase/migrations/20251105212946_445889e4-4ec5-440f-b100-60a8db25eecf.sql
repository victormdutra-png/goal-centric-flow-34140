-- Add case-insensitive unique indexes for username, email, and phone
-- First, remove any existing unique constraints that are case-sensitive
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Create case-insensitive unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx ON public.profiles (phone);

-- Update the username column to be NOT NULL with a unique constraint (case-sensitive stored but unique case-insensitive via index)
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

-- Add function to completely delete user account
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete from profiles (cascade should handle other tables)
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Delete from auth.users (this will completely remove the user)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;