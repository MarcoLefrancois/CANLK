-- =============================================================================
-- Migration: 012_seed_accounts_extra_data
-- Description: Seed des comptes clients extraits de SharePoint
-- Date: 2026-03-15
-- =============================================================================

INSERT INTO accounts (name, account_number, country, state, account_manager, type) VALUES 
    ('3 AXIS, INC.', 'CIC', 'CANADA', 'QC', 'Martin Coupal', 'Customer'),
    ('3777472 Canada Inc. (Saman)', 'PEIS04', 'CANADA', 'QC', 'Martin Coupal', 'Customer'),
    ('625540 NB LTD', 'DOMQ01', 'CANADA', 'NB', 'CANLAK inc.', 'Customer'),
    ('8868212 Canada Inc.', 'MBOI01', 'CANADA', 'QC', 'CANLAK inc.', 'Customer'),
    ('Armoires de Cuisine Bernier Inc.', 'ABER01', 'CANADA', 'QC', 'CANLAK inc.', 'Customer'),
    ('Bois de Plancher P.G. inc', 'PGFL01', 'CANADA', 'QC', 'CANLAK inc.', 'Customer'),
    ('Meubles Dine-Art Inc.', 'DINE01', 'CANADA', 'QC', 'Martin Coupal', 'Customer'),
    ('Préverco inc.', 'PREV01', 'CANADA', 'QC', 'Martin Coupal', 'Customer'),
    ('escalier évolution', 'EVOL01', 'CANADA', 'QC', 'Martin Coupal', 'Customer')
ON CONFLICT DO NOTHING;
