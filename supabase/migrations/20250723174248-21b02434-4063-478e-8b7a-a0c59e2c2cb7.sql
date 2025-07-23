-- Add TTL functionality to chat sessions
ALTER TABLE public.chat_sessions ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '30 days');

-- Create index for efficient cleanup of expired sessions
CREATE INDEX idx_chat_sessions_expires_at ON public.chat_sessions(expires_at);

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chat_sessions WHERE expires_at < now();
END;
$$;