-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.chat_sessions WHERE expires_at < now();
END;
$$;