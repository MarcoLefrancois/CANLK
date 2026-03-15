-- CANLK-S09: Hypercare & Phase 2 Migration
-- Date: 2026-03-15

-- 1. Create bug reports table
CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
    reported_by VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(255),
    tdl_id UUID REFERENCES tdl_requests(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

-- 2. Create performance monitoring tables
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_text TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    rows_affected INTEGER,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_health_check (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable pg_stat_statements for query analysis
-- Note: This requires superuser access to enable
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 4. Create optimized indexes for large datasets (300k+ records)
CREATE INDEX IF NOT EXISTS idx_tdl_requests_status ON tdl_requests(status);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_region ON tdl_requests(region);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_client_name ON tdl_requests(client_name) WHERE client_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tdl_requests_submission_date ON tdl_requests(submission_date);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_assigned_intervenant ON tdl_requests(assigned_intervenant_id) WHERE assigned_intervenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tdl_requests_created_at ON tdl_requests(created_at DESC);

-- Status history indexes
CREATE INDEX IF NOT EXISTS idx_tdl_status_history_tdl_id ON tdl_status_history(tdl_id);
CREATE INDEX IF NOT EXISTS idx_tdl_status_history_created_at ON tdl_status_history(created_at DESC);

-- 5. Create materialized view for reporting (Power BI)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_tdl_summary AS
SELECT 
    t.id,
    t.tdl_number,
    t.client_name,
    t.formula_id,
    t.status,
    t.region,
    t.priority_level,
    t.created_at,
    t.submission_date,
    t.sla_deadline,
    t.assigned_intervenant_id,
    i.name AS intervenant_name,
    i.region AS intervenant_region,
    EXTRACT(DAYS FROM (COALESCE(t.sla_deadline, NOW()) - t.created_at)) AS sla_days_remaining,
    CASE 
        WHEN t.status = 'qualifie' THEN EXTRACT(DAYS FROM (t.updated_at - t.created_at))
        ELSE NULL 
    END AS turnaround_days
FROM tdl_requests t
LEFT JOIN intervenants i ON t.assigned_intervenant_id = i.id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS mv_tdl_summary_id ON mv_tdl_summary(id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_tdl_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tdl_summary;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS Policies
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_health_check ENABLE ROW LEVEL SECURITY;

-- Bug reports policies
CREATE POLICY "Anyone can read bugs" ON bug_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated can create bugs" ON bug_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update bugs" ON bug_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 7. Auto-refresh summary every hour
-- Note: Requires pg_cron or external scheduler
-- SELECT cron.schedule('refresh-tdl-summary', '0 * * * *', 'SELECT refresh_tdl_summary()');

-- 8. Seed sample bug reports for testing
INSERT INTO bug_reports (title, description, severity, reported_by) VALUES
('Login lent pour les utilisateurs QC', 'Les utilisateurs du Québecexperiencent des temps de connexion de plus de 5 secondes', 'medium', 'Jean Tremblay'),
('Erreur 500 sur génération PDF', 'La génération de rapport PDF échoue pour les formulaires avec photos', 'high', 'Marie Dubois'),
('Tableau de bord ne charge pas', 'Le Master Dashboard affiche un écran blanc après la migration', 'critical', 'John Smith')
ON CONFLICT DO NOTHING;
