-- Up migration: create profiles + parsing related tables and RLS policies
-- Run this in Supabase SQL editor or via psql (connected to your Supabase DB)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables
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
  status text DEFAULT 'uploaded',
  error_text text,
  parsed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill text,
  confidence numeric(5,4),
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.parsing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_document_id uuid REFERENCES public.parsed_documents(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  attempts integer DEFAULT 0,
  worker text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  language text,
  proficiency text,
  raw_json jsonb,
  created_at timestamptz DEFAULT now()
);

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

-- RLS policies (owner-only)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS profiles_owner_full_access ON public.profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.parsed_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS parsed_documents_owner_full_access ON public.parsed_documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS experiences_profile_owner ON public.experiences
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.experiences.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.experiences.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS education_profile_owner ON public.education
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.education.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.education.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS skills_profile_owner ON public.skills
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.skills.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.skills.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS certifications_profile_owner ON public.certifications
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.certifications.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.certifications.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS projects_profile_owner ON public.projects
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.projects.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.projects.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.volunteering ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS volunteering_profile_owner ON public.volunteering
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.volunteering.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.volunteering.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS languages_profile_owner ON public.languages
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.languages.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.languages.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS organizations_profile_owner ON public.organizations
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.organizations.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = public.organizations.profile_id AND p.user_id = auth.uid()));

ALTER TABLE public.parsing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS parsing_jobs_owner ON public.parsing_jobs
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.parsed_documents d WHERE d.id = public.parsing_jobs.parsed_document_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.parsed_documents d WHERE d.id = public.parsing_jobs.parsed_document_id AND d.user_id = auth.uid()));
