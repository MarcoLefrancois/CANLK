-- Sprint 6: Logistics, PDF & Closure
-- Migration: 20260315_06_sprint6_closure
-- Date: 2026-03-15

-- ============================================
-- Table: Sample Orders (CANLK-111)
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_sample_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    sample_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT 'chips',
    shipping_format VARCHAR(50) NOT NULL DEFAULT 'bag',
    substrate_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tdl_sample_orders_tdl_id 
ON tdl_sample_orders(tdl_id);

-- ============================================
-- Table: PDF Reports (CANLK-126)
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_pdf_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    version INTEGER NOT NULL DEFAULT 1,
    file_path VARCHAR(500) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tdl_pdf_reports_tdl_id 
ON tdl_pdf_reports(tdl_id);

-- ============================================
-- Table: Archives (CANLK-129)
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    archive_path VARCHAR(500) NOT NULL,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_tdl_archives_tdl_id 
ON tdl_archives(tdl_id);

-- ============================================
-- Add closure fields to tdl_requests
-- ============================================

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS closure_date TIMESTAMPTZ;

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT false;

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS sample_orders JSONB;

-- ============================================
-- Storage Bucket for PDF Reports
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tdl-reports',
    'tdl-reports',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access for tdl-reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'tdl-reports');

-- Storage policy: Allow service role write access
CREATE POLICY IF NOT EXISTS "Service role write access for tdl-reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tdl-reports');

CREATE POLICY IF NOT EXISTS "Service role update access for tdl-reports"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tdl-reports');

-- ============================================
-- Row Level Security
-- ============================================

-- Enable RLS on new tables
ALTER TABLE tdl_sample_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_pdf_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_archives ENABLE ROW LEVEL SECURITY;

-- Policies for tdl_sample_orders
CREATE POLICY "Users can view sample orders"
ON tdl_sample_orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tdl_requests 
        WHERE tdl_requests.id = tdl_sample_orders.tdl_id
        AND (
            tdl_requests.created_by = auth.uid()
            OR auth.uid() IN (SELECT unnest(tdl_requests.team_members))
        )
    )
);

CREATE POLICY "Users can insert sample orders"
ON tdl_sample_orders FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM tdl_requests 
        WHERE tdl_requests.id = tdl_sample_orders.tdl_id
        AND (
            tdl_requests.created_by = auth.uid()
            OR auth.uid() IN (SELECT unnest(tdl_requests.team_members))
        )
    )
);

-- Policies for tdl_pdf_reports
CREATE POLICY "Users can view pdf reports"
ON tdl_pdf_reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tdl_requests 
        WHERE tdl_requests.id = tdl_pdf_reports.tdl_id
    )
);

-- Policies for tdl_archives
CREATE POLICY "Users can view archives"
ON tdl_archives FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM tdl_requests 
        WHERE tdl_requests.id = tdl_archives.tdl_id
    )
);

-- ============================================
-- Function: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tdl_sample_orders
DROP TRIGGER IF EXISTS update_tdl_sample_orders_updated_at ON tdl_sample_orders;
CREATE TRIGGER update_tdl_sample_orders_updated_at
    BEFORE UPDATE ON tdl_sample_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE tdl_sample_orders IS 'Sample orders for outgoing samples';
COMMENT ON TABLE tdl_pdf_reports IS 'PDF report versions generated for TDLs';
COMMENT ON TABLE tdl_archives IS 'Archive records for TDLs archived to SharePoint';
