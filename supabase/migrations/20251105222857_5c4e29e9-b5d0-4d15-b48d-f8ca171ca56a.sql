-- Add pinned field to comments
ALTER TABLE public.comments ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT false;

-- Create comment_reports table for moderation
CREATE TABLE public.comment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  UNIQUE(comment_id, reporter_id)
);

-- Enable RLS on comment_reports
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
ON public.comment_reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.comment_reports
FOR SELECT
USING (auth.uid() = reporter_id);

-- Add index for better performance
CREATE INDEX idx_comment_reports_status ON public.comment_reports(status);
CREATE INDEX idx_comments_pinned ON public.comments(post_id, pinned) WHERE pinned = true;