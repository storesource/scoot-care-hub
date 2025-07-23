-- Drop existing tables that are no longer needed
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.starter_questions CASCADE;

-- Update chat_knowledgebase table
DROP TABLE IF EXISTS public.chat_knowledgebase CASCADE;
CREATE TABLE public.knowledgebase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('qna', 'function')),
  resolution TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on knowledgebase
ALTER TABLE public.knowledgebase ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledgebase
CREATE POLICY "Everyone can read knowledgebase" 
ON public.knowledgebase 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage knowledgebase" 
ON public.knowledgebase 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::text)
WITH CHECK (get_user_role(auth.uid()) = 'admin'::text);

-- Create chat_sessions table
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  chat_blob JSONB DEFAULT '[]'
);

-- Enable RLS on chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_sessions
CREATE POLICY "Users can read own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create support_queries table
CREATE TABLE public.support_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id),
  summary TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on support_queries
ALTER TABLE public.support_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for support_queries
CREATE POLICY "Users can read own support queries" 
ON public.support_queries 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own support queries" 
ON public.support_queries 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all support queries" 
ON public.support_queries 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::text);

CREATE POLICY "Admins can update support queries" 
ON public.support_queries 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::text);

-- Update orders table
DROP TABLE IF EXISTS public.orders CASCADE;
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  order_status TEXT NOT NULL,
  expected_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Users can read own orders" 
ON public.orders 
FOR SELECT 
USING (user_id = auth.uid());