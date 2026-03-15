-- Migration : 20260315_001_initial_canlk_schema.sql
-- Description : Initialisation du schéma pour les requêtes TDL (CANLK-6 & CANLK-135)
-- Guild : ms_engine (Supabase-standard)

-- 1. EXTENSIONS & TYPES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE tdl_status AS ENUM ('Draft', 'Submitted', 'In Progress', 'Completed', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. SEQUENCES (CANLK-135 : Offset 300 000)
CREATE SEQUENCE IF NOT EXISTS tdl_number_seq START WITH 300001;

-- 3. TABLES
CREATE TABLE IF NOT EXISTS tdl_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tdl_number TEXT UNIQUE DEFAULT 'TDL-' || nextval('tdl_number_seq')::TEXT,
    
    -- [Bloc A : Identification]
    business_unit TEXT NOT NULL DEFAULT 'Canlak',
    department_id TEXT NOT NULL, -- Référence au département (ex: Ventes, Labo)
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    supervisor_id UUID, -- People Picker
    client_id TEXT NOT NULL, -- Référence au client (Account ID)
    contact_name TEXT,
    
    -- Métadonnées de statut
    status tdl_status NOT NULL DEFAULT 'Draft',
    
    -- Audit A-SPEC
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- 4. SECURITY (RLS - CANLK-14)
ALTER TABLE tdl_requests ENABLE ROW LEVEL SECURITY;

-- Politique : Voir ses propres requêtes (ou être superviseur/admin)
CREATE POLICY "Users can view their own TDL requests" 
ON tdl_requests FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = supervisor_id);

-- Politique : Créer ses propres requêtes
CREATE POLICY "Users can insert their own TDL requests" 
ON tdl_requests FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

-- Politique : Modifier ses propres requêtes tant qu'elles sont en 'Draft'
CREATE POLICY "Users can update their own Draft requests" 
ON tdl_requests FOR UPDATE 
USING (auth.uid() = requester_id AND status = 'Draft');

-- 5. TRIGGER POUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tdl_requests_updated_at
    BEFORE UPDATE ON tdl_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE tdl_requests IS 'Stockage central des demandes de tests de laboratoire (TDL) pour le projet CANLK.';
