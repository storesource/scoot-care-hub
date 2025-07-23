-- Fix RLS issues by ensuring all tables have RLS enabled and drop duplicate policies

-- Drop any duplicate policies first
DROP POLICY IF EXISTS "Admins can insert FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can update FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Admins can delete FAQs" ON public.faqs;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Recreate FAQ admin policies with correct function reference
CREATE POLICY "Admins can insert FAQs" ON public.faqs
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update FAQs" ON public.faqs
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete FAQs" ON public.faqs
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');