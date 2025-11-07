-- Fix security vulnerabilities in FOCUS system

-- 1. Drop insecure increment functions
DROP FUNCTION IF EXISTS public.increment_focus_donated(uuid, integer);
DROP FUNCTION IF EXISTS public.increment_focus_received(uuid, integer);

-- 2. Create secure FOCUS donation function with proper authorization
CREATE OR REPLACE FUNCTION public.process_focus_donation(
  p_post_id UUID,
  p_recipient_id UUID,
  p_amount INTEGER DEFAULT 2
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_donor_id UUID;
  v_donor_focus INTEGER;
  v_result jsonb;
BEGIN
  -- Get authenticated user
  v_donor_id := auth.uid();
  
  -- Validate donor is authenticated
  IF v_donor_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to donate FOCUS';
  END IF;
  
  -- Prevent self-donation
  IF v_donor_id = p_recipient_id THEN
    RAISE EXCEPTION 'Cannot donate FOCUS to yourself';
  END IF;
  
  -- Validate amount (prevent negative or zero donations)
  IF p_amount <= 0 OR p_amount > 10 THEN
    RAISE EXCEPTION 'Invalid donation amount. Must be between 1 and 10';
  END IF;
  
  -- Verify post exists and belongs to recipient
  IF NOT EXISTS (
    SELECT 1 FROM public.posts 
    WHERE id = p_post_id AND user_id = p_recipient_id
  ) THEN
    RAISE EXCEPTION 'Post not found or does not belong to recipient';
  END IF;
  
  -- Update donor's focus_donated (atomic operation)
  UPDATE public.profiles 
  SET focus_donated = focus_donated + p_amount
  WHERE id = v_donor_id
  RETURNING focus_donated INTO v_donor_focus;
  
  -- Update recipient's total_focus_received (atomic operation)
  UPDATE public.profiles 
  SET total_focus_received = total_focus_received + p_amount
  WHERE id = p_recipient_id;
  
  -- Record the donation
  INSERT INTO public.donations (from_user_id, to_user_id, post_id, amount)
  VALUES (v_donor_id, p_recipient_id, p_post_id, p_amount);
  
  -- Return success with updated values
  v_result := jsonb_build_object(
    'success', true,
    'donor_focus_donated', v_donor_focus,
    'amount', p_amount
  );
  
  RETURN v_result;
END;
$$;

-- 3. Create rate limiting table for actions
CREATE TABLE IF NOT EXISTS public.action_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  last_action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits table
ALTER TABLE public.action_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON public.action_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for efficient rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action 
ON public.action_rate_limits(user_id, action_type, last_action_at);

-- 4. Create rate limiting check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action_type TEXT,
  p_max_actions INTEGER,
  p_time_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_action_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  v_window_start := now() - (p_time_window_seconds || ' seconds')::interval;
  
  -- Count actions in time window
  SELECT COUNT(*) INTO v_action_count
  FROM public.action_rate_limits
  WHERE user_id = v_user_id 
    AND action_type = p_action_type
    AND last_action_at > v_window_start;
  
  -- Check if under limit
  IF v_action_count >= p_max_actions THEN
    RETURN FALSE;
  END IF;
  
  -- Record this action
  INSERT INTO public.action_rate_limits (user_id, action_type, last_action_at)
  VALUES (v_user_id, p_action_type, now());
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.process_focus_donation TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO authenticated;