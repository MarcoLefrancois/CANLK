-- =============================================================================
-- Migration: 010_migration_schema_support
-- Description: Ajout des tables de référence et extensions pour les données SharePoint
-- Date: 2026-03-15
-- =============================================================================

-- 1. Tables de Référence de Base
CREATE TABLE IF NOT EXISTS tdl_countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tdl_country_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID REFERENCES tdl_countries(id),
    name TEXT NOT NULL,
    code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS tdl_business_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tdl_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tdl_sample_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tdl_sample_formats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sample_type_id UUID REFERENCES tdl_sample_types(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, sample_type_id)
);

CREATE TABLE IF NOT EXISTS tdl_substrates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tdl_sub_substrates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tables de Service et Requêtes
CREATE TABLE IF NOT EXISTS tdl_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_unit_id UUID REFERENCES tdl_business_units(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, business_unit_id)
);

CREATE TABLE IF NOT EXISTS tdl_service_request_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    service_id UUID REFERENCES tdl_services(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, service_id)
);

-- 3. Liaisons et Extensions
CREATE TABLE IF NOT EXISTS tdl_account_bases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    base_id UUID REFERENCES tdl_bases(id) ON DELETE CASCADE,
    external_id TEXT, -- Master ID SharePoint
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, base_id)
);

-- Extension de tdl_samples pour les champs techniques SharePoint
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tdl_samples' AND column_name='substrate_id') THEN
        ALTER TABLE tdl_samples ADD COLUMN substrate_id UUID REFERENCES tdl_substrates(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tdl_samples' AND column_name='sub_substrate_id') THEN
        ALTER TABLE tdl_samples ADD COLUMN sub_substrate_id UUID REFERENCES tdl_sub_substrates(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tdl_samples' AND column_name='luster') THEN
        ALTER TABLE tdl_samples ADD COLUMN luster INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tdl_samples' AND column_name='sanding_grit') THEN
        ALTER TABLE tdl_samples ADD COLUMN sanding_grit INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tdl_samples' AND column_name='product_code') THEN
        ALTER TABLE tdl_samples ADD COLUMN product_code TEXT;
    END IF;
    -- Correction du type sample_type pour utiliser la table de référence si nécessaire
    -- Pour l'instant on garde le champ texte sample_type déjà présent
END $$;

-- 4. RLS pour les nouvelles tables
ALTER TABLE tdl_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_country_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sample_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sample_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_substrates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_sub_substrates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_service_request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tdl_account_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public views tdl_countries" ON tdl_countries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_country_states" ON tdl_country_states FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_business_units" ON tdl_business_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_bases" ON tdl_bases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_sample_types" ON tdl_sample_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_sample_formats" ON tdl_sample_formats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_substrates" ON tdl_substrates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_sub_substrates" ON tdl_sub_substrates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_services" ON tdl_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_service_request_types" ON tdl_service_request_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public views tdl_account_bases" ON tdl_account_bases FOR SELECT TO authenticated USING (true);
