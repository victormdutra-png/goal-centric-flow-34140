-- Add setting to allow/disallow bio mentions
ALTER TABLE public.profiles
ADD COLUMN allow_bio_mentions BOOLEAN NOT NULL DEFAULT true;

-- Create bio mention requests table
CREATE TABLE public.bio_mention_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Can't request to mention yourself
  CONSTRAINT no_self_bio_mention CHECK (requester_id != mentioned_user_id),
  
  -- Prevent duplicate requests
  CONSTRAINT unique_bio_mention_request UNIQUE (requester_id, mentioned_user_id)
);

-- Enable RLS
ALTER TABLE public.bio_mention_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own requests"
ON public.bio_mention_requests FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = mentioned_user_id);

CREATE POLICY "Users can create bio mention requests"
ON public.bio_mention_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Mentioned users can update request status"
ON public.bio_mention_requests FOR UPDATE
USING (auth.uid() = mentioned_user_id)
WITH CHECK (auth.uid() = mentioned_user_id);

CREATE POLICY "Users can delete their own requests"
ON public.bio_mention_requests FOR DELETE
USING (auth.uid() = requester_id);

-- Create index for faster queries
CREATE INDEX idx_bio_mention_requests_mentioned_user ON public.bio_mention_requests(mentioned_user_id, status);
CREATE INDEX idx_bio_mention_requests_requester ON public.bio_mention_requests(requester_id);

-- Function to check if user is allowed to mention another user in bio
CREATE OR REPLACE FUNCTION public.can_mention_in_bio(requester_id UUID, mentioned_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Must be mutual followers
    public.are_mutual_followers(requester_id, mentioned_user_id)
    AND
    -- Mentioned user must allow bio mentions
    (SELECT allow_bio_mentions FROM public.profiles WHERE id = mentioned_user_id)
    AND
    -- Must have an approved request
    EXISTS (
      SELECT 1 FROM public.bio_mention_requests 
      WHERE requester_id = requester_id 
      AND mentioned_user_id = mentioned_user_id 
      AND status = 'approved'
    );
$$;

-- Trigger function to create notification when bio mention is requested
CREATE OR REPLACE FUNCTION public.notify_on_bio_mention_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester_username TEXT;
BEGIN
  -- Only notify on new requests
  IF TG_OP = 'INSERT' THEN
    -- Get requester username
    SELECT username INTO v_requester_username 
    FROM public.profiles 
    WHERE id = NEW.requester_id;
    
    -- Create notification
    PERFORM create_notification(
      NEW.mentioned_user_id,
      'bio_mention_request',
      NEW.requester_id,
      v_requester_username || ' quer te mencionar na bio dele'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_bio_mention_request_created
  AFTER INSERT ON public.bio_mention_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_bio_mention_request();

-- Trigger function to notify when request is approved
CREATE OR REPLACE FUNCTION public.notify_on_bio_mention_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approver_username TEXT;
BEGIN
  -- Only notify on status change to approved
  IF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
    -- Get approver username
    SELECT username INTO v_approver_username 
    FROM public.profiles 
    WHERE id = NEW.mentioned_user_id;
    
    -- Create notification
    PERFORM create_notification(
      NEW.requester_id,
      'bio_mention_approved',
      NEW.mentioned_user_id,
      v_approver_username || ' aprovou sua menção na bio'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_bio_mention_approved
  AFTER UPDATE ON public.bio_mention_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_bio_mention_approved();