-- Migration: 20260315_02_sprint3_logistics_submission
-- Description: Tables pour Sprint 3 - Logistique, Statut, Notifications, Workflow
-- Project: CANLK
-- Date: 2026-03-15

-- ============================================
-- TABLE: Logistique (Bloc D) - CANLK-11
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_logistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE UNIQUE,
    
    -- Bloc D: Logistique
    container_format VARCHAR(50) NOT NULL,
    is_billable BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_logistics_tdl ON tdl_logistics(tdl_id);

-- ============================================
-- UPDATE: tdl_requests - Ajout statut
-- ============================================

ALTER TABLE tdl_requests 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Brouillon',
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id);

-- Index pour performance
CREATE INDEX idx_tdl_status ON tdl_requests(status);
CREATE INDEX idx_tdl_submitted_at ON tdl_requests(submitted_at);

-- ============================================
-- TABLE: Status History - CANLK-12
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Index
CREATE INDEX idx_status_history_tdl ON tdl_status_history(tdl_id);
CREATE INDEX idx_status_history_changed_at ON tdl_status_history(changed_at);

-- ============================================
-- TABLE: Notifications - CANLK-199
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- SUPERVISOR_NOTIFICATION, SALES_CONFIRMATION
    subject TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'SENT',  -- SENT, FAILED, PENDING
    error_message TEXT
);

-- Index
CREATE INDEX idx_notifications_tdl ON tdl_notifications(tdl_id);
CREATE INDEX idx_notifications_recipient ON tdl_notifications(recipient);
CREATE INDEX idx_notifications_sent_at ON tdl_notifications(sent_at);

-- ============================================
-- TABLE: Workflow Logs - CANLK-13
-- ============================================

CREATE TABLE IF NOT EXISTS tdl_workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID REFERENCES tdl_requests(id) ON DELETE CASCADE,
    event VARCHAR(50) NOT NULL,  -- WORKFLOW_STARTED, WORKFLOW_COMPLETED, WORKFLOW_FAILED
    status VARCHAR(20) NOT NULL,  -- SUCCESS, ERROR, PENDING
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    execution_time_ms INTEGER
);

-- Index
CREATE INDEX idx_workflow_logs_tdl ON tdl_workflow_logs(tdl_id);
CREATE INDEX idx_workflow_logs_event ON tdl_workflow_logs(event);
CREATE INDEX idx_workflow_logs_executed_at ON tdl_workflow_logs(executed_at);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE tdl_logistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_workflow_logs ENABLE ROW LEVEL SECURITY;

-- tdl_logistics policies
CREATE POLICY "Users can view logistics" 
    ON tdl_logistics FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

CREATE POLICY "Users can update logistics" 
    ON tdl_logistics FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id)
           OR EXISTS (SELECT 1 FROM tdl_team_members WHERE user_id = auth.uid() AND role = 'admin'));

-- tdl_requests policies (status)
CREATE POLICY "Users can view status" 
    ON tdl_requests FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT user_id FROM tdl_team_members));

CREATE POLICY "Users can update own TDL status" 
    ON tdl_requests FOR UPDATE 
    USING (auth.uid() = user_id);

-- tdl_status_history policies
CREATE POLICY "Users can view status history" 
    ON tdl_status_history FOR SELECT 
    USING (auth.uid() IN (SELECT user_id FROM tdl_requests WHERE id = tdl_id));

-- tdl_notifications - service role only
CREATE POLICY "Service can insert notifications" 
    ON tdl_notifications FOR INSERT 
    WITH CHECK (true);

-- tdl_workflow_logs - service role only
CREATE POLICY "Service can insert workflow logs" 
    ON tdl_workflow_logs FOR INSERT 
    WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Trigger pour mise à jour automatique du statut
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

-- Activer le trigger
DROP TRIGGER IF EXISTS tdl_status_change_trigger ON tdl_requests;
CREATE TRIGGER tdl_status_change_trigger
    AFTER UPDATE OF status ON tdl_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_tdl_status_change();

-- ============================================
-- DATA: Statuts initiaux
-- ============================================

COMMENT ON TABLE tdl_logistics IS 'Table pour la logistique (Bloc D) des demandes TDL';
COMMENT ON TABLE tdl_status_history IS 'Historique des changements de statut des demandes TDL';
COMMENT ON TABLE tdl_notifications IS 'Journal des notifications envoyées pour les demandes TDL';
COMMENT ON TABLE tdl_workflow_logs IS 'Logs d''exécution des workflows automatisés';
