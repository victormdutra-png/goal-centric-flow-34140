-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow')),
  from_user_id UUID NOT NULL,
  post_id UUID,
  comment_id UUID,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_from_user_id UUID,
  p_message TEXT,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't create notification if user is notifying themselves
  IF p_user_id = p_from_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (user_id, type, from_user_id, post_id, comment_id, message)
  VALUES (p_user_id, p_type, p_from_user_id, p_post_id, p_comment_id, p_message)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger function for like notifications
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id UUID;
  v_liker_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Get liker username
  SELECT username INTO v_liker_username FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  PERFORM create_notification(
    v_post_owner_id,
    'like',
    NEW.user_id,
    v_liker_username || ' curtiu sua publicação',
    NEW.post_id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for comment notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner_id UUID;
  v_commenter_username TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Get commenter username
  SELECT username INTO v_commenter_username FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  PERFORM create_notification(
    v_post_owner_id,
    'comment',
    NEW.user_id,
    v_commenter_username || ' comentou em sua publicação',
    NEW.post_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for follow notifications
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_follower_username TEXT;
BEGIN
  -- Get follower username
  SELECT username INTO v_follower_username FROM public.profiles WHERE id = NEW.follower_id;
  
  -- Create notification
  PERFORM create_notification(
    NEW.following_id,
    'follow',
    NEW.follower_id,
    v_follower_username || ' começou a seguir você'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_like_created
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();

CREATE TRIGGER on_comment_created
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

CREATE TRIGGER on_follow_created
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_follow();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;