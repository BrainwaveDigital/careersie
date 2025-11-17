-- Personality Assessments Table with Enhanced Admin Policies
-- This assumes you've already created the personality_assessments table
-- This file only adds/updates the RLS policies to work with the enhanced app_admins table
-- NOTE: The profiles table uses 'id' as the primary key, not 'profile_id'

-- Enable RLS on personality_assessments (if not already enabled)
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view all assessments" ON personality_assessments;

-- Policy: Users can view their own assessments
CREATE POLICY "Users can view own assessments"
  ON personality_assessments
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own assessments
CREATE POLICY "Users can insert own assessments"
  ON personality_assessments
  FOR INSERT
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own assessments
CREATE POLICY "Users can update own assessments"
  ON personality_assessments
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Super admins have full access to all assessments
CREATE POLICY "Super admins have full access to assessments"
  ON personality_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
  );

-- Policy: Admins with specific permission can view all assessments
CREATE POLICY "Admins can view assessments with permission"
  ON personality_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
        AND is_active = true
        AND (
          role IN ('admin', 'super_admin') OR
          'view_personality_assessments' = ANY(permissions)
        )
    )
  );

-- Policy: Admins with specific permission can manage assessments
CREATE POLICY "Admins can manage assessments with permission"
  ON personality_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
        AND is_active = true
        AND (
          role = 'super_admin' OR
          'manage_personality_assessments' = ANY(permissions)
        )
    )
  );

-- Policy: Only super admins can delete assessments
CREATE POLICY "Super admins can delete assessments"
  ON personality_assessments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
  );

-- Example: How to grant a user admin access with specific permissions
-- INSERT INTO public.app_admins (
--   user_id,
--   email,
--   full_name,
--   role,
--   permissions,
--   access_level,
--   department,
--   is_active
-- ) VALUES (
--   'user-uuid-here',
--   'admin@example.com',
--   'Admin Name',
--   'admin',
--   ARRAY['view_personality_assessments', 'manage_personality_assessments', 'view_analytics'],
--   4,
--   'HR',
--   true
-- );

-- Example: How to make someone a super admin
-- INSERT INTO public.app_admins (
--   user_id,
--   email,
--   full_name,
--   role,
--   access_level,
--   is_active
-- ) VALUES (
--   'user-uuid-here',
--   'superadmin@example.com',
--   'Super Admin Name',
--   'super_admin',
--   5,
--   true
-- );

COMMENT ON POLICY "Super admins have full access to assessments" ON personality_assessments IS 
  'Super admins can perform all operations on personality assessments';
COMMENT ON POLICY "Admins can view assessments with permission" ON personality_assessments IS 
  'Admins with view_personality_assessments permission can read all assessments';
COMMENT ON POLICY "Admins can manage assessments with permission" ON personality_assessments IS 
  'Admins with manage_personality_assessments permission can update assessments';
