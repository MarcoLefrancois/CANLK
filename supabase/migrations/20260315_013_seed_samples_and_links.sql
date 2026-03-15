-- =============================================================================
-- Migration: 013_seed_samples_and_links
-- Description: Liaisons Account-Bases et extension des échantillons
-- Date: 2026-03-15
-- =============================================================================

-- 1. Liaisons Account-Bases (AccountBases)
-- On utilise des jointures sur les noms pour retrouver les UUIDs
INSERT INTO tdl_account_bases (account_id, base_id, external_id)
SELECT a.id, b.id, 'TWW-000'
FROM accounts a, tdl_bases b
WHERE a.name = 'Bois de Plancher P.G. inc' AND b.name = 'TWW-000'
UNION ALL
SELECT a.id, b.id, 'TWW-000'
FROM accounts a, tdl_bases b
WHERE a.name = 'Meubles Dine-Art Inc.' AND b.name = 'TWW-000'
UNION ALL
SELECT a.id, b.id, '885-031'
FROM accounts a, tdl_bases b
WHERE a.name = 'escalier évolution' AND b.name = '885-031'
UNION ALL
SELECT a.id, b.id, 'TP-000'
FROM accounts a, tdl_bases b
WHERE a.name = 'Préverco inc.' AND b.name = 'TP-000'
UNION ALL
SELECT a.id, b.id, 'TP-001'
FROM accounts a, tdl_bases b
WHERE a.name = 'Préverco inc.' AND b.name = 'TP-001'
ON CONFLICT DO NOTHING;

-- 2. Échantillons TDL (TDLSamples)
-- Note: Dans un environnement réel, ces lignes seraient liées à des tdl_requests existantes.
-- Ici on simule l'injection de données techniques pour démonstration.
-- On insère dans tdl_samples (en supposant que des tdl_requests existent ou en créant des placeholders)

-- Pour la démonstration, on met à jour les échantillons existants s'ils existent ou on en crée des nouveaux liés à un compte.
-- Comme tdl_samples nécessite un tdl_id, et que le seed initial n'en a pas beaucoup,
-- on se concentre sur la validation de la structure technique.

-- Exemple d'insertion d'échantillon technique complet
INSERT INTO tdl_samples (sample_type, quantity, unit, description, product_code, luster, substrate_id, sub_substrate_id)
SELECT 
    'Solid(e)', 15, 'Unité', 'Échantillon merisier plaqué', 'RT-90-57', 150,
    (SELECT id FROM tdl_substrates WHERE name = 'merisier'),
    (SELECT id FROM tdl_sub_substrates WHERE name = 'Plaqué/Plated')
LIMIT 1;
