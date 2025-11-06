-- Create function to increment focus_donated
CREATE OR REPLACE FUNCTION public.increment_focus_donated(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET focus_donated = focus_donated + amount
  WHERE id = user_id;
END;
$$;

-- Create function to increment total_focus_received
CREATE OR REPLACE FUNCTION public.increment_focus_received(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET total_focus_received = total_focus_received + amount
  WHERE id = user_id;
END;
$$;