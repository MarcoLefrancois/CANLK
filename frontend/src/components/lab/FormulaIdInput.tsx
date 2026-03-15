/**
 * CANLK-102: FormulaIdInput - Saisie du Formula ID ERP Maximum
 * 
 * @version Sprint 5 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { supabase } from '../../lib/supabase';

interface FormulaIdInputProps {
  tdlId: string | null;
  readOnly?: boolean;
  onChange?: (formulaId: string) => void;
}

const FORMULA_ID_REGEX = /^[a-zA-Z0-9]*$/;
const MAX_LENGTH = 15;

export function FormulaIdInput({ tdlId, readOnly = false, onChange }: FormulaIdInputProps) {
  const [formulaId, setFormulaId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing formula ID
  useEffect(() => {
    const loadFormulaId = async () => {
      if (!tdlId) return;
      
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('tdl_formula_ids')
          .select('formula_id')
          .eq('tdl_id', tdlId)
          .single();

        if (fetchError) throw fetchError;

        if (data?.formula_id) {
          setFormulaId(data.formula_id);
        }
      } catch (err) {
        console.error('Error loading formula ID:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormulaId();
  }, [tdlId]);

  const validateAndSave = async (value: string) => {
    setError(null);
    setSuccess(false);

    // Validate format
    if (value && !FORMULA_ID_REGEX.test(value)) {
      setError('Format invalide. Utilisez uniquement des lettres et chiffres.');
      return;
    }

    if (value && value.length > MAX_LENGTH) {
      setError(`Maximum ${MAX_LENGTH} caractères autorisés.`);
      return;
    }

    // Auto-uppercase
    const upperValue = value.toUpperCase();
    setFormulaId(upperValue);
    onChange?.(upperValue);

    if (!tdlId || readOnly) return;

    // Save to database
    try {
      const { error: upsertError } = await supabase
        .from('tdl_formula_ids')
        .upsert({
          tdl_id: tdlId,
          formula_id: upperValue,
          validated_at: upperValue ? new Date().toISOString() : null,
        }, { onConflict: 'tdl_id' });

      if (upsertError) throw upsertError;

      if (upperValue) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de sauvegarde');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, MAX_LENGTH);
    setFormulaId(value);
  };

  const handleBlur = () => {
    validateAndSave(formulaId);
  };

  return (
    <Card className="formula-id-input">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>🔢</span>
          <span>Formula ID (ERP Maximum)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="formulaId">
            Numéro de recette
          </Label>
          <input
            id="formulaId"
            type="text"
            value={formulaId}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={readOnly || loading}
            placeholder="Ex: F2026ABC"
            className={`w-full px-3 py-2 border rounded-md font-mono uppercase ${
              error ? 'border-red-500' : success ? 'border-green-500' : ''
            }`}
            maxLength={MAX_LENGTH}
          />
          <p className="text-xs text-gray-500">
            Saisissez le numéro de recette ERP Maximum. Maximum {MAX_LENGTH} caractères alphanumériques.
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success indicator */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            ✓ Formula ID enregistré
          </div>
        )}

        {/* Info box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            ℹ️ Ce champ permet de lier le TDL à une recette dans l'ERP Maximum.
            La modification sera journalisée dans l'historique.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default FormulaIdInput;
