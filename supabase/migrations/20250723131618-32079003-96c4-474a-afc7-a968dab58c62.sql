-- Insert admin user with standardized phone format
INSERT INTO public.users (id, phone, role, created_at) 
VALUES (
  gen_random_uuid(),
  '8806471526',
  'admin',
  now()
) ON CONFLICT (phone) DO NOTHING;