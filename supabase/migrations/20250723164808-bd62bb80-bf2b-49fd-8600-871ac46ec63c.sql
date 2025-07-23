-- Add admin access policy for chat_sessions
CREATE POLICY "Admins can read all chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- Add admin access policy for updating chat_sessions
CREATE POLICY "Admins can update all chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin');