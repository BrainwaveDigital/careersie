-- Enhanced App Admins Table
-- Provides robust role-based access control (RBAC) for application administrators
-- Supports multiple roles, permissions, and audit logging

-- Drop existing table if you want to recreate (BE CAREFUL - this deletes data)
-- DROP TABLE IF EXISTS public.app_admins CASCADE;

CREATE TABLE IF NOT EXISTS public.app_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Role and permissions
  role TEXT NOT NULL DEFAULT 'viewer', -- 'super_admin', 'admin', 'moderator', 'viewer'
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[], -- Granular permissions array
  
  -- Status and metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  email TEXT NOT NULL, -- Denormalized for quick lookup
  full_name TEXT,
  department TEXT, -- e.g., 'HR', 'IT', 'Operations'
  
  -- Access control
  access_level INTEGER NOT NULL DEFAULT 1, -- 1=limited, 5=full access
  allowed_actions TEXT[] DEFAULT ARRAY[]::TEXT[], -- Specific allowed actions
  restricted_actions TEXT[] DEFAULT ARRAY[]::TEXT[], -- Explicitly denied actions
  
  -- Session and security
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMPTZ,
  must_change_password BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  
  -- Audit fields
  created_by UUID REFERENCES public.app_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.app_admins(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES public.app_admins(id) ON DELETE SET NULL,
  deactivation_reason TEXT,
  
  -- Metadata
  notes TEXT, -- Internal notes about this admin
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible field for additional data
  
  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
  CONSTRAINT valid_access_level CHECK (access_level BETWEEN 1 AND 5),
  CONSTRAINT unique_user_admin UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_admins_user_id ON public.app_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_app_admins_role ON public.app_admins(role);
CREATE INDEX IF NOT EXISTS idx_app_admins_is_active ON public.app_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_app_admins_email ON public.app_admins(email);
CREATE INDEX IF NOT EXISTS idx_app_admins_last_activity ON public.app_admins(last_activity_at DESC);

-- Enable Row Level Security
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admins can do everything
CREATE POLICY "Super admins have full access"
  ON public.app_admins
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
        AND is_active = true
    )
  );

-- Admins can view all admins but only update non-super-admins
CREATE POLICY "Admins can view all admins"
  ON public.app_admins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND is_active = true
    )
  );

CREATE POLICY "Admins can update non-super-admins"
  ON public.app_admins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.app_admins a
      WHERE a.user_id = auth.uid()
        AND a.role IN ('admin', 'super_admin')
        AND a.is_active = true
    )
    AND role != 'super_admin' -- Cannot modify super admins
  );

-- Users can view their own admin record
CREATE POLICY "Users can view own admin record"
  ON public.app_admins
  FOR SELECT
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_app_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_app_admins_updated_at
  BEFORE UPDATE ON public.app_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_app_admins_updated_at();

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE user_id = check_user_id
      AND is_active = true
      AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE user_id = check_user_id
      AND is_active = true
      AND role = 'super_admin'
  );
END;
$$;

-- Helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(permission_name TEXT, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE user_id = check_user_id
      AND is_active = true
      AND (
        role = 'super_admin' OR
        permission_name = ANY(permissions)
      )
  );
END;
$$;

-- Helper function to get admin access level
CREATE OR REPLACE FUNCTION get_admin_access_level(check_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  level INTEGER;
BEGIN
  SELECT access_level INTO level
  FROM public.app_admins
  WHERE user_id = check_user_id
    AND is_active = true;
  
  RETURN COALESCE(level, 0);
END;
$$;

-- Grant permissions
GRANT SELECT ON public.app_admins TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_admins TO authenticated;

-- Comments
COMMENT ON TABLE public.app_admins IS 'Application administrators with role-based access control';
COMMENT ON COLUMN public.app_admins.role IS 'Admin role: super_admin (full access), admin (manage users/content), moderator (moderate content), viewer (read-only)';
COMMENT ON COLUMN public.app_admins.permissions IS 'Array of specific permissions: manage_users, manage_content, view_analytics, manage_settings, etc.';
COMMENT ON COLUMN public.app_admins.access_level IS 'Numeric access level from 1 (limited) to 5 (full access)';
COMMENT ON COLUMN public.app_admins.allowed_actions IS 'Whitelist of specific actions this admin can perform';
COMMENT ON COLUMN public.app_admins.restricted_actions IS 'Blacklist of actions this admin cannot perform';

-- Example permissions you might use:
-- 'manage_users', 'manage_profiles', 'manage_content', 'view_analytics', 
-- 'manage_settings', 'delete_users', 'export_data', 'manage_media',
-- 'view_personality_assessments', 'manage_personality_assessments',
-- 'view_audit_logs', 'manage_roles'
