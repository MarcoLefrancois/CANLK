-- CANLK-S08: Operational Closure Migration
-- Date: 2026-03-15

-- 1. Create intervenants (technicians) configuration table
CREATE TABLE IF NOT EXISTS intervenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('supervisor', 'technician', 'analyst', 'admin')),
    region VARCHAR(3) NOT NULL CHECK (region IN ('QC', 'ON', 'US')),
    departments TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    max_capacity INTEGER DEFAULT 10,
    current_load INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create ERP formulas reference table
CREATE TABLE IF NOT EXISTS erp_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    erp_code VARCHAR(50) NOT NULL UNIQUE,
    formula_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'CAD',
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add ERP linking fields to tdl_requests
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS erp_code VARCHAR(50);
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS erp_linked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tdl_requests ADD COLUMN IF NOT EXISTS assigned_intervenant_id UUID REFERENCES intervenants(id);

-- 4. Create TDL-intervenant assignment history
CREATE TABLE IF NOT EXISTS tdl_intervenant_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tdl_id UUID NOT NULL REFERENCES tdl_requests(id),
    intervenant_id UUID NOT NULL REFERENCES intervenants(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    reason VARCHAR(255)
);

-- 5. RLS Policies
ALTER TABLE intervenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_intervenant_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read active intervenants
CREATE POLICY "Active intervenants are public" ON intervenants
    FOR SELECT USING (is_active = true);

-- Authenticated users can manage intervenants
CREATE POLICY "Auth users can manage intervenants" ON intervenants
    FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can read ERP formulas
CREATE POLICY "Anyone can read ERP formulas" ON erp_formulas
    FOR SELECT USING (is_active = true);

-- Read assignment history
CREATE POLICY "Users can read assignment history" ON tdl_intervenant_history
    FOR SELECT USING (true);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_intervenants_region ON intervenants(region);
CREATE INDEX IF NOT EXISTS idx_intervenants_active ON intervenants(is_active);
CREATE INDEX IF NOT EXISTS idx_erp_formulas_code ON erp_formulas(erp_code);
CREATE INDEX IF NOT EXISTS idx_tdl_erp ON tdl_requests(erp_code) WHERE erp_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tdl_intervenant ON tdl_requests(assigned_intervenant_id) WHERE assigned_intervenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_history_tdl ON tdl_intervenant_history(tdl_id);
CREATE INDEX IF NOT EXISTS idx_history_intervenant ON tdl_intervenant_history(intervenant_id);

-- 7. Function to auto-assign to least loaded intervenant
CREATE OR REPLACE FUNCTION auto_assign_intervenant(
    p_tdl_id UUID,
    p_region VARCHAR,
    p_department VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_intervenant_id UUID;
BEGIN
    SELECT id INTO v_intervenant_id
    FROM intervenants
    WHERE region = p_region
      AND is_active = TRUE
      AND p_department = ANY(departments)
      AND current_load < max_capacity
    ORDER BY current_load ASC
    LIMIT 1;

    IF v_intervenant_id IS NOT NULL THEN
        -- Update TDL
        UPDATE tdl_requests
        SET assigned_intervenant_id = v_intervenant_id
        WHERE id = p_tdl_id;

        -- Update load
        UPDATE intervenants
        SET current_load = current_load + 1
        WHERE id = v_intervenant_id;

        -- Record history
        INSERT INTO tdl_intervenant_history (tdl_id, intervenant_id, assigned_by, reason)
        VALUES (p_tdl_id, v_intervenant_id, NULL, 'Auto-assigned');
    END IF;

    RETURN v_intervenant_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger for updated_at on intervenants
CREATE TRIGGER update_intervenants_updated_at
    BEFORE UPDATE ON intervenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Seed data for QC/ON/US regions
INSERT INTO intervenants (name, email, role, region, departments, max_capacity) VALUES
('Jean Tremblay', 'j.tremblay@canlak.com', 'supervisor', 'QC', ARRAY['Labo QC', 'Révision'], 20),
('Marie Dubois', 'm.dubois@canlak.com', 'technician', 'QC', ARRAY['Labo QC'], 10),
('Pierre Gagnon', 'p.gagnon@canlak.com', 'technician', 'QC', ARRAY['Labo QC'], 10),
('Sophie Martin', 's.martin@canlak.com', 'analyst', 'QC', ARRAY['Labo QC', 'Révision'], 15),
('John Smith', 'j.smith@canlak.com', 'supervisor', 'ON', ARRAY['Labo ON', 'Révision'], 20),
('Mike Johnson', 'm.johnson@canlk.com', 'technician', 'ON', ARRAY['Labo ON'], 10),
('David Brown', 'd.brown@canlk.com', 'technician', 'ON', ARRAY['Labo ON'], 10)
ON CONFLICT (email) DO NOTHING;
