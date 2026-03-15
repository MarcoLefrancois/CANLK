-- Migration : 20260315_002_add_accounts_table.sql
-- Description : Ajout de la table des comptes clients pour le Lookup SMART-AC (CANLK-7)
-- Guild : ms_engine (Supabase-standard)

-- 1. TABLES
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE, -- ID Dataverse (SSoT)
    name TEXT NOT NULL,
    account_number TEXT UNIQUE,
    city TEXT,
    address TEXT,
    phone TEXT,
    contact_name TEXT,
    is_active BOOLEAN DEFAULT true,
    type TEXT DEFAULT 'Customer', -- Customer, Prospect
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PERFORMANCE (GIN Index pour recherche textuelle)
-- Note : Utilise pg_trgm pour la recherche partielle efficace
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_accounts_name_trgm ON accounts USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_accounts_number_trgm ON accounts USING gin (account_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_accounts_city_trgm ON accounts USING gin (city gin_trgm_ops);

-- 3. RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Les comptes sont visibles par tous les utilisateurs authentifiés (Lecture seule)
CREATE POLICY "Public accounts are viewable by everyone" 
ON accounts FOR SELECT 
TO authenticated 
USING (true);

-- 4. SEED DATA (Exemples pour démo / Sprint 01)
INSERT INTO accounts (name, account_number, city, type)
VALUES 
('Armoires Distinction', 'CLI-1001', 'Victoriaville', 'Customer'),
('Cuisines Actions', 'CLI-1002', 'Boucherville', 'Customer'),
('Ébénisterie du Nord', 'CLI-1003', 'Saint-Jérôme', 'Prospect')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE accounts IS 'Cache local des comptes clients synchronisés depuis Dataverse (SSoT).';
