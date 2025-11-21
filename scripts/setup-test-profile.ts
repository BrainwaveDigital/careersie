/**
 * Quick Profile Setup Script
 * Run this to create a profile for testing the Stories feature
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestProfile() {
  console.log('🚀 Setting up test profile...\n');

  // Get the current authenticated user from your session
  const userId = 'YOUR_USER_ID_HERE'; // Replace with your actual auth.users.id
  const email = 'your@email.com'; // Replace with your email
  const name = 'Test User'; // Replace with your name

  try {
    // 1. Create profile
    console.log('Creating profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: name,
        email: email,
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return;
    }

    console.log('✅ Profile created:', profile.id);

    // 2. Create a test experience
    console.log('\nCreating test experience...');
    const { data: experience, error: expError } = await supabase
      .from('experiences')
      .insert({
        profile_id: profile.id,
        title: 'Senior Software Engineer',
        company: 'Acme Corp',
        start_date: '2020-01-01',
        end_date: '2023-12-31',
        is_current: false,
        description: 'Led engineering initiatives and built scalable systems',
      })
      .select()
      .single();

    if (expError) {
      console.error('❌ Experience creation failed:', expError.message);
      return;
    }

    console.log('✅ Experience created:', experience.id);

    // 3. Create a test skill
    console.log('\nCreating test skill...');
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .insert({
        profile_id: profile.id,
        skill: 'React',
      })
      .select()
      .single();

    if (skillError) {
      console.error('❌ Skill creation failed:', skillError.message);
      return;
    }

    console.log('✅ Skill created:', skill.id);

    // Print test data
    console.log('\n📋 TEST DATA FOR STORY-TEST PAGE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Experience ID: ${experience.id}`);
    console.log(`Skill ID: ${skill.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Setup complete! Now visit:');
    console.log('   http://localhost:3000/story-test');
    console.log('\n   And paste the Experience ID above.');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupTestProfile();
