-- Run this in Supabase SQL Editor after creating your user to set yourself as Super Admin:
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'ankomahjulius959@gmail.com';

-- Verify your profile:
SELECT id, email, display_name, role FROM public.profiles WHERE email = 'ankomahjulius959@gmail.com';
