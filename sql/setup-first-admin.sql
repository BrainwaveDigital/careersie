-- Setup First Admin User
-- This script creates the necessary records for an admin who doesn't go through normal signup

-- INSTRUCTIONS:
-- 1. Login to Supabase Dashboard
-- 2. Go to Authentication > Users
-- 3. Find your user and copy the UUID (e.g., "a1b2c3d4-...")
-- 4. Replace YOUR_AUTH_USER_ID below with that UUID
-- 5. Update the email and name to match your account
-- 6. Run this script in SQL Editor

-- Step 1: Create entry in public.users table (if it doesn't exist)
INSERT INTO public.users (
  id,
  email,
  created_at,
  updated_at
) VALUES (
  '26e988d5-e5b6-4330-9f53-f27439e230bc',  -- Replace with your UUID from auth.users
  'info@brainwavedigital.nz',  -- Replace with your email
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  updated_at = now();

-- Step 2: Create entry in public.profiles table (if it doesn't exist)
INSERT INTO public.profiles (
  user_id,
  full_name,
  email,
  created_at,
  updated_at
) VALUES (
  'YOUR_AUTH_USER_ID',  -- Same UUID as above
  'Your Full Name',  -- Replace with your name
  'your-email@domain.com',  -- Same email as above
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  updated_at = now();

-- Step 3: Create admin entry in app_admins table
INSERT INTO public.app_admins (
  user_id,
  email,
  full_name,
  role,
  access_level,
  permissions,
  is_active,
  created_by,
  created_at,
  updated_at
) VALUES (
  'YOUR_AUTH_USER_ID',  -- Same UUID as above
  'your-email@domain.com',  -- Same email as above
  'Your Full Name',  -- Same name as above
  'super_admin',  -- Super admin role
  5,  -- Highest access level
  ARRAY[
    'manage_users',
    'manage_admins',
    'manage_profiles',
    'delete_profiles',
    'manage_master_data',
    'view_activity_logs',
    'manage_settings',
    'view_personality_assessments',
    'manage_personality_assessments'
  ],
  true,  -- Account is active
  'YOUR_AUTH_USER_ID',  -- Self-created for bootstrap
  now(),
  now()
)
ON CONFLICT (user_id) DO UPDATE
SET
  role = EXCLUDED.role,
  access_level = EXCLUDED.access_level,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verification queries (run these to confirm setup)
-- Check auth.users
-- SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@domain.com';

-- Check public.users
-- SELECT id, email FROM public.users WHERE email = 'your-email@domain.com';

-- Check public.profiles
-- SELECT user_id, full_name, email FROM public.profiles WHERE email = 'your-email@domain.com';

-- Check app_admins
-- SELECT user_id, email, full_name, role, access_level, is_active 
-- FROM public.app_admins WHERE email = 'your-email@domain.com';

-- Success message
SELECT 
  'Setup complete! You can now login at /admin/login with your email and password.' as message;
