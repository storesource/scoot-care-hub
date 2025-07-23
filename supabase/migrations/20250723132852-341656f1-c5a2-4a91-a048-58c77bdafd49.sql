-- Allow users to insert their own profile when signing up
CREATE POLICY "Allow user profile creation on signup" 
ON public.users 
FOR INSERT 
WITH CHECK (id = auth.uid());

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', false);

-- Create storage policies for chat files
CREATE POLICY "Users can upload their own chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own chat files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);