#!/usr/bin/env node

/**
 * Delete test users from Supabase Auth
 * Usage: node scripts/delete-test-users.js
 */

// Load environment variables from multiple locations
require('./load-env')

const { createClient } = require('@supabase/supabase-js')

const TEST_USER_EMAILS = [
  'test1@careersie.dev',
  'test2@careersie.dev',
  'test3@careersie.dev',
  'test4@careersie.dev',
  'test5@careersie.dev'
]

async function deleteTestUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🗑️  Deleting test users...\n')

  const results = {
    deleted: [],
    notFound: [],
    failed: []
  }

  for (const email of TEST_USER_EMAILS) {
    try {
      // Find user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error(`❌ ${email} - Failed to list users: ${listError.message}`)
        results.failed.push({ email, error: listError.message })
        continue
      }

      const user = users.users.find(u => u.email === email)
      
      if (!user) {
        console.log(`⚠️  ${email} - Not found`)
        results.notFound.push(email)
        continue
      }

      // Delete user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (deleteError) {
        console.error(`❌ ${email} - Delete failed: ${deleteError.message}`)
        results.failed.push({ email, error: deleteError.message })
        continue
      }

      console.log(`✅ ${email} - Deleted successfully`)
      results.deleted.push(email)
    } catch (err) {
      console.error(`❌ ${email} - Unexpected error:`, err.message)
      results.failed.push({ email, error: err.message })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`   ✅ Deleted: ${results.deleted.length}`)
  console.log(`   ⚠️  Not found: ${results.notFound.length}`)
  console.log(`   ❌ Failed: ${results.failed.length}`)
  console.log('='.repeat(60))

  if (results.failed.length > 0) {
    console.log('\n❌ Failed deletions:')
    results.failed.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`)
    })
  }
}

deleteTestUsers().catch(console.error)
