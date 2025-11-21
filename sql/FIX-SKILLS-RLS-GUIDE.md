# Fix: RLS Policy Violation for Skills Table

## Problem
Error when saving profile: `new row violates row-level security policy for table "skills"`

## Root Cause
Based on diagnosis, the issue is **profile ownership mismatch**:
- Test query returned `false` for profile ID `5aad8d45-29af-46c3-ba03-5634a6ddbd8c`
- This means the profile either:
  1. Doesn't exist in the database
  2. Has a `NULL` user_id
  3. Belongs to a different user than the one currently logged in

The RLS policy on the `skills` table blocks inserts because it can't verify you own the profile.

## Solution

### Step 1: Diagnose the Exact Problem

Run this comprehensive diagnostic script in Supabase SQL Editor:
```bash
# Location: d:\0_Careersie\sql\RUNTHIS-fix-profile-ownership-issue.sql
```

This will show you:
1. Your current user ID
2. Whether the profile exists and who owns it
3. Whether you have other profiles
4. What fix option to use

### Step 2: Apply the Appropriate Fix

Based on the diagnosis results from Step 1, choose ONE fix option from the script:

**Option A**: Profile has NULL user_id → Uncomment "FIX A" section
**Option B**: Profile belongs to wrong user → Uncomment "FIX B" section  
**Option C**: Profile is corrupted → Uncomment "FIX C" section (deletes profile)
**Option D**: ID is from wrong table → Check "FIX D" section

### Step 3: Fix RLS Policies (Secondary Issue)

After fixing ownership, also update the RLS policies to prevent future issues:
```bash
# Location: d:\0_Careersie\sql\fix-skills-rls-policy.sql
```

### Step 4: Verify the Fix

After running the appropriate fix from Step 2, run the verification query at the bottom of the script:
```sql
SELECT 
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c' 
    AND p.user_id = auth.uid()
  ) as can_insert_skills;
```

**Expected result**: `true` ✅

If you still get `false`, check:
1. Are you logged in as the correct user?
2. Did the UPDATE query actually run? (Check for error messages)
3. Is RLS preventing you from seeing the profile? (Use service role key)

### Step 5: Test in the Application

After the database fix, try saving your profile again. You should see:
```
🔵 Inserting skills: { count: X, profileId: '...', userId: '...', sample: {...} }
🔍 Profile check: { profileCheck: {...}, checkError: null }
✅ Skills inserted successfully
```

If you see an error:
1. Check the console logs for detailed error info
2. Verify `profileCheck.user_id` matches your current `userId`
3. Ensure the profile ID in the URL or state is correct

### Step 6 (Optional): Alternative - Use Service Role API

If profile ownership issues persist or you want to bypass RLS entirely, create an API route:

**File: `apps/web/app/api/profiles/save/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profileData, skills, experiences, education } = body
    
    const supabase = getSupabaseServer() // Uses service role key (bypasses RLS)
    
    // Verify user authentication (custom check)
    // ... add auth verification here ...
    
    // Insert profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (profileError) throw profileError
    
    // Insert skills (bypasses RLS)
    if (skills.length > 0) {
      const { error: skillsError } = await supabase
        .from('skills')
        .insert(skills.map(s => ({ ...s, profile_id: profile.id })))
      
      if (skillsError) throw skillsError
    }
    
    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## Quick Summary

**Your specific issue**: Profile `5aad8d45-29af-46c3-ba03-5634a6ddbd8c` ownership test returned `false`

**Most likely cause**: Profile has NULL `user_id` or belongs to different user

**Fix steps**:
1. ✅ Run `RUNTHIS-fix-profile-ownership-issue.sql` - DIAGNOSIS section
2. ✅ Identify which fix applies (A, B, C, or D)
3. ✅ Uncomment and run the appropriate FIX section
4. ✅ Run verification query (should return `true`)
5. ✅ Run `fix-skills-rls-policy.sql` to update RLS policies
6. ✅ Test saving profile in application
7. ✅ Check console for success logs

## Testing

1. **Run the SQL script** in Supabase dashboard
2. **Clear browser cache** and refresh the page
3. **Try saving a profile** with skills
4. **Check console** for debugging output
5. **Verify in Supabase** that skills were inserted

## Debugging Queries

Quick queries to run in Supabase SQL Editor:

```sql
-- Who am I?
SELECT auth.uid() as my_user_id, auth.email() as my_email;

-- Does this profile exist and who owns it?
SELECT id, user_id, full_name, email
FROM profiles
WHERE id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c';

-- Can I insert skills now?
SELECT 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c' 
    AND p.user_id = auth.uid()
  ) as result;
-- Expected: true (after fix)
```

## Prevention

To prevent this in the future:
1. Always split RLS policies by operation (SELECT, INSERT, UPDATE, DELETE)
2. Test RLS policies with actual user authentication before deploying
3. Add debugging logs when working with RLS-protected tables
4. Consider using API routes with service role for complex operations

## Related Files
- **PRIMARY FIX**: `sql/RUNTHIS-fix-profile-ownership-issue.sql` ⭐ START HERE
- **Secondary fix**: `sql/fix-skills-rls-policy.sql` (RLS policy updates)
- Diagnosis helper: `sql/diagnose-profile-ownership.sql`
- Fix helper: `sql/fix-profile-ownership.sql`
- Debug script: `sql/verify-skills-rls-debug.sql`
- Updated page: `apps/web/app/profile/manual/page.tsx` (with debugging)

## Common Scenarios

### Scenario 1: Profile has NULL user_id
**Symptom**: Diagnosis shows profile exists but `user_id` is NULL  
**Fix**: Run FIX A from `RUNTHIS-fix-profile-ownership-issue.sql`

### Scenario 2: Wrong user owns the profile
**Symptom**: Diagnosis shows profile exists but `user_id` ≠ current user  
**Fix**: Run FIX B (transfers ownership) or delete and recreate

### Scenario 3: Profile doesn't exist
**Symptom**: Diagnosis returns no rows for profile query  
**Fix**: Check if ID is from `parsed_documents` (FIX D) or recreate profile

### Scenario 4: Multiple profiles for same user
**Symptom**: Prevention query shows `profile_count > 1`  
**Fix**: Consolidate profiles or delete duplicates
