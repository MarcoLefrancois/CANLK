-- Migration : 20260315_003_harden_security_rls.sql
-- Description : Ajout de contraintes de sécurité et helpers RLS (CANLK-14)
-- Guild : ms_engine (Supabase-standard)

-- 1. HELPERS SQL
-- Vérifie si l'utilisateur appartient au département Laboratoire
CREATE OR REPLACE FUNCTION is_lab_tech()
RETURNS BOOLEAN AS $$
BEGIN
  -- Simulé via metadata JWT (standard Supabase/AzureSync)
  RETURN (auth.jwt() ->> 'department') = 'laboratoire';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CONSTRAINTS
-- S'assurer que chaque modification de TDL enregistre qui l'a fait
ALTER TABLE tdl_requests
ADD CONSTRAINT chk_updated_by_not_null CHECK (updated_by IS NOT NULL OR created_at = updated_at);

-- 3. RLS POLICIES (TDL)
-- Règle : Seul le demandeur ou un superviseur peut voir SON TDL
-- (Policy existante élargie)
DROP POLICY IF EXISTS "Users can view their own TDLs" ON tdl_requests;
CREATE POLICY "TDL Data Isolation"
ON tdl_requests FOR SELECT
TO authenticated
USING (
    auth.uid() = requester_id 
    OR is_lab_tech() 
    OR (auth.jwt() ->> 'role') = 'supervisor'
);

COMMENT ON FUNCTION is_lab_tech IS 'Détermine si l utilisateur connecté a les droits d accès laboratoire.';
