-- ============================================================================
-- SCHÉMA CANLK - Base de données Supabase
-- Projet: CANLK - Travaux de Laboratoire
-- Stack: PostgreSQL / Supabase
-- Date: 2026-03-15
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- UUID pour les clés primaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    region TEXT CHECK (region IN ('QC', 'ON')) NOT NULL DEFAULT 'QC',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table principale des demandes TDL
CREATE TABLE IF NOT EXISTS tdl_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_number TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN (
        'draft', 
        'submitted', 
        'in_analysis', 
        'in_review', 
        'qualified', 
        'rejected', 
        'completed'
    )) DEFAULT 'draft',
    
    -- Références
    client_id UUID REFERENCES clients(id),
    vendor_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    
    -- Bloc A - Identification
    sample_description TEXT,
    sample_quantity INTEGER DEFAULT 1,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des séquences (pour CANLK-135)
CREATE TABLE IF NOT EXISTS tdl_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prefix TEXT NOT NULL DEFAULT 'TDL',
    current_value INTEGER NOT NULL DEFAULT 300000,
    offset INTEGER NOT NULL DEFAULT 300000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des rôles utilisateurs
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'vendor', 'lab_tech', 'supervisor', 'viewer')) NOT NULL,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour générer le numéro TDL (CANLK-135)
CREATE OR REPLACE FUNCTION generate_tdl_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    seq_record RECORD;
    new_number TEXT;
BEGIN
    -- Récupérer la séquence active
    SELECT * INTO seq_record 
    FROM tdl_sequences 
    WHERE is_active = true 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Si aucune séquence, créer la valeur par défaut
    IF NOT FOUND THEN
        seq_record.current_value := 300000;
        seq_record.offset := 300000;
        seq_record.prefix := 'TDL';
    END IF;
    
    -- Incrémenter la valeur
    seq_record.current_value := seq_record.current_value + 1;
    
    -- Mettre à jour la séquence
    UPDATE tdl_sequences 
    SET current_value = seq_record.current_value, 
        updated_at = NOW() 
    WHERE id = seq_record.id;
    
    -- Générer le numéro
    new_number := seq_record.prefix || '-' || seq_record.current_value::TEXT;
    
    RETURN new_number;
END;
$$;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger pour updated_at sur tdl_requests
CREATE TRIGGER update_tdl_requests_updated_at
    BEFORE UPDATE ON tdl_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger pour updated_at sur clients
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Trigger pour générer automatiquement le numéro TDL
CREATE TRIGGER generate_tdl_number_trigger
    BEFORE INSERT ON tdl_requests
    FOR EACH ROW
    WHEN (NEW.tdl_number IS NULL)
    EXECUTE FUNCTION generate_tdl_number();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - CANLK-14
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES RLS
-- ============================================================================

-- Clients: Tous les utilisateurs authentifiés peuvent voir
CREATE POLICY "clients_select_authenticated" 
    ON clients FOR SELECT 
    TO authenticated
    USING (is_active = true);

-- Clients: Seul l'admin peut modifier
CREATE POLICY "clients_manage_admin" 
    ON clients FOR ALL 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
            AND ur.is_active = true
        )
    );

-- TDL Requests: Vendeur voit ses propres demandes
CREATE POLICY "tdl_requests_vendor_select" 
    ON tdl_requests FOR SELECT 
    TO authenticated
    USING (
        vendor_id = auth.uid() 
        OR created_by = auth.uid()
    );

-- TDL Requests: Vendor peut créer
CREATE POLICY "tdl_requests_vendor_insert" 
    ON tdl_requests FOR INSERT 
    TO authenticated
    WITH CHECK (vendor_id = auth.uid() OR created_by = auth.uid());

-- TDL Requests: Vendor peut modifier ses brouillons
CREATE POLICY "tdl_requests_vendor_update" 
    ON tdl_requests FOR UPDATE 
    TO authenticated
    USING (
        (vendor_id = auth.uid() OR created_by = auth.uid())
        AND status = 'draft'
    );

-- TDL Requests: Superviseur voit tout
CREATE POLICY "tdl_requests_supervisor_select" 
    ON tdl_requests FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'supervisor'
            AND ur.is_active = true
        )
    );

-- TDL Requests: Lab Tech voit tout
CREATE POLICY "tdl_requests_labtech_select" 
    ON tdl_requests FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'lab_tech'
            AND ur.is_active = true
        )
    );

-- ============================================================================
-- INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tdl_requests_status ON tdl_requests(status);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_client ON tdl_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_vendor ON tdl_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tdl_requests_created ON tdl_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_region ON clients(region);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

-- Insérer une séquence par défaut
INSERT INTO tdl_sequences (prefix, current_value, offset)
VALUES ('TDL', 300000, 300000)
ON CONFLICT DO NOTHING;

-- Insérer des clients exemples
INSERT INTO clients (code, name, region, contact_email) VALUES
    ('C001', 'Académie de Laboratoire QC', 'QC', 'contact@academie-qc.ca'),
    ('C002', 'Laboratoire Ontario Inc', 'ON', 'info@lab-on.ca'),
    ('C003', 'Centre de Recherche Est', 'QC', 'recherche@centre-qc.ca')
ON CONFLICT (code) DO NOTHING;
