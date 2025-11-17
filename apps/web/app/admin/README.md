# Admin System Setup Guide

## Overview

The Careersie admin system provides a separate administrative area for managing users, profiles, master data, and system settings. This is completely separate from the regular user area.

## Admin Access Hierarchy

### Super Admin (Level 5)
- Full system access
- Can create/delete other admins
- Can delete user profiles
- Access all admin features
- Manage master data tables

### Admin (Level 4)
- Can view/manage users
- Can manage most data
- Cannot modify other admins
- Cannot delete profiles (unless super admin grants permission)

### Moderator (Level 2-3)
- Limited access to specific features
- Can view and moderate content
- Cannot access admin management

### Viewer (Level 1)
- Read-only access
- Can view reports and data
- Cannot make changes

## Setup Instructions

### 1. Deploy Admin Table Migration

Run the admin system migration in Supabase:

```sql
-- Run this file in Supabase SQL Editor
sql/migrations/20251117_app_admins_enhanced_up.sql
```

### 2. Create Your First Super Admin

After deploying the migration, create your first super admin user:

```sql
-- First, create a regular user account through the normal signup flow
-- Then run this query with their user_id from auth.users table

INSERT INTO public.app_admins (
  user_id,
  email,
  full_name,
  role,
  access_level,
  permissions,
  is_active,
  created_by
) VALUES (
  'YOUR_USER_ID_HERE',  -- Get this from auth.users table
  'admin@yourdomain.com',
  'System Administrator',
  'super_admin',
  5,
  ARRAY[
    'manage_users',
    'manage_admins',
    'manage_profiles',
    'delete_profiles',
    'manage_master_data',
    'view_activity_logs',
    'manage_settings'
  ],
  true,
  'YOUR_USER_ID_HERE'  -- Same user_id for initial setup
);
```

### 3. Access the Admin Portal

#### Admin Login
Navigate to: **http://localhost:3000/admin/login**

This is separate from the regular user login at `/login`.

#### Features:
- Checks if user has admin privileges
- Verifies account is active
- Checks if account is locked
- Updates last activity timestamp

### 4. Admin Dashboard Features

Once logged in as admin, you'll have access to:

#### `/admin` - Main Dashboard
- Statistics overview (users, profiles, media, assessments)
- Quick access cards to all admin features
- Role-based feature visibility

#### `/admin/users` - User Management
- View all user profiles
- Search by name or email
- View user details
- Delete users (super admin only)

#### `/admin/admins` - Admin Management
- View all administrators
- Create new admins (super admin only)
- Activate/deactivate admins
- Delete admins (super admin only)
- View permissions and roles

#### `/admin/master-data` - Master Data Management
- Manage skill categories
- Manage industries
- Manage job levels
- Manage certifying bodies
- Add/edit/delete master data entries

#### `/admin/activity` - Activity Logs (Coming Soon)
- View system activity
- Track admin actions
- Audit trail

#### `/admin/settings` - System Settings (Coming Soon)
- Configure system settings
- Super admin only

## Security Features

### Authentication Flow
1. User logs in at `/admin/login`
2. System verifies credentials with Supabase Auth
3. Checks if user exists in `app_admins` table using `is_admin()` RPC
4. Verifies account is active and not locked
5. Updates `last_activity_at` timestamp
6. Redirects to admin dashboard

### Access Control
- All admin pages check `is_admin()` RPC on load
- Role-based UI rendering (super admin sees more features)
- RLS policies enforce database-level security
- Separate login/logout from user area

### Account Security
- Account locking support (time-based)
- Two-factor authentication tracking
- Activity logging
- Deactivation audit trail

## Master Data Tables

The system includes management for these master data tables:

1. **skill_categories** - Categories for organizing skills
2. **industries** - Industry classifications
3. **job_levels** - Career level definitions
4. **certifying_bodies** - Organizations that issue certifications

### Creating Master Data Tables

If these tables don't exist yet, create them:

```sql
-- Example for skill_categories
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

-- Users can view
CREATE POLICY "Users can view skill categories"
  ON public.skill_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage
CREATE POLICY "Admins can manage skill categories"
  ON public.skill_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Repeat for other master data tables
```

## API Integration

### Check Admin Status in API Routes

```typescript
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: Request) {
  const { data: { user } } = await supabaseServer.auth.getUser()
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: isAdmin } = await supabaseServer
    .rpc('is_admin', { check_user_id: user.id })

  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Admin-only logic here
  return Response.json({ success: true })
}
```

### Check Specific Permission

```typescript
const { data: hasPermission } = await supabaseServer
  .rpc('has_permission', {
    check_user_id: user.id,
    permission_name: 'delete_profiles'
  })

if (!hasPermission) {
  return Response.json({ error: 'Insufficient permissions' }, { status: 403 })
}
```

## Testing

### Test Admin Login
1. Create a test user at `/login`
2. Get their `user_id` from Supabase Dashboard (Authentication > Users)
3. Run the "Create First Super Admin" SQL with their user_id
4. Logout from user area
5. Go to `/admin/login`
6. Login with same credentials
7. Should see admin dashboard

### Test Role Restrictions
1. Create another admin with `admin` role (not super_admin)
2. Login as that admin
3. Verify they cannot:
   - Access Admin Management page (redirect)
   - Delete users
   - See System Settings

## Troubleshooting

### "Access denied" Error
- Verify user exists in `app_admins` table
- Check `is_active = true`
- Check `account_locked_until` is null or expired
- Verify RLS policies are deployed

### "Bucket not found" Errors
- Not related to admin system
- Refers to media library storage bucket
- See `apps/web/app/media/README.md`

### Cannot Login to Admin Portal
- Verify migrations are deployed
- Check `is_admin()` function exists: `SELECT is_admin()`
- Check user_id is correct in app_admins table
- Clear browser cache/cookies

### Master Data Tables Don't Load
- Tables may not exist yet
- Create them using SQL above
- Ensure admin has permissions

## Production Considerations

1. **Change Default Super Admin**: Update the initial super admin email
2. **Enable 2FA**: Implement two-factor authentication
3. **Rate Limiting**: Add login attempt limits
4. **Audit Logging**: Log all admin actions
5. **Separate Domain**: Consider hosting admin at `admin.yourdomain.com`
6. **SSL Required**: Always use HTTPS in production
7. **Session Timeout**: Implement admin session expiration

## Next Steps

After setting up the admin system:

1. Deploy migrations
2. Create first super admin
3. Test admin login
4. Create additional admins as needed
5. Set up master data tables
6. Configure RLS policies
7. Implement activity logging
8. Add audit trail reporting

## Related Documentation

- Admin RBAC System: `sql/migrations/ADMIN_SYSTEM_README.md`
- Helper Functions: See app_admins migration file
- RLS Policies: See personality assessments policies file
