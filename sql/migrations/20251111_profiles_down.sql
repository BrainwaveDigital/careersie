-- Down migration: drop profiles + related tables
-- Run this to rollback the 'profiles' migration. Be careful: this will delete all profile data.

DROP INDEX IF EXISTS public.idx_skills_profile;
DROP INDEX IF EXISTS public.idx_experiences_profile;
DROP INDEX IF EXISTS public.idx_parsed_documents_json_gin;
DROP INDEX IF EXISTS public.idx_parsed_documents_status;
DROP INDEX IF EXISTS public.idx_profiles_email_lower;

DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.languages CASCADE;
DROP TABLE IF EXISTS public.volunteering CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.parsing_jobs CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.education CASCADE;
DROP TABLE IF EXISTS public.experiences CASCADE;
DROP TABLE IF EXISTS public.parsed_documents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Note: pgcrypto extension is commonly shared; drop only if you know it's safe
-- DROP EXTENSION IF EXISTS "pgcrypto";
