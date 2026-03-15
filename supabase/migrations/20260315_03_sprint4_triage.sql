-- Migration: 20260315_03_sprint4_triage
-- Description: Tables pour Sprint 4 - Triage, Techniciens, Améliorations Stage Log
-- Project: CANLK
-- Date: 2026-03-15

-- ============================================
-- TABLE: Techniciens - CANLK-197
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    department VARCHAR(50) NOT NULL,
    current_load INTEGER DEFAULT 0,
    max_load INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_technicians_department ON tdl_technicians(department);
CREATE INDEX idx_technicians_user ON tdl_technicians(user_id);
CREATE INDEX idx_technicians_active ON tdl_technicians(is_active);

-- ============================================
-- TABLE: Triage Queue - CANLK-197
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_triage_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    department VARCHAR(50) NOT NULL,
    assigned_technician UUID REFERENCES tdl_technicians(id),
    assigned_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_triage_department ON tdl_triage_queue(department);
CREATE INDEX idx_triage_technician ON tdl_triage_queue(assigned_technician);
CREATE INDEX idx_triage_sla ON tdl_triage_queue(sla_deadline);

-- ============================================
-- TABLE: Départements - CANLK-197
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    default_supervisor_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default departments
INSERT INTO tdl_departments (code, name, name_en, is_active) VALUES
    ('colors_qc', 'Couleurs Québec', 'Colors Quebec', true),
    ('colors_on', 'Couleurs Ontario', 'Colors Ontario', true),
    ('rd_qc', 'R&D Québec', 'R&D Quebec', true),
    ('rd_on', 'R&D Ontario', 'R&D Ontario', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- UPDATE: tdl_status_history - CANLK-205
-- ============================================

-- Add missing columns if they don't exist
ALTER TABLE tdl_status_history 
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ============================================
-- UPDATE: tdl_requests - Additional fields
-- ============================================

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS assigned_technician UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_department VARCHAR(50),
ADD COLUMN IF NOT EXISTS sla_breach BOOLEAN DEFAULT false;

-- Index
CREATE INDEX idx_tdl_assigned_technician ON tdl_requests(assigned_technician);
CREATE INDEX idx_tdl_assigned_at ON tdl_requests(assigned_at);
CREATE INDEX idx_tdl_sla_breach ON tdl_requests(sla_breach);

-- ============================================
-- TABLE: SLA Alerts - CANLK-197
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_sla_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL,  -- REMINDER, BREACH
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    recipient VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING'
);

-- Index
CREATE INDEX idx_sla_alerts_tdl ON tdl_sla_alerts(tdl_id);
CREATE INDEX idx_sla_alerts_sent ON tdl_sla_alerts(sent_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE tdl_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_triage_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sla_alerts ENABLE ROW LEVEL SECURITY;

-- tdl_technicians policies
CREATE POLICY "Users can view technicians" 
    ON tdl_technicians FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Service can manage technicians" 
    ON tdl_technicians FOR ALL 
    USING (true);

-- tdl_triage_queue policies
CREATE POLICY "Supervisors can view triage queue" 
    ON tdl_triage_queue FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT user_id FROM tdl_team_members 
            WHERE role IN ('supervisor', 'admin')
        )
    );

CREATE POLICY "Service can manage triage queue" 
    ON tdl_triage_queue FOR ALL 
    USING (true);

-- tdl_departments policies
CREATE POLICY "All can view departments" 
    ON tdl_departments FOR SELECT 
    USING (is_active = true);

-- tdl_sla_alerts policies
CREATE POLICY "Supervisors can view SLA alerts" 
    ON tdl_sla_alerts FOR SELECT 
    USING (true);

CREATE POLICY "Service can manage SLA alerts" 
    ON tdl_sla_alerts FOR ALL 
    USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to calculate technician load
CREATE OR REPLACE FUNCTION update_technician_load()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate load
    UPDATE tdl_technicians
    SET current_load = (
        SELECT COUNT(*) 
        FROM tdl_requests 
        WHERE assigned_technician = NEW.assigned_technician 
        AND status NOT IN ('Terminé', 'Rejeté', 'Brouillon')
    ),
    updated_at = NOW()
    WHERE id = NEW.assigned_technician;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for load update
DROP TRIGGER IF EXISTS trigger_update_technician_load ON tdl_requests;
CREATE TRIGGER trigger_update_technician_load
    AFTER UPDATE OF assigned_technician ON tdl_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_technician_load();

-- Function to check SLA
CREATE OR REPLACE FUNCTION check_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Soumis' AND OLD.status IS DISTINCT FROM 'Soumis' THEN
        -- Set SLA deadline (24 hours from now)
        NEW.sla_deadline = NOW() + INTERVAL '24 hours';
    END IF;
    
    IF NEW.status = 'Soumis' AND NEW.sla_deadline < NOW() THEN
        NEW.sla_breach = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for SLA check
DROP TRIGGER IF EXISTS trigger_check_sla ON tdl_requests;
CREATE TRIGGER trigger_check_sla
    BEFORE UPDATE ON tdl_requests
    FOR EACH ROW
    EXECUTE FUNCTION check_sla_breach();

-- ============================================
-- VIEW: Triage Dashboard View
-- ============================================

CREATE OR REPLACE VIEW v_triage_dashboard AS
SELECT 
    t.id,
    t.tdl_number,
    t.client_name,
    t.department,
    t.priority,
    t.status,
    t.submitted_at,
    t.complexity_score,
    t.assigned_technician,
    t.sla_deadline,
    t.sla_breach,
    CASE 
        WHEN t.sla_deadline < NOW() THEN true 
        ELSE false 
    END as is_overdue,
    tech.name as technician_name
FROM tdl_requests t
LEFT JOIN tdl_technicians tech ON t.assigned_technician = tech.user_id
WHERE t.status IN ('Soumis', 'En Cours - Labo', 'Info Requise');

COMMENT ON TABLE tdl_technicians IS 'Table des techniciens par département pour le triage';
COMMENT ON TABLE tdl_triage_queue IS 'File d''attente du triage par département';
COMMENT ON TABLE tdl_departments IS 'Départements disponibles pour le routage';
COMMENT ON TABLE tdl_sla_alerts IS 'Alertes SLA pour le monitoring';
