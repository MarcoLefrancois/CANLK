-- =============================================================================
-- Migration: 011_seed_reference_data
-- Description: Données de référence extraites de SharePoint
-- Date: 2026-03-15
-- =============================================================================

-- 1. Bases
INSERT INTO tdl_bases (name) VALUES 
    ('501-010'), ('501-007'), ('459-000'), ('S602-000'), ('S600-002'), 
    ('885-031'), ('TWW-000'), ('TP-000'), ('TP-001'), ('721-003'), 
    ('HR-1500'), ('3491-106'), ('WRS-001'), ('TEK-002'), ('300-012'), ('MX-29-09')
ON CONFLICT (name) DO NOTHING;

-- 2. Countries
INSERT INTO tdl_countries (name, code) VALUES 
    ('CANADA', 'CA'),
    ('USA', 'USA'),
    ('BE', 'BE'),
    ('DO', 'DO'),
    ('ESP', 'ESP'),
    ('IT', 'IT'),
    ('UK', 'UK')
ON CONFLICT (name) DO NOTHING;

-- 3. States / Provinces
INSERT INTO tdl_country_states (country_id, name, code) 
SELECT id, 'Alabama', 'AL' FROM tdl_countries WHERE name = 'USA' UNION ALL
SELECT id, 'Alaska', 'AK' FROM tdl_countries WHERE name = 'USA' UNION ALL
SELECT id, 'Alberta', 'AB' FROM tdl_countries WHERE name = 'CANADA' UNION ALL
SELECT id, 'Arizona', 'AZ' FROM tdl_countries WHERE name = 'USA' UNION ALL
SELECT id, 'Arkansas', 'AR' FROM tdl_countries WHERE name = 'USA' UNION ALL
SELECT id, 'British Columbia', 'BC' FROM tdl_countries WHERE name = 'CANADA' UNION ALL
SELECT id, 'California', 'CA' FROM tdl_countries WHERE name = 'USA' UNION ALL
SELECT id, 'Quebec', 'QC' FROM tdl_countries WHERE name = 'CANADA' UNION ALL
SELECT id, 'Ontario', 'ON' FROM tdl_countries WHERE name = 'CANADA' UNION ALL
SELECT id, 'New Brunswick', 'NB' FROM tdl_countries WHERE name = 'CANADA'
ON CONFLICT DO NOTHING;

-- 4. Business Units
INSERT INTO tdl_business_units (name) VALUES ('Canlak') 
ON CONFLICT (name) DO NOTHING;

-- 5. Substrates
INSERT INTO tdl_substrates (name) VALUES 
    ('Acajou/Mahogany'), ('Bouleau/Birch'), ('Cerisier/Cherry Tree'), 
    ('Chêne/Oak'), ('merisier'), ('MDF/MDF'), ('Érable/Maple')
ON CONFLICT (name) DO NOTHING;

-- 6. Sub-Substrates
INSERT INTO tdl_sub_substrates (name) VALUES 
    ('Massif/Solid'), ('Plaqué/Plated')
ON CONFLICT (name) DO NOTHING;

-- 7. Sample Types
INSERT INTO tdl_sample_types (name) VALUES 
    ('Liquid(e)'), ('Solid(e)'), ('Rapport/Report')
ON CONFLICT (name) DO NOTHING;

-- 8. Sample Formats
INSERT INTO tdl_sample_formats (name, sample_type_id) 
SELECT '0.946 L', id FROM tdl_sample_types WHERE name = 'Liquid(e)' UNION ALL
SELECT '2.78 L', id FROM tdl_sample_types WHERE name = 'Liquid(e)' UNION ALL
SELECT '3.78 L', id FROM tdl_sample_types WHERE name = 'Liquid(e)' UNION ALL
SELECT '18.9 L', id FROM tdl_sample_types WHERE name = 'Liquid(e)' UNION ALL
SELECT '19 L', id FROM tdl_sample_types WHERE name = 'Liquid(e)' UNION ALL
SELECT 'Panneau / Panel', id FROM tdl_sample_types WHERE name = 'Solid(e)'
ON CONFLICT DO NOTHING;

-- 9. Services
INSERT INTO tdl_services (name, business_unit_id)
SELECT 'R&D', id FROM tdl_business_units WHERE name = 'Canlak' UNION ALL
SELECT 'Colors Québec', id FROM tdl_business_units WHERE name = 'Canlak' UNION ALL
SELECT 'Colors Ontario', id FROM tdl_business_units WHERE name = 'Canlak' UNION ALL
SELECT 'Environnement', id FROM tdl_business_units WHERE name = 'Canlak'
ON CONFLICT DO NOTHING;

-- 10. Service Request Types
INSERT INTO tdl_service_request_types (name, service_id)
SELECT 'Solvant-Solvent', id FROM tdl_services WHERE name = 'R&D' UNION ALL
SELECT 'Eau-Water', id FROM tdl_services WHERE name = 'R&D' UNION ALL
SELECT 'UV', id FROM tdl_services WHERE name = 'R&D'
ON CONFLICT DO NOTHING;
