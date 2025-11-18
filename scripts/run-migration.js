/**
 * Run database migration via Supabase REST API
 * Usage: node scripts/run-migration.js sql/migrations/20251118_create_talent_stories_up.sql
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('./load-env.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <path-to-migration.sql>');
  process.exit(1);
}

const sqlPath = path.resolve(migrationFile);
if (!fs.existsSync(sqlPath)) {
  console.error(`Error: Migration file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

console.log(`Running migration: ${path.basename(sqlPath)}`);
console.log('SQL preview:', sql.substring(0, 200) + '...\n');

// Execute SQL via Supabase REST API
fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
  },
  body: JSON.stringify({ query: sql }),
})
  .then(async (response) => {
    const text = await response.text();
    if (!response.ok) {
      console.error('Migration failed!');
      console.error('Status:', response.status);
      console.error('Response:', text);
      process.exit(1);
    }
    console.log('Migration successful!');
    console.log('Response:', text);
  })
  .catch((error) => {
    console.error('Error running migration:', error.message);
    process.exit(1);
  });
