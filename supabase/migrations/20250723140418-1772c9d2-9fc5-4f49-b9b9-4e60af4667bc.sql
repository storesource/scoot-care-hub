-- Create starter_questions table
CREATE TABLE public.starter_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  order_hint INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_knowledgebase table
CREATE TABLE public.chat_knowledgebase (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.starter_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_knowledgebase ENABLE ROW LEVEL SECURITY;

-- Policies for starter_questions
CREATE POLICY "Everyone can read starter questions" 
ON public.starter_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage starter questions" 
ON public.starter_questions 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Policies for chat_knowledgebase
CREATE POLICY "Everyone can read knowledge base" 
ON public.chat_knowledgebase 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage knowledge base" 
ON public.chat_knowledgebase 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Create triggers for updated_at
CREATE TRIGGER update_starter_questions_updated_at
BEFORE UPDATE ON public.starter_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_knowledgebase_updated_at
BEFORE UPDATE ON public.chat_knowledgebase
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();