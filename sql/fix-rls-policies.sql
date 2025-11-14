-- Fix RLS policies by removing app_admins reference
-- Run this in Supabase SQL Editor

-- Drop existing policies that reference app_admins
DROP POLICY IF EXISTS "profiles_owner_or_admin_full_access" ON public.profiles;
DROP POLICY IF EXISTS "parsed_documents_owner_or_admin_full_access" ON public.parsed_documents;

-- Create simpler owner-only policies
CREATE POLICY "profiles_owner_full_access" ON public.profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "parsed_documents_owner_full_access" ON public.parsed_documents
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Also fix other tables if they have similar policies
DROP POLICY IF EXISTS "experiences_owner_or_admin_full_access" ON public.experiences;
DROP POLICY IF EXISTS "education_owner_or_admin_full_access" ON public.education;
DROP POLICY IF EXISTS "skills_owner_or_admin_full_access" ON public.skills;
DROP POLICY IF EXISTS "certifications_owner_or_admin_full_access" ON public.certifications;
DROP POLICY IF EXISTS "parsing_jobs_owner_or_admin_full_access" ON public.parsing_jobs;
DROP POLICY IF EXISTS "projects_owner_or_admin_full_access" ON public.projects;
DROP POLICY IF EXISTS "volunteering_owner_or_admin_full_access" ON public.volunteering;
DROP POLICY IF EXISTS "languages_owner_or_admin_full_access" ON public.languages;
DROP POLICY IF EXISTS "organizations_owner_or_admin_full_access" ON public.organizations;

-- Create simpler policies for child tables (access via profile_id)
CREATE POLICY "experiences_owner_full_access" ON public.experiences
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = experiences.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = experiences.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "education_owner_full_access" ON public.education
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = education.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = education.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "skills_owner_full_access" ON public.skills
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = skills.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = skills.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "certifications_owner_full_access" ON public.certifications
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = certifications.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = certifications.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "projects_owner_full_access" ON public.projects
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = projects.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = projects.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "volunteering_owner_full_access" ON public.volunteering
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = volunteering.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = volunteering.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "languages_owner_full_access" ON public.languages
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = languages.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = languages.profile_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "organizations_owner_full_access" ON public.organizations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = organizations.profile_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = organizations.profile_id AND p.user_id = auth.uid()
  ));

-- Optional: Create app_admins table for future use
CREATE TABLE IF NOT EXISTS public.app_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- Only admins can view the admin list
CREATE POLICY "app_admins_admin_only" ON public.app_admins
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
