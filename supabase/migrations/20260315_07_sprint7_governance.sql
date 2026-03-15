-- CANLK-S07: Governance & Operations Readiness Migration
-- Date: 2026-03-15

-- 1. Add regional support fields
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS region VARCHAR(3) DEFAULT 'QC';
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'medium';
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP;
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS is_legacy BOOLEAN DEFAULT FALSE;
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS legacy_id UUID;

-- 2. Create role-based access control tables
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supervisor_qc', 'supervisor_on', 'technician', 'sales', 'viewer')),
    region VARCHAR(3) CHECK (region IN ('QC', 'ON', 'US')),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 3. Create regional configuration table
CREATE TABLE IF NOT EXISTS regional_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(3) NOT NULL UNIQUE CHECK (region IN ('QC', 'ON', 'US')),
    language VARCHAR(2) NOT NULL CHECK (language IN ('fr', 'en')),
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('CAD', 'USD')),
    timezone VARCHAR(50) NOT NULL,
    lab_start_time TIME NOT NULL,
    lab_end_time TIME NOT NULL,
    sla_critical_hours INTEGER DEFAULT 24,
    sla_high_hours INTEGER DEFAULT 48,
    sla_medium_hours INTEGER DEFAULT 72,
    sla_low_hours INTEGER DEFAULT 168,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert regional configs
INSERT INTO regional_config (region, language, currency, timezone, lab_start_time, lab_end_time) VALUES
('QC', 'fr', 'CAD', 'America/Toronto', '08:00', '17:00'),
('ON', 'en', 'CAD', 'America/Toronto', '08:00', '17:00'),
('US', 'en', 'USD', 'America/New_York', '08:00', '18:00')
ON CONFLICT (region) DO NOTHING;

-- 4. Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type VARCHAR(50) NOT NULL,
    subject_fr TEXT NOT NULL,
    body_fr TEXT NOT NULL,
    subject_en TEXT NOT NULL,
    body_en TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'teams', 'all')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create audit log for RBAC
CREATE TABLE IF NOT EXISTS rbac_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RLS Policies for RBAC
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- User can read their own roles
CREATE POLICY "Users can read own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles" ON user_roles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

-- Read access to regional config
CREATE POLICY "Anyone can read regional config" ON regional_config
    FOR SELECT USING (true);

-- Read access to notification templates
CREATE POLICY "Active users can read templates" ON notification_templates
    FOR SELECT USING (is_active = true);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tdl_requests_region ON tdl_requests(region);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_priority ON tdl_requests(priority_level);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_sla ON tdl_requests(sla_deadline) WHERE sla_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tdl_requests_legacy ON tdl_requests(is_legacy) WHERE is_legacy = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_user ON rbac_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_audit_created ON rbac_audit_log(created_at);

-- 8. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Function to calculate SLA deadline
CREATE OR REPLACE FUNCTION calculate_sla_deadline(
    p_priority VARCHAR,
    p_region VARCHAR
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_hours INTEGER;
BEGIN
    SELECT CASE p_priority
        WHEN 'critical' THEN sla_critical_hours
        WHEN 'high' THEN sla_high_hours
        WHEN 'medium' THEN sla_medium_hours
        ELSE sla_low_hours
    END INTO v_hours
    FROM regional_config
    WHERE region = p_region;

    RETURN NOW() + (v_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to route to department based on region
CREATE OR REPLACE FUNCTION get_routing_department(
    p_region VARCHAR,
    p_priority VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_department VARCHAR;
BEGIN
    -- Map priority to department suffix
    IF p_priority = 'critical' THEN
        v_department := ' Prioritaire';
    ELSE
        v_department := '';
    END IF;

    RETURN 'Labo ' || p_region || v_department;
END;
$$ LANGUAGE plpgsql;
