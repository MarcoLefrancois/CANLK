-- Migration: 20260315_04_sprint5_lab
-- Description: Tables pour Sprint 5 - Lab Execution, SOP, Formula ID
-- Project: CANLK
-- Date: 2026-03-15

-- ============================================
-- STORAGE: Photo Bucket
-- ============================================

-- Create bucket for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tdl-photos',
    'tdl-photos',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TABLE: Test Results - CANLK-96
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    
    -- Résultats
    observations TEXT,
    test_end_date DATE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index
CREATE INDEX idx_test_results_tdl ON tdl_test_results(tdl_id);

-- ============================================
-- TABLE: Test Photos - CANLK-96
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_test_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_test_photos_tdl ON tdl_test_photos(tdl_id);
CREATE INDEX idx_test_photos_uploaded ON tdl_test_photos(uploaded_at);

-- ============================================
-- TABLE: SOP Documents - CANLK-108
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_sop_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sharepoint_id VARCHAR(100) UNIQUE,
    client_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500),
    product_type VARCHAR(100),
    version VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_sop_client ON tdl_sop_documents(client_id);
CREATE INDEX idx_sop_product ON tdl_sop_documents(product_type);

-- Insert sample SOP documents
INSERT INTO tdl_sop_documents (sharepoint_id, client_id, title, description, product_type, version) VALUES
    ('SP-001', NULL, 'Procédure Standard - Vernis UV', 'Procédure de contrôle qualité pour application de vernis UV', 'Vernis', '2.1'),
    ('SP-002', NULL, 'Guide Application - Peintures', 'Guide pour l\'application de peintures hydro', 'Peinture', '1.5'),
    ('SP-003', NULL, 'Contrôle Qualité - Couleurs', 'Procédure de contrôle des couleurs', 'Couleur', '3.0')
ON CONFLICT (sharepoint_id) DO NOTHING;

-- ============================================
-- TABLE: Formula IDs - CANLK-102
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_formula_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    formula_id VARCHAR(15),
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_formula_tdl ON tdl_formula_ids(tdl_id);
CREATE INDEX idx_formula_id ON tdl_formula_ids(formula_id);

-- ============================================
-- UPDATE: tdl_requests
-- ============================================

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS formula_id VARCHAR(15),
ADD COLUMN IF NOT EXISTS test_observations TEXT,
ADD COLUMN IF NOT EXISTS test_end_date DATE;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE tdl_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_test_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sop_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_formula_ids ENABLE ROW LEVEL SECURITY;

-- Test Results policies
CREATE POLICY "Users can view test results" 
    ON tdl_test_results FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Technicians can update test results" 
    ON tdl_test_results FOR UPDATE 
    USING (auth.uid() IN (SELECT assigned_technician FROM tdl_requests WHERE id = tdl_id));

-- Test Photos policies
CREATE POLICY "Users can view test photos" 
    ON tdl_test_photos FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Technicians can upload photos" 
    ON tdl_test_photos FOR INSERT 
    WITH CHECK (auth.uid() = uploaded_by);

-- SOP Documents policies
CREATE POLICY "All can view SOP documents" 
    ON tdl_sop_documents FOR SELECT 
    USING (is_active = true);

-- Formula IDs policies
CREATE POLICY "Users can view formula IDs" 
    ON tdl_formula_ids FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Technicians can update formula IDs" 
    ON tdl_formula_ids FOR UPDATE 
    USING (auth.uid() IN (SELECT assigned_technician FROM tdl_requests WHERE id = tdl_id)
           OR auth.uid() IN (SELECT user_id FROM tdl_team_members WHERE role = 'admin'));

-- Storage policies
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;
CREATE POLICY "Users can upload photos"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'tdl-photos' 
        AND auth.uid() IN (
            SELECT user_id FROM tdl_requests 
            WHERE id = (storage.foldername(name))[1]::uuid
        )
    );

DROP POLICY IF EXISTS "Users can view photos" ON storage.objects;
CREATE POLICY "Users can view photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'tdl-photos');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_test_results_updated
    BEFORE UPDATE ON tdl_test_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_formula_ids_updated
    BEFORE UPDATE ON tdl_formula_ids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE tdl_test_results IS 'Résultats de tests techniques pour les TDL';
COMMENT ON TABLE tdl_test_photos IS 'Photos uploadées pour les résultats de tests';
COMMENT ON TABLE tdl_sop_documents IS 'Documents SOP (Standard Operating Procedures)';
COMMENT ON TABLE tdl_formula_ids IS 'Références aux formules ERP Maximum';
