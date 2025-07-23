-- Fix storage bucket visibility and policies
UPDATE storage.buckets SET public = true WHERE id = 'chat-files';

-- Remove existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own chat files" ON storage.objects;

-- Create more permissive policies for chat files
CREATE POLICY "Anyone can view chat files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files');

CREATE POLICY "Authenticated users can upload chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);