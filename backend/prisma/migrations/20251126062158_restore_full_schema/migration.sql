/*
  Warnings:

  - You are about to drop the `DownloadHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DownloadHistory";

-- CreateTable
CREATE TABLE "export_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "full_name" TEXT,
    "preferred_name" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "location" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "about" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parsed_documents" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT,
    "user_id" TEXT,
    "file_name" TEXT,
    "storage_path" TEXT,
    "content_type" TEXT,
    "size_bytes" INTEGER,
    "text_extracted" TEXT,
    "parsed_json" JSONB,
    "parser_version" TEXT,
    "status" TEXT DEFAULT 'uploaded',
    "error_text" TEXT,
    "parsed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parsed_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "title" TEXT,
    "company" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "raw_json" JSONB,
    "order_index" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "school" TEXT,
    "degree" TEXT,
    "field_of_study" TEXT,
    "start_year" INTEGER,
    "end_year" INTEGER,
    "description" TEXT,
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "skill" TEXT,
    "confidence" DOUBLE PRECISION,
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT,
    "authority" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parsing_jobs" (
    "id" TEXT NOT NULL,
    "parsed_document_id" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "attempts" INTEGER DEFAULT 0,
    "worker" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parsing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT,
    "authority" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteering" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT,
    "authority" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "language" TEXT,
    "proficiency" TEXT,
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "name" TEXT,
    "authority" TEXT,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_library" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "storage_bucket" TEXT NOT NULL DEFAULT 'media-library',
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_assessments" (
    "id" TEXT NOT NULL,
    "users_id" TEXT NOT NULL,
    "assessment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "time_taken_seconds" INTEGER,
    "openness_score" INTEGER,
    "conscientiousness_score" INTEGER,
    "extraversion_score" INTEGER,
    "agreeableness_score" INTEGER,
    "emotional_stability_score" INTEGER,
    "overall_score" DOUBLE PRECISION,
    "responses" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personality_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_responses" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "response_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personality_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_admins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "department" TEXT,
    "access_level" INTEGER NOT NULL DEFAULT 1,
    "allowed_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restricted_actions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_login_at" TIMESTAMP(3),
    "last_activity_at" TIMESTAMP(3),
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "account_locked_until" TIMESTAMP(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMP(3),
    "deactivated_by" TEXT,
    "deactivation_reason" TEXT,
    "notes" TEXT,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "app_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "model" TEXT DEFAULT 'gpt-4o',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "talent_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "location" TEXT,
    "raw_description" TEXT NOT NULL,
    "job_url" TEXT,
    "parsed_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT DEFAULT 'active',
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customized_stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT,
    "job_post_id" TEXT,
    "story" TEXT NOT NULL,
    "reordered_experience" JSONB,
    "highlighted_skills" TEXT[],
    "match_score" INTEGER NOT NULL,
    "score_breakdown" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version_name" TEXT,

    CONSTRAINT "customized_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "experience_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "situation" TEXT,
    "task" TEXT,
    "action" TEXT,
    "result" TEXT,
    "full_story" TEXT,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "metrics" JSONB,
    "title" TEXT,
    "tags" TEXT[],
    "is_draft" BOOLEAN NOT NULL DEFAULT true,
    "relevance_score" DOUBLE PRECISION,
    "job_match_scores" JSONB,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_versions" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version_number" INTEGER NOT NULL,
    "situation" TEXT,
    "task" TEXT,
    "action" TEXT,
    "result" TEXT,
    "full_story" TEXT,
    "metrics" JSONB,
    "change_summary" TEXT,
    "created_by_ai" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "story_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_skills" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_history_user_id_idx" ON "export_history"("user_id");

-- CreateIndex
CREATE INDEX "export_history_created_at_idx" ON "export_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_media_library_profile_id" ON "media_library"("profile_id");

-- CreateIndex
CREATE INDEX "idx_media_library_file_type" ON "media_library"("file_type");

-- CreateIndex
CREATE INDEX "idx_media_library_created_at" ON "media_library"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_personality_assessments_applicant" ON "personality_assessments"("users_id");

-- CreateIndex
CREATE INDEX "idx_personality_assessments_date" ON "personality_assessments"("assessment_date");

-- CreateIndex
CREATE INDEX "idx_personality_assessments_completed" ON "personality_assessments"("completed");

-- CreateIndex
CREATE INDEX "idx_personality_responses_assessment" ON "personality_responses"("assessment_id");

-- CreateIndex
CREATE INDEX "idx_personality_responses_dimension" ON "personality_responses"("dimension");

-- CreateIndex
CREATE INDEX "idx_app_admins_user_id" ON "app_admins"("user_id");

-- CreateIndex
CREATE INDEX "idx_app_admins_role" ON "app_admins"("role");

-- CreateIndex
CREATE INDEX "idx_app_admins_is_active" ON "app_admins"("is_active");

-- CreateIndex
CREATE INDEX "idx_app_admins_email" ON "app_admins"("email");

-- CreateIndex
CREATE INDEX "idx_app_admins_last_activity" ON "app_admins"("last_activity_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "app_admins_user_id_key" ON "app_admins"("user_id");

-- CreateIndex
CREATE INDEX "idx_talent_stories_user_id" ON "talent_stories"("user_id");

-- CreateIndex
CREATE INDEX "idx_talent_stories_is_active" ON "talent_stories"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_job_posts_user_id" ON "job_posts"("user_id");

-- CreateIndex
CREATE INDEX "idx_job_posts_status" ON "job_posts"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_customized_stories_user_id" ON "customized_stories"("user_id");

-- CreateIndex
CREATE INDEX "idx_customized_stories_job_post_id" ON "customized_stories"("job_post_id");

-- CreateIndex
CREATE INDEX "idx_customized_stories_is_active" ON "customized_stories"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_stories_experience_id" ON "stories"("experience_id");

-- CreateIndex
CREATE INDEX "idx_stories_updated_at" ON "stories"("updated_at");

-- CreateIndex
CREATE INDEX "idx_stories_is_draft" ON "stories"("is_draft");

-- CreateIndex
CREATE INDEX "idx_story_versions_story_id" ON "story_versions"("story_id");

-- CreateIndex
CREATE INDEX "idx_story_versions_created_at" ON "story_versions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "story_versions_story_id_version_number_key" ON "story_versions"("story_id", "version_number");

-- CreateIndex
CREATE INDEX "idx_story_skills_story_id" ON "story_skills"("story_id");

-- CreateIndex
CREATE INDEX "idx_story_skills_skill_id" ON "story_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_skills_story_id_skill_id_key" ON "story_skills"("story_id", "skill_id");

-- AddForeignKey
ALTER TABLE "parsed_documents" ADD CONSTRAINT "parsed_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education" ADD CONSTRAINT "education_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parsing_jobs" ADD CONSTRAINT "parsing_jobs_parsed_document_id_fkey" FOREIGN KEY ("parsed_document_id") REFERENCES "parsed_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteering" ADD CONSTRAINT "volunteering_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "languages" ADD CONSTRAINT "languages_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_library" ADD CONSTRAINT "media_library_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_responses" ADD CONSTRAINT "personality_responses_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "personality_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customized_stories" ADD CONSTRAINT "customized_stories_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "job_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customized_stories" ADD CONSTRAINT "customized_stories_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_experience_id_fkey" FOREIGN KEY ("experience_id") REFERENCES "experiences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_versions" ADD CONSTRAINT "story_versions_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_skills" ADD CONSTRAINT "story_skills_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_skills" ADD CONSTRAINT "story_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
