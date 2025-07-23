-- Update admin user phone number to match the international format expected by Supabase Auth
UPDATE public.users 
SET phone = '+918806471526' 
WHERE phone = '8806471526' AND role = 'admin';