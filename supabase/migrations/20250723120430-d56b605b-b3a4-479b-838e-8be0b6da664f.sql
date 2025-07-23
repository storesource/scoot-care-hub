
-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for chat_messages table
CREATE POLICY "Users can read own messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for faqs table
CREATE POLICY "Anyone can read FAQs" ON public.faqs
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert FAQs" ON public.faqs
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update FAQs" ON public.faqs
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete FAQs" ON public.faqs
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for orders table
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Create storage bucket for chat file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

-- Create storage policy for chat files
CREATE POLICY "Users can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

-- Add sample FAQs for testing
INSERT INTO public.faqs (question, answer, created_by) VALUES
('battery not charging', 'Try checking if the charging cable is properly connected. If the issue persists, please contact our support team.', '00000000-0000-0000-0000-000000000000'),
('scooter not starting', 'Make sure the scooter is charged and the power button is held for 3 seconds. Check if the kickstand is up.', '00000000-0000-0000-0000-000000000000'),
('maximum speed', 'Our scooters can reach up to 25 mph (40 km/h) depending on the model and conditions.', '00000000-0000-0000-0000-000000000000'),
('warranty period', 'All our scooters come with a 2-year warranty covering manufacturing defects.', '00000000-0000-0000-0000-000000000000'),
('order status', 'You can check your order status in the My Orders section or ask me about your specific order.', '00000000-0000-0000-0000-000000000000');

-- Add sample orders for testing
INSERT INTO public.orders (user_id, model, status, expected_delivery_date) VALUES
('00000000-0000-0000-0000-000000000000', 'ScootMax Pro', 'shipped', '2024-01-30'),
('00000000-0000-0000-0000-000000000000', 'ScootLite Urban', 'processing', '2024-02-05'),
('00000000-0000-0000-0000-000000000000', 'ScootMax Elite', 'delivered', '2024-01-20');

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, phone, role)
  VALUES (NEW.id, NEW.phone, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
