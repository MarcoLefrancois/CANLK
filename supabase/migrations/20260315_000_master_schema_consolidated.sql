-- =============================================================================
-- CANLK - SCHEMA CONSOLIDÉ (Master Migration)
-- =============================================================================
-- Projet: CANLK - Demandes de Tests de Laboratoire
-- Date: 2026-03-15
-- Guild: ms_engine
--
-- Ce fichier consolide toutes les migrations en une séquence cohérente.
-- Ordre d'exécution: 001 → 014
-- =============================================================================

-- =============================================================================
-- 001: SCHÉMA DE BASE & EXTENSIONS
-- =============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 002: TABLE COMPTES (CANLK-7, CANLK-8)
-- =============================================================================

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT, -- ID Dataverse (SSoT)
    name TEXT NOT NULL,
    account_number TEXT,
    city TEXT,
    address TEXT,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Canada',
    phone VARCHAR(50),
    fax VARCHAR(50),
    email VARCHAR(255),
    contact_name TEXT,
    account_manager VARCHAR(255),
    account_type VARCHAR(50) DEFAULT 'Prospect', -- Customer, Prospect
    annual_sales_potential VARCHAR(50),
    sku_potential VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'Customer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche
CREATE INDEX IF NOT EXISTS idx_accounts_name_trgm ON accounts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_accounts_number_trgm ON accounts USING gin (account_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_accounts_city_trgm ON accounts USING gin (city gin_trgm_ops);

-- RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public accounts are viewable by everyone" ON accounts FOR SELECT TO authenticated USING (true);

-- Seed Data
INSERT INTO accounts (name, account_number, city, type, account_type) VALUES 
    ('Armoires Distinction', 'CLI-1001', 'Victoriaville', 'Customer', 'Customer'),
    ('Cuisines Actions', 'CLI-1002', 'Boucherville', 'Customer', 'Customer'),
    ('Ébénisterie du Nord', 'CLI-1003', 'Saint-Jérôme', 'Prospect', 'Prospect')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 003: TABLE TDL REQUESTS (CANLK-6)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_number TEXT UNIQUE DEFAULT 'TDL-' || (nextval('tdl_number_seq')::TEXT),
    
    -- Bloc A: Identification
    business_unit TEXT NOT NULL DEFAULT 'Canlak',
    department_id TEXT NOT NULL,
    requester_id UUID REFERENCES auth.users(id),
    supervisor_id UUID,
    client_id TEXT NOT NULL,
    client_name TEXT,
    contact_name TEXT,
    
    -- Bloc B: Commercial (CANLK-9)
    annual_potential VARCHAR(50),
    estimated_volume INTEGER,
    unit_price DECIMAL(10,2),
    target_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    negotiation_status VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'CAD',
    
    -- Bloc C: Technique (CANLK-10)
    application_type VARCHAR(100),
    brilliance INTEGER,
    drying_type VARCHAR(100),
    is_standard BOOLEAN DEFAULT true,
    
    -- Bloc D: Logistique (CANLK-11)
    container_format VARCHAR(50),
    is_billable BOOLEAN DEFAULT false,
    sample_notes TEXT,
    
    -- Métadonnées
    status VARCHAR(50) DEFAULT 'Brouillon',
    priority VARCHAR(20) DEFAULT 'Normale',
    complexity_score INTEGER,
    
    -- Workflow
    submitted_at TIMESTAMPTZ,
    submitted_by UUID REFERENCES auth.users(id),
    qualified_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Séquence pour numéro TDL (CANLK-135: offset 300000)
CREATE SEQUENCE IF NOT EXISTS tdl_number_seq START WITH 300001;

-- Index
CREATE INDEX IF NOT EXISTS idx_tdl_status ON tdl_requests(status);
CREATE INDEX IF NOT EXISTS idx_tdl_number ON tdl_requests(tdl_number);
CREATE INDEX IF NOT EXISTS idx_tdl_client ON tdl_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_tdl_submitted_at ON tdl_requests(submitted_at);

-- =============================================================================
-- 004: TABLE DONNÉES FINANCIÈRES (CANLK-9)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_financial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    annual_potential VARCHAR(50),
    estimated_volume INTEGER,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    target_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    negotiation_status VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'CAD',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_tdl ON tdl_financial(tdl_id);

-- =============================================================================
-- 005: TABLE SPÉCIFICATIONS TECHNIQUES (CANLK-10)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_technical_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    domain VARCHAR(100),
    sub_domain VARCHAR(100),
    analysis_type VARCHAR(100),
    application_type VARCHAR(100),
    brilliance INTEGER,
    drying_type VARCHAR(100),
    is_standard BOOLEAN DEFAULT true,
    complexity_score INTEGER DEFAULT 1,
    estimated_hours DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technical_tdl ON tdl_technical_specs(tdl_id);

-- =============================================================================
-- 006: TABLE RÉSULTATS DE TESTS (CANLK-96)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    test_type VARCHAR(100),
    conclusion TEXT,
    result_data JSONB,
    test_date TIMESTAMPTZ,
    formula_id VARCHAR(50), -- CANLK-102
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_tdl ON tdl_test_results(tdl_id);

-- =============================================================================
-- 007: TABLE LOGISTIQUE (CANLK-11)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_logistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    container_format VARCHAR(50),
    is_billable BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logistics_tdl ON tdl_logistics(tdl_id);

-- =============================================================================
-- 008: TABLE ÉCHANTILLONS (CANLK-111)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    sample_type VARCHAR(50) NOT NULL, -- Wet, Chips, Panneaux
    quantity INTEGER,
    unit VARCHAR(20),
    description TEXT,
    is_ready BOOLEAN DEFAULT false,
    shipped_at TIMESTAMPTZ,
    tracking_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_samples_tdl ON tdl_samples(tdl_id);

-- =============================================================================
-- 009: TABLE SOPs
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_sops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    version VARCHAR(20),
    file_path VARCHAR(500),
    client_id UUID REFERENCES accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sops_code ON tdl_sops(code);
CREATE INDEX IF NOT EXISTS idx_sops_client ON tdl_sops(client_id);

-- Table de liaison TDL-SOPs
CREATE TABLE IF NOT EXISTS tdl_request_sops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    sop_id UUID REFERENCES tdl_sops(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 010: TABLE HISTORIQUE STATUT (CANLK-12, CANLK-205)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_history_tdl ON tdl_status_history(tdl_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON tdl_status_history(changed_at);

-- =============================================================================
-- 011: TABLE NOTIFICATIONS (CANLK-12, CANLK-114, CANLK-199)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- SUPERVISOR_NOTIFICATION, SAC_ALERT, SALES_CONFIRMATION
    subject TEXT,
    body TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'SENT', -- SENT, FAILED, PENDING
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_tdl ON tdl_notifications(tdl_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON tdl_notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON tdl_notifications(sent_at);

-- =============================================================================
-- 012: TABLE WORKFLOW LOGS (CANLK-13)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_workflow_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    event VARCHAR(50) NOT NULL, -- WORKFLOW_STARTED, WORKFLOW_COMPLETED, WORKFLOW_FAILED
    status VARCHAR(20) NOT NULL, -- SUCCESS, ERROR, PENDING
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_workflow_logs_tdl ON tdl_workflow_logs(tdl_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_event ON tdl_workflow_logs(event);

-- =============================================================================
-- 013: TABLE ÉQUIPE & INTERVENANTS (CANLK-141)
-- =============================================================================

CREATE TABLE IF NOT EXISTS tdl_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(50), -- technician, supervisor, coordinator, admin
    department VARCHAR(100), -- Colors, R&D, SAC
    region VARCHAR(50), -- QC, ON, US
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON tdl_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON tdl_team_members(department);

-- =============================================================================
-- 014: TABLES CONFIGURATION (CANLK-141)
-- =============================================================================

-- Table des départements
CREATE TABLE IF NOT EXISTS tdl_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name_fr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed départements
INSERT INTO tdl_departments (code, name_fr, name_en) VALUES 
    ('VENTES', 'Ventes', 'Sales'),
    ('LABO', 'Laboratoire', 'Laboratory'),
    ('RD', 'R&D', 'R&D'),
    ('SAC', 'Service Après-Vente', 'Customer Service'),
    ('QUALITE', 'Qualité', 'Quality')
ON CONFLICT DO NOTHING;

-- Table des statuts
CREATE TABLE IF NOT EXISTS tdl_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label_fr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255),
    category VARCHAR(50), -- draft, active, completed, rejected
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed statuts
INSERT INTO tdl_statuses (code, label_fr, label_en, category, display_order) VALUES 
    ('Brouillon', 'Brouillon', 'Draft', 'draft', 1),
    ('Soumis', 'Soumis', 'Submitted', 'active', 2),
    ('En Analyse', 'En Analyse', 'In Analysis', 'active', 3),
    ('En Révision', 'En Révision', 'Under Review', 'active', 4),
    ('Qualifié', 'Qualifié', 'Qualified', 'active', 5),
    ('En Expédition', 'En Expédition', 'In Shipment', 'active', 6),
    ('Terminé', 'Terminé', 'Completed', 'completed', 7),
    ('Rejeté', 'Rejeté', 'Rejected', 'rejected', 8)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- TRIGGERS & FONCTIONS
-- =============================================================================

-- Trigger: Mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Activer les triggers sur toutes les tables
CREATE TRIGGER update_tdl_requests_updated_at BEFORE UPDATE ON tdl_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tdl_logistics_updated_at BEFORE UPDATE ON tdl_logistics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger: Historique automatique du statut
CREATE OR REPLACE FUNCTION handle_tdl_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO tdl_status_history (tdl_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tdl_status_change_trigger
    AFTER UPDATE OF status ON tdl_requests
    FOR EACH ROW
    EXECUTE PROCEDURE handle_tdl_status_change();

-- =============================================================================
-- RLS POLICIES CONSOLIDÉES
-- =============================================================================

-- tdl_requests
ALTER TABLE tdl_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own TDL" ON tdl_requests FOR SELECT 
    USING (auth.uid() = requester_id OR auth.uid() = supervisor_id OR exists (select 1 from tdl_team_members where user_id = auth.uid() and role in ('supervisor', 'admin')));

CREATE POLICY "Users can create TDL" ON tdl_requests FOR INSERT 
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own Draft TDL" ON tdl_requests FOR UPDATE 
    USING (auth.uid() = requester_id AND status = 'Brouillon');

-- tdl_logistics
ALTER TABLE tdl_logistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view logistics" ON tdl_logistics FOR SELECT USING (true);

-- tdl_status_history
ALTER TABLE tdl_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view status history" ON tdl_status_history FOR SELECT USING (true);

-- tdl_notifications
ALTER TABLE tdl_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can insert notifications" ON tdl_notifications FOR INSERT WITH CHECK (true);

-- tdl_workflow_logs
ALTER TABLE tdl_workflow_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service can insert workflow logs" ON tdl_workflow_logs FOR INSERT WITH CHECK (true);

-- tdl_team_members
ALTER TABLE tdl_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view team" ON tdl_team_members FOR SELECT USING (true);

-- tdl_departments & tdl_statuses (lecture seule pour tous)
ALTER TABLE tdl_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view departments" ON tdl_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view statuses" ON tdl_statuses FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE accounts IS 'Cache local des comptes clients同步 depuis Dataverse (SSoT).';
COMMENT ON TABLE tdl_requests IS 'Stockage central des demandes de tests de laboratoire (TDL).';
COMMENT ON TABLE tdl_logistics IS 'Table pour la logistique (Bloc D) des demandes TDL.';
COMMENT ON TABLE tdl_status_history IS 'Historique des changements de statut des demandes TDL.';
COMMENT ON TABLE tdl_notifications IS 'Journal des notifications envoyées pour les demandes TDL.';
COMMENT ON TABLE tdl_workflow_logs IS 'Logs d''exécution des workflows automatisés.';
