-- Migration Fixup: Resolving inconsistencies between 00_initial_setup and subsequent migrations
-- This script removes conflicting tables from 00 and adds the missing columns to tdl_requests.

-- 1. Drop conflicting tables from 00 to allow sprint migrations to recreate them properly
DROP TABLE IF EXISTS tdl_technical_specs CASCADE;
DROP TABLE IF EXISTS tdl_test_results CASCADE;
DROP TABLE IF EXISTS tdl_sample_orders CASCADE;
DROP TABLE IF EXISTS tdl_pdf_reports CASCADE;
DROP TABLE IF EXISTS tdl_archives CASCADE;
DROP TABLE IF EXISTS tdl_financial CASCADE; 
DROP TABLE IF EXISTS tdl_photos CASCADE;

-- 2. Align tdl_requests columns
-- Adding columns that are missing from 00 but expected by views and policies in 01-09
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS submission_date DATE;
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

-- Backfill user_id from created_by (which was defined in 00)
UPDATE tdl_requests SET user_id = created_by WHERE user_id IS NULL;

-- 3. Create missing tdl_team_members table referenced in 01-04
CREATE TABLE IF NOT EXISTS tdl_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tdl_team_members_user ON tdl_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tdl_team_members_role ON tdl_team_members(role);

-- 4. Enable RLS on the new table
ALTER TABLE tdl_team_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view team members (basic policy for dev)
DROP POLICY IF EXISTS "authenticated_view_team" ON tdl_team_members;
CREATE POLICY "authenticated_view_team" ON tdl_team_members
    FOR SELECT TO authenticated USING (true);
