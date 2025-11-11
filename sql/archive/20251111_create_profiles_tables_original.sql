-- Original migration created 2025-11-11
-- This file preserves the original CREATE TABLE statements and indexes
-- that were executed in the Supabase dashboard prior to the repository
-- being updated to mark the migration as applied.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  full_name text,
  preferred_name text,
  headline text,
  summary text,
  location text,
  website text,
  email text,
  phone text,
  about text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- parsed_documents (one row per uploaded CV)
CREATE TABLE IF NOT EXISTS public.parsed_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id),
  user_id uuid REFERENCES auth.users(id),
  file_name text,
  storage_path text,
  content_type text,
  size_bytes integer,
  text_extracted text,
  parsed_json jsonb,
  parser_version text,
  status text DEFAULT 'uploaded', -- uploaded|parsing|parsed|failed
  error_text text,
  parsed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- experiences
CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  company text,
  location text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  raw_json jsonb,
  order_index integer,
  created_at timestamptz DEFAULT now()
);

-- education
CREATE TABLE IF NOT EXISTS public.education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  school text,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  description text,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- skills
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill text,
  confidence numeric(5,4),
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- certifications (optional)
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  authority text,
  issued_date date,
  expiry_date date,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- parsing_jobs (optional queue for async parsing)
CREATE TABLE IF NOT EXISTS public.parsing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_document_id uuid REFERENCES public.parsed_documents(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- pending|running|done|failed
  attempts integer DEFAULT 0,
  worker text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- projects (optional)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  authority text,
  issued_date date,
  expiry_date date,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- volunteering (optional)
CREATE TABLE IF NOT EXISTS public.volunteering (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  authority text,
  issued_date date,
  expiry_date date,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- languages (optional)
CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  language text,
  proficiency text,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- organizations (optional)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text,
  authority text,
  issued_date date,
  expiry_date date,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_parsed_documents_status ON public.parsed_documents (status);
CREATE INDEX IF NOT EXISTS idx_parsed_documents_json_gin ON public.parsed_documents USING GIN (parsed_json);
CREATE INDEX IF NOT EXISTS idx_experiences_profile ON public.experiences (profile_id);
CREATE INDEX IF NOT EXISTS idx_skills_profile ON public.skills (profile_id);
