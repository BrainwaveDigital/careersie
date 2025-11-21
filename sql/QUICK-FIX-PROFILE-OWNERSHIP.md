# QUICK FIX: Profile Ownership Issue

## Your Error
```
POST /rest/v1/skills 403 (Forbidden)
new row violates row-level security policy for table "skills"
```

## Your Details
- **Profile ID**: `ff3fc7d1-85de-40e3-9958-8fb361810c95`
- **User ID**: `ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892`
- **Problem**: RLS blocking skill inserts (profile ownership not verified)

## What This Means
The profile likely has `NULL` user_id or belongs to a different user, so RLS blocks skill inserts.

## Fix It Now

### 1. Open Supabase SQL Editor

### 2. Run Diagnosis
```sql
-- Who am I?
SELECT auth.uid() as my_user_id, auth.email();

-- Who owns this profile?
SELECT id, user_id, full_name, email
FROM profiles 
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';
```

**Expected result**: `user_id` should be `ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892`

### 3. Apply Fix

**✅ RECOMMENDED FIX** - Set the correct user_id:
```sql
UPDATE profiles
SET 
  user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892',
  updated_at = now()
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';
```

**Alternative** - Use dynamic auth.uid() (only if logged in as correct user):
```sql
UPDATE profiles
SET user_id = auth.uid(), updated_at = now()
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
  AND (user_id IS NULL OR user_id != auth.uid());
```

**If profile doesn't exist** → Delete the stale ID and recreate:
```sql
-- Just refresh the page and create a new profile
```

### 4. Verify Fix
```sql
SELECT 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95'
    AND p.user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892'
  ) as can_insert;
```
**Must return**: `true` ✅

**Also verify the profile details**:
```sql
SELECT 
  id,
  user_id,
  full_name,
  email,
  CASE 
    WHEN user_id = 'ba2658d7-4a2c-4ffe-9a6c-c6a2dda03892' THEN '✅ FIXED'
    WHEN user_id IS NULL THEN '❌ NULL user_id'
    ELSE '❌ Wrong user_id: ' || user_id
  END as status
FROM profiles
WHERE id = 'ff3fc7d1-85de-40e3-9958-8fb361810c95';
```

### 5. Update RLS Policies (Optional but recommended)
Copy and run all SQL from: `sql/fix-skills-rls-policy.sql`

### 6. Test in App
Save your profile again. Should work now! 🎉

---

## Still Not Working?

Check:
1. ✅ Logged in as correct user? (Check `auth.uid()`)
2. ✅ UPDATE query succeeded? (Look for error messages)
3. ✅ Verification query returns `true`?
4. ✅ Browser cache cleared?

If still broken, use the full diagnosis script:
📄 `sql/RUNTHIS-fix-profile-ownership-issue.sql`
