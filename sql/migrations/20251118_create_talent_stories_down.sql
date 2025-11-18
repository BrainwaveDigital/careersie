-- Drop talent_stories table and related objects

-- Drop policies
DROP POLICY IF EXISTS "Users can delete their own talent stories" ON talent_stories;
DROP POLICY IF EXISTS "Users can update their own talent stories" ON talent_stories;
DROP POLICY IF EXISTS "Users can insert their own talent stories" ON talent_stories;
DROP POLICY IF EXISTS "Users can view their own talent stories" ON talent_stories;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_talent_stories_updated_at ON talent_stories;
DROP FUNCTION IF EXISTS update_talent_stories_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_talent_stories_is_active;
DROP INDEX IF EXISTS idx_talent_stories_user_id;

-- Drop table
DROP TABLE IF EXISTS talent_stories;
