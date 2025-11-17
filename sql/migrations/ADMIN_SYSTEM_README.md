# Enhanced App Admins System

## Overview
The enhanced `app_admins` table provides a robust Role-Based Access Control (RBAC) system for managing application administrators with granular permissions, audit logging, and security features.

## Setup

### 1. Run the Migration
```sql
-- In Supabase SQL Editor, run:
sql/migrations/20251117_app_admins_enhanced_up.sql
```

### 2. Apply Personality Assessment Policies (if you have personality_assessments table)
```sql
sql/migrations/20251117_personality_assessments_admin_policies.sql
```

## Admin Roles

### Role Hierarchy
1. **super_admin** (Access Level 5)
   - Full access to everything
   - Can manage all admins including other super admins
   - Cannot be modified by regular admins
   - Best for: System owners, technical leads

2. **admin** (Access Level 4)
   - Can manage users, content, and most features
   - Can view all admins but cannot modify super admins
   - Requires specific permissions for sensitive operations
   - Best for: Operations managers, HR

3. **moderator** (Access Level 2-3)
   - Can moderate content and user reports
   - Limited management capabilities
   - Best for: Content moderators, support staff

4. **viewer** (Access Level 1)
   - Read-only access to admin dashboard
   - Can view analytics and reports
   - Best for: Stakeholders, auditors

## Permissions System

### Granular Permissions
The system supports fine-grained permissions stored in the `permissions` array:

**Common Permissions:**
- `manage_users` - Create, update, delete users
- `manage_profiles` - Manage user profiles
- `manage_content` - Manage application content
- `view_analytics` - Access analytics dashboard
- `manage_settings` - Change application settings
- `delete_users` - Permanently delete users
- `export_data` - Export user data
- `manage_media` - Access media library admin
- `view_personality_assessments` - View all personality assessments
- `manage_personality_assessments` - Edit personality assessments
- `view_audit_logs` - Access audit logs
- `manage_roles` - Manage admin roles

### Permission Inheritance
- **super_admin**: Has ALL permissions automatically
- Other roles: Must explicitly grant permissions

## Creating Admins

### Create a Super Admin
```sql
INSERT INTO public.app_admins (
  user_id,
  email,
  full_name,
  role,
  access_level,
  is_active
) VALUES (
  'auth-user-uuid-here',
  'superadmin@example.com',
  'John Doe',
  'super_admin',
  5,
  true
);
```

### Create an Admin with Specific Permissions
```sql
INSERT INTO public.app_admins (
  user_id,
  email,
  full_name,
  role,
  permissions,
  access_level,
  department,
  allowed_actions,
  is_active
) VALUES (
  'auth-user-uuid-here',
  'hr.admin@example.com',
  'Jane Smith',
  'admin',
  ARRAY[
    'manage_users',
    'view_personality_assessments',
    'manage_personality_assessments',
    'view_analytics'
  ],
  4,
  'HR',
  ARRAY['approve_applications', 'send_notifications'],
  true
);
```

### Create a Moderator
```sql
INSERT INTO public.app_admins (
  user_id,
  email,
  full_name,
  role,
  permissions,
  access_level,
  department,
  is_active
) VALUES (
  'auth-user-uuid-here',
  'moderator@example.com',
  'Mike Johnson',
  'moderator',
  ARRAY['manage_content', 'manage_media'],
  2,
  'Operations',
  true
);
```

## Helper Functions

### Check if User is Admin
```sql
-- In RLS policies or application logic
SELECT is_admin(); -- Returns true/false for current user
SELECT is_admin('user-uuid'); -- Check specific user
```

### Check if User is Super Admin
```sql
SELECT is_super_admin(); -- Returns true/false
```

### Check Specific Permission
```sql
SELECT has_permission('manage_users'); -- For current user
SELECT has_permission('view_analytics', 'user-uuid'); -- For specific user
```

### Get Access Level
```sql
SELECT get_admin_access_level(); -- Returns 0-5
```

## Using in RLS Policies

### Example: Only Admins Can Access Table
```sql
CREATE POLICY "Admins only"
  ON some_table
  FOR ALL
  USING (is_admin());
```

### Example: Require Specific Permission
```sql
CREATE POLICY "Manage users permission required"
  ON users
  FOR UPDATE
  USING (has_permission('manage_users'));
```

### Example: Access Level Based
```sql
CREATE POLICY "Level 3+ admins"
  ON sensitive_table
  FOR SELECT
  USING (get_admin_access_level() >= 3);
```

### Example: Super Admin Only
```sql
CREATE POLICY "Super admin only"
  ON critical_table
  FOR ALL
  USING (is_super_admin());
```

## Security Features

### Account Locking
Accounts can be locked after failed login attempts:
```sql
UPDATE public.app_admins
SET 
  account_locked_until = now() + interval '30 minutes',
  failed_login_attempts = 3
WHERE user_id = 'user-uuid';
```

### Deactivate Admin
```sql
UPDATE public.app_admins
SET 
  is_active = false,
  deactivated_at = now(),
  deactivated_by = auth.uid(),
  deactivation_reason = 'Policy violation'
WHERE user_id = 'user-uuid';
```

### Force Password Change
```sql
UPDATE public.app_admins
SET must_change_password = true
WHERE user_id = 'user-uuid';
```

## Audit Trail

### Track Admin Activity
The table includes comprehensive audit fields:
- `created_by` - Who created this admin
- `created_at` - When created
- `updated_by` - Who last updated
- `updated_at` - When last updated
- `last_login_at` - Last login time
- `last_activity_at` - Last activity time
- `login_count` - Total logins

### Query Active Admins
```sql
SELECT 
  full_name,
  email,
  role,
  department,
  last_activity_at,
  login_count
FROM public.app_admins
WHERE is_active = true
ORDER BY last_activity_at DESC;
```

### Query by Permission
```sql
SELECT 
  full_name,
  email,
  role,
  permissions
FROM public.app_admins
WHERE 'manage_users' = ANY(permissions)
  AND is_active = true;
```

## Integration with Application

### Client-Side Check (TypeScript)
```typescript
// Check if current user is admin
const { data: isAdmin } = await supabaseClient
  .rpc('is_admin')

if (isAdmin) {
  // Show admin features
}

// Check specific permission
const { data: canManageUsers } = await supabaseClient
  .rpc('has_permission', { permission_name: 'manage_users' })

if (canManageUsers) {
  // Allow user management
}
```

### API Route Protection
```typescript
// In Next.js API route
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: Request) {
  const { data: isAdmin } = await supabaseServer.rpc('is_admin')
  
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Admin-only logic here
}
```

## Best Practices

1. **Principle of Least Privilege**: Only grant permissions users actually need
2. **Regular Audits**: Review admin list and permissions quarterly
3. **Deactivate, Don't Delete**: Deactivate admins instead of deleting for audit trail
4. **Two-Factor Authentication**: Enable for all admins (track with `two_factor_enabled`)
5. **Monitor Activity**: Track `last_activity_at` to identify inactive accounts
6. **Rotate Credentials**: Use `must_change_password` for periodic password changes
7. **Document Changes**: Use `notes` field to document why permissions were granted

## Troubleshooting

### Admin Can't Access Feature
1. Check if admin is active: `is_active = true`
2. Check if account is locked: `account_locked_until IS NULL OR account_locked_until < now()`
3. Verify role: `role IN ('admin', 'super_admin')`
4. Check specific permission exists in `permissions` array
5. Verify access level is sufficient

### Creating First Super Admin
If you don't have any admins yet:
```sql
-- Insert directly (run as database owner)
INSERT INTO public.app_admins (
  user_id,
  email,
  full_name,
  role,
  access_level,
  is_active
)
SELECT 
  id,
  email,
  email, -- Use email as name temporarily
  'super_admin',
  5,
  true
FROM auth.users
WHERE email = 'your-email@example.com'
LIMIT 1;
```

## Rollback

To remove the enhanced admin system:
```sql
sql/migrations/20251117_app_admins_enhanced_down.sql
```

**WARNING**: This will delete ALL admin data!
