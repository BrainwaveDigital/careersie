-- Quick Setup Script for Testing Stories Feature
-- Run this in Supabase SQL Editor AFTER running the main migration
-- Replace YOUR_USER_ID with your actual auth.users.id

-- 1. Create profile (if not exists)
INSERT INTO public.profiles (user_id, full_name, email)
VALUES (
  '26e988d5-e5b6-4330-9f53-f27439e230bc', -- Replace with your auth user ID
  'Zak Bacon',
  'info@brainwavedigital.nz'
)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Create test experience
INSERT INTO public.experiences (profile_id, title, company, start_date, end_date, is_current, description)
SELECT 
  id,
  'Senior Software Engineer',
  'Acme Corp',
  '2020-01-01',
  '2023-12-31',
  false,
  'Led engineering initiatives and built scalable systems'
FROM public.profiles
WHERE user_id = '26e988d5-e5b6-4330-9f53-f27439e230bc';

-- 3. Create test skills
INSERT INTO public.skills (profile_id, skill)
SELECT id, 'React' FROM public.profiles WHERE user_id = '26e988d5-e5b6-4330-9f53-f27439e230bc'
UNION ALL
SELECT id, 'Node.js' FROM public.profiles WHERE user_id = '26e988d5-e5b6-4330-9f53-f27439e230bc'
UNION ALL
SELECT id, 'TypeScript' FROM public.profiles WHERE user_id = '26e988d5-e5b6-4330-9f53-f27439e230bc';

-- 4. Get the Experience ID for testing
SELECT 
  e.id as experience_id,
  e.title,
  e.company,
  p.full_name
FROM public.experiences e
JOIN public.profiles p ON p.id = e.profile_id
WHERE p.user_id = '26e988d5-e5b6-4330-9f53-f27439e230bc';

-- Copy the experience_id from the results above and use it in the test page!
