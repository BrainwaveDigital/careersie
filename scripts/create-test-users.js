#!/usr/bin/env node

/**
 * Create test users in Supabase Auth for development/testing
 * Usage: node scripts/create-test-users.js
 */

// Load environment variables from multiple locations
require('./load-env')

const { createClient } = require('@supabase/supabase-js')

const TEST_USERS = [
  {
    email: 'test1@careersie.dev',
    password: 'TestPassword123!',
    name: 'John Doe',
    role: 'software_engineer'
  },
  {
    email: 'test2@careersie.dev',
    password: 'TestPassword123!',
    name: 'Jane Smith',
    role: 'product_manager'
  },
  {
    email: 'test3@careersie.dev',
    password: 'TestPassword123!',
    name: 'Mike Johnson',
    role: 'data_scientist'
  },
  {
    email: 'test4@careersie.dev',
    password: 'TestPassword123!',
    name: 'Sarah Williams',
    role: 'designer'
  },
  {
    email: 'test5@careersie.dev',
    password: 'TestPassword123!',
    name: 'David Brown',
    role: 'marketing_manager'
  }
]

async function createTestUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Use service role key to bypass email confirmation
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🚀 Creating test users...\n')

  const results = {
    created: [],
    existing: [],
    failed: []
  }

  for (const user of TEST_USERS) {
    try {
      // Create user in Supabase Auth (bypasses email confirmation with service role)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  ${user.email} - Already exists`)
          results.existing.push(user.email)
        } else {
          console.error(`❌ ${user.email} - Failed: ${authError.message}`)
          console.error(`   Full error:`, JSON.stringify(authError, null, 2))
          results.failed.push({ email: user.email, error: authError.message })
        }
        continue
      }

      // Create profile record
      const userId = authData.user.id
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          name: user.name,
          email: user.email
        })

      if (profileError && !profileError.message.includes('duplicate')) {
        console.warn(`⚠️  Profile creation warning for ${user.email}: ${profileError.message}`)
      }

      console.log(`✅ ${user.email} - Created successfully`)
      results.created.push(user.email)
    } catch (err) {
      console.error(`❌ ${user.email} - Unexpected error:`, err.message)
      results.failed.push({ email: user.email, error: err.message })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log(`   ✅ Created: ${results.created.length}`)
  console.log(`   ⚠️  Already exist: ${results.existing.length}`)
  console.log(`   ❌ Failed: ${results.failed.length}`)
  console.log('='.repeat(60))

  if (results.created.length > 0 || results.existing.length > 0) {
    console.log('\n📝 Test Credentials:')
    console.log('   Email: test1@careersie.dev to test5@careersie.dev')
    console.log('   Password: TestPassword123!')
    console.log('\n🌐 Login at: http://localhost:3000/login')
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed users:')
    results.failed.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`)
    })
  }
}

createTestUsers().catch(console.error)
