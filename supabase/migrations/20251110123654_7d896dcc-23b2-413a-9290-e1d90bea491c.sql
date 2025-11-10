-- Allow users to update their own comments
CREATE POLICY "Users can update own comments"
ON public.comments
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow post authors to update comments on their posts (for pinning)
CREATE POLICY "Post authors can update comments on their posts"
ON public.comments
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
    AND posts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
    AND posts.user_id = auth.uid()
  )
);