-- Rollback migration for enhanced app_admins table

-- Drop helper functions
DROP FUNCTION IF EXISTS get_admin_access_level(UUID);
DROP FUNCTION IF EXISTS has_permission(TEXT, UUID);
DROP FUNCTION IF EXISTS is_super_admin(UUID);
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_app_admins_updated_at ON public.app_admins;
DROP FUNCTION IF EXISTS update_app_admins_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Users can view own admin record" ON public.app_admins;
DROP POLICY IF EXISTS "Admins can update non-super-admins" ON public.app_admins;
DROP POLICY IF EXISTS "Admins can view all admins" ON public.app_admins;
DROP POLICY IF EXISTS "Super admins have full access" ON public.app_admins;

-- Drop indexes
DROP INDEX IF EXISTS idx_app_admins_last_activity;
DROP INDEX IF EXISTS idx_app_admins_email;
DROP INDEX IF EXISTS idx_app_admins_is_active;
DROP INDEX IF EXISTS idx_app_admins_role;
DROP INDEX IF EXISTS idx_app_admins_user_id;

-- Drop table (WARNING: This will delete all admin data)
DROP TABLE IF EXISTS public.app_admins CASCADE;
