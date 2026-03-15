-- Migration: 20260315_01_sprint2_tables
-- Description: Tables pour Sprint 2 - Bloc B (Analyse Commerciale), Bloc C (Spécifications Techniques), Complexité & Priorité
-- Project: CANLK
-- Date: 2026-03-15

-- ============================================
-- TABLE: Analyse Commerciale (Bloc B)
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_financial_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    
    -- Bloc B: Qualification Financière
    target_price DECIMAL(18,2) CHECK (target_price >= 0),
    due_date DATE,
    priority_code VARCHAR(20),
    annual_potential VARCHAR(20),
    sku_range VARCHAR(20),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index pour les performances
CREATE INDEX idx_financial_tdl ON tdl_financial_analysis(tdl_id);

-- ============================================
-- TABLE: Spécifications Techniques (Bloc C)
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_technical_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    
    -- Bloc C: Spécifications Techniques
    application_type VARCHAR(50),
    is_standard BOOLEAN DEFAULT false,
    brilliance INTEGER CHECK (brilliance >= 0 AND brilliance <= 100),
    drying_type VARCHAR(50),
    
    -- URLs SharePoint dynamiques
    client_sharepoint_url TEXT,
    sop_folder_url TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Index pour les performances
CREATE INDEX idx_technical_tdl ON tdl_technical_specs(tdl_id);

-- ============================================
-- TABLE: Complexité & Priorité Calculée
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_complexity_priority (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    
    -- Complexité (1-5)
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 5),
    complexity_level VARCHAR(20),  -- Mineur, Standard, Avancé, Expert, Critique
    complexity_description TEXT,
    
    -- Critères de complexité
    is_lustre_adjustment BOOLEAN DEFAULT false,
    is_color_match BOOLEAN DEFAULT false,
    is_multi_layers BOOLEAN DEFAULT false,
    is_new_product BOOLEAN DEFAULT false,
    is_high_exigence BOOLEAN DEFAULT false,
    has_past_experience BOOLEAN DEFAULT true,
    
    -- Priorité visuelle
    priority_indicator VARCHAR(20),  -- green, yellow, red
    priority_label VARCHAR(50),
    priority_description TEXT,
    
    -- Verrouillage
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES auth.users(id),
    
    -- Métadonnées
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_complexity_tdl ON tdl_complexity_priority(tdl_id);
CREATE INDEX idx_complexity_score ON tdl_complexity_priority(complexity_score);
CREATE INDEX idx_priority_indicator ON tdl_complexity_priority(priority_indicator);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE tdl_financial_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_technical_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_complexity_priority ENABLE ROW LEVEL SECURITY;

-- Policies pour tdl_financial_analysis
CREATE POLICY "Users can view financial analysis" 
    ON tdl_financial_analysis FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Users can insert financial analysis" 
    ON tdl_financial_analysis FOR INSERT 
    WITH CHECK (auth.uid() = created_by OR auth.uid() IN (
        SELECT user_id FROM tdl_requests WHERE id = tdl_id
    ));

CREATE POLICY "Users can update financial analysis" 
    ON tdl_financial_analysis FOR UPDATE 
    USING (auth.uid() IN (
        SELECT user_id FROM tdl_requests WHERE id = tdl_id
    ));

-- Policies pour tdl_technical_specs
CREATE POLICY "Users can view technical specs" 
    ON tdl_technical_specs FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Users can insert technical specs" 
    ON tdl_technical_specs FOR INSERT 
    WITH CHECK (auth.uid() = created_by OR auth.uid() IN (
        SELECT user_id FROM tdl_requests WHERE id = tdl_id
    ));

CREATE POLICY "Users can update technical specs" 
    ON tdl_technical_specs FOR UPDATE 
    USING (auth.uid() IN (
        SELECT user_id FROM tdl_requests WHERE id = tdl_id
    ));

-- Policies pour tdl_complexity_priority
CREATE POLICY "Users can view complexity priority" 
    ON tdl_complexity_priority FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Supervisors can update complexity priority" 
    ON tdl_complexity_priority FOR UPDATE 
    USING (
        auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id)
        OR EXISTS (
            SELECT 1 FROM tdl_team_members 
            WHERE user_id = auth.uid() AND role IN ('supervisor', 'admin')
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour tdl_financial_analysis
CREATE TRIGGER update_tdl_financial_analysis_updated_at 
    BEFORE UPDATE ON tdl_financial_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour tdl_technical_specs
CREATE TRIGGER update_tdl_technical_specs_updated_at 
    BEFORE UPDATE ON tdl_technical_specs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour tdl_complexity_priority
CREATE TRIGGER update_tdl_complexity_priority_updated_at 
    BEFORE UPDATE ON tdl_complexity_priority
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer la complexité automatiquement
CREATE OR REPLACE FUNCTION calculate_tdl_complexity(p_tdl_id UUID)
RETURNS VOID AS $$
DECLARE
    v_score INTEGER := 1;
    v_level VARCHAR(20);
    v_description TEXT;
BEGIN
    -- Logique de calcul simplifiée
    -- À implémenter selon les règles métier complètes
    
    -- Mise à jour
    UPDATE tdl_complexity_priority
    SET 
        complexity_score = v_score,
        complexity_level = v_level,
        complexity_description = v_description,
        calculated_at = NOW(),
        updated_at = NOW()
    WHERE tdl_id = p_tdl_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE tdl_financial_analysis IS 'Table pour l''analyse commerciale (Bloc B) des demandes TDL';
COMMENT ON TABLE tdl_technical_specs IS 'Table pour les spécifications techniques (Bloc C) des demandes TDL';
COMMENT ON TABLE tdl_complexity_priority IS 'Table pour le calcul automatique de complexité et priorité des demandes TDL';
