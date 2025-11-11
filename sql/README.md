# SQL migrations

This folder contains SQL migration files for the Careersie project.

Files
- `archive/20251111_create_profiles_tables_original.sql` — preserved original CREATE statements that were executed in the Supabase dashboard.
- `migrations/20251111_profiles_up.sql` — an "up" migration that creates the `profiles`, `parsed_documents`, and related tables, indexes, and RLS policies.
- `migrations/20251111_profiles_down.sql` — a "down" migration that drops the indexes and tables created by the up migration (destructive).

Notes
- The original migration was applied directly in the Supabase dashboard on 2025-11-12 and is preserved in `archive/`.
- Use the `migrations/*_up.sql` and `migrations/*_down.sql` scripts carefully. The down script is destructive and will delete data.
- Running the migrations:

  - Supabase SQL editor:
    1. Open https://app.supabase.com → your project → SQL → New query.
    2. Paste the contents of the up script and Run.

  - psql (PowerShell example):
    ```powershell
    psql "host=db.<project>.supabase.co port=5432 dbname=postgres user=postgres password=YOUR_DB_PASSWORD" -f sql/migrations/20251111_profiles_up.sql
    ```

- RLS: the up migration enables Row Level Security on user-data tables and creates owner-only policies that use `auth.uid()`.
- Supabase service_role keys bypass RLS and can be used server-side to perform administrative actions. Do not expose service_role keys in client code.

If you'd like, I can:
- Add a migration versioning file compatible with your chosen migration tool (e.g. pg-migrate, sqitch, Flyway).
- Add a non-destructive smoke-test script that creates test users, inserts test rows, and validates RLS policies.
