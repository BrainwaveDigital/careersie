-- Migration: Add user profile columns to public.users table
-- Date: 2025-11-14

-- Add columns to public.users table if they don't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user', -- user|admin|recruiter
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (lower(email));

-- Add RLS policies if they don't exist
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "users_owner_or_admin_full_access" ON public.users;

-- Users can view their own data
CREATE POLICY "users_own_data" ON public.users
  FOR ALL
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid()))
  WITH CHECK (id = auth.uid() OR EXISTS (SELECT 1 FROM public.app_admins a WHERE a.user_id = auth.uid()));

-- Create a trigger to sync user data from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TABLE public.users IS 'Extended user information synced from auth.users';
