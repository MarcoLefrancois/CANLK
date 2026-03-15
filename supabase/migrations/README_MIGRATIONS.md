# Migrations CANLK - Réorganisation

## Situation Actuelle

Les migrations ont été consolidées dans un fichier unique pour éviter les duplications.

### Fichiers existants (obsolètes - à ne plus utiliser)

#### Dossier `database/migrations/`
Ces fichiers sont **obsolètes** et remplacé par la migration consolidée :
- `20260315_001_initial_canlk_schema.sql` → Remplacé
- `20260315_002_add_accounts_table.sql` → Remplacé  
- `20260315_003_harden_security_rls.sql` → Remplacé
- `20260315_004_add_account_extended_fields.sql` → Remplacé

#### Dossier `supabase/migrations/`
Ces fichiers sont **obsolètes** et remplacé par la migration consolidée :
- `20260315_00_initial_setup.sql` → Remplacé
- `20260315_00_fixup.sql` → Remplacé
- `20260315_01_sprint2_tables.sql` → Remplacé
- `20260315_02_sprint3_logistics_submission.sql` → Remplacé
- `20260315_03_sprint4_triage.sql` → Remplacé
- `20260315_04_sprint5_lab.sql` → Remplacé
- `20260315_06_sprint6_closure.sql` → Remplacé
- `20260315_07_sprint7_governance.sql` → Remplacé
- `20260315_08_sprint8_closure.sql` → Remplacé
- `20260315_09_sprint9_hypercare.sql` → Remplacé

### Nouveau fichier consolidé

| Fichier | Description |
|---------|-------------|
| `20260315_000_master_schema_consolidated.sql` | **TOUT** le schéma en un seul fichier |

## Comment utiliser

Pour une **nouvelle installation** :
```bash
supabase db push
# ou
psql -f supabase/migrations/20260315_000_master_schema_consolidated.sql
```

Pour une **mise à jour** (si déjà en prod) :
- Exécuter uniquement les nouvelles modifications ajoutées au fichier consolidé
- OU recréer une base fraîche pour éviter les conflits

## Schéma créé (14 tables)

| Table | Stories |
|-------|---------|
| `accounts` | CANLK-7, CANLK-8 |
| `tdl_requests` | CANLK-6 |
| `tdl_financial` | CANLK-9 |
| `tdl_technical_specs` | CANLK-10 |
| `tdl_test_results` | CANLK-96 |
| `tdl_logistics` | CANLK-11 |
| `tdl_samples` | CANLK-111 |
| `tdl_sops` | CANLK-93, CANLK-108 |
| `tdl_request_sops` | CANLK-93 |
| `tdl_status_history` | CANLK-12, CANLK-205 |
| `tdl_notifications` | CANLK-12, CANLK-114, CANLK-199 |
| `tdl_workflow_logs` | CANLK-13 |
| `tdl_team_members` | CANLK-141 |
| `tdl_departments` | CANLK-141 |
| `tdl_statuses` | CANLK-141 |

---
*Généré par A-SPEC-CODEX le 2026-03-15*
