# Test Users for Careersie

This document provides guidance for creating test user accounts for development and testing purposes.

## Two Methods for Creating Test Users

### Method 1: Self-Registration via UI (Recommended)

The easiest way to create test users is through the signup page:

1. **Navigate to Signup**: Go to http://localhost:3000/signup
2. **Fill in the form**:
   - Full Name: Any name (e.g., "John Doe", "Jane Smith")
   - Email: Use any valid email format (e.g., test1@example.com, test2@example.com)
   - Password: At least 6 characters (e.g., "Test123!")
   - Confirm Password: Match the password
3. **Submit**: Click "Create Account"
4. **Email Confirmation**: 
   - If email confirmation is enabled in Supabase, check your email
   - If auto-confirm is enabled, you'll be redirected to the dashboard immediately

#### Quick Test Account Examples

For development, you can use these email patterns:
- test1@example.com
- test2@example.com
- john.doe@test.dev
- jane.smith@test.dev
- developer@careersie.test

**Password**: Use something simple like `Test123!` for all test accounts

### Method 2: Scripted Creation (Currently Disabled)

The automated script approach (`scripts/create-test-users.js`) is currently experiencing database issues due to RLS policies. This will be fixed in a future update.

## Managing Test Users

### Login as Test User

1. Go to http://localhost:3000/login
2. Enter the email and password you created
3. Click "Sign in"
4. You'll be redirected to the dashboard

### Testing Different Scenarios

Create multiple test users to simulate:
- **Different roles**: Software Engineer, Product Manager, Designer, etc.
- **Different experience levels**: Junior, Mid-level, Senior
- **Different CV formats**: Upload various CV/resume formats for each user
- **Multiple uploads**: Each user can upload multiple CVs to test the parsing system

### Suggested Test Users

| Name | Email | Password | Use Case |
|------|-------|----------|----------|
| John Doe | john@test.dev | Test123! | Software Engineer with 5+ years experience |
| Jane Smith | jane@test.dev | Test123! | Recent graduate / Junior level |
| Mike Johnson | mike@test.dev | Test123! | Senior level / Multiple roles |
| Sarah Williams | sarah@test.dev | Test123! | Career changer / Multiple CVs |
| David Brown | david@test.dev | Test123! | Edge cases / Special formatting |

## Supabase Configuration

### Email Confirmation Settings

Check your Supabase project settings:

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. For development, you may want to **disable** email confirmations for faster testing
4. For production-like testing, keep it enabled

### Manually Confirm Users (Supabase Dashboard)

If email confirmation is stuck:

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click on the user
4. Manually confirm their email address

## Deleting Test Users

### Via Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Find the test user
3. Click the menu (···) → Delete user
4. Confirm deletion

### Via Script (When Fixed)

```bash
node scripts/delete-test-users.js
```

## Security Notes

⚠️ **Important**: 
- These credentials are for **development/testing only**
- Use simple, shared passwords for convenience during development
- Never use test accounts or simple passwords in production
- Test users should only exist in local/dev/staging environments
- Always use strong, unique passwords for real user accounts

## Troubleshooting

### "User already exists" error
The email is already registered. Try a different email or login with the existing credentials.

### Email not arriving
- Check your spam folder
- Verify Supabase email settings
- Consider disabling email confirmation in Supabase for dev
- Check Supabase logs for email delivery issues

### Can't login after signup
- Check if email confirmation is required
- Manually confirm the user in Supabase Dashboard
- Verify the password meets requirements (6+ characters)

### Database errors during signup
- Check Supabase logs in Dashboard → Logs
- Verify RLS policies are correctly configured
- Ensure `profiles` table exists and is accessible
- Check that triggers/functions aren't blocking user creation
