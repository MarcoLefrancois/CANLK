/**
 * CANLK-12: Hook pour la soumission du formulaire TDL
 * 
 * Gère le flux de soumission complet: validation, mise à jour du statut, notifications.
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { validateRequiredFields } from '../../lib/summaryBuilder';

export type TDLStatus = 'Brouillon' | 'Soumis' | 'En Analyse' | 'En Révision' | 'Qualifié' | 'Rejeté';

interface SubmissionResult {
  success: boolean;
  error?: string;
}

interface UseSubmissionProps {
  tdlId: string | null;
  formData: any; // Type complet des données du formulaire
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useSubmission({ tdlId, formData, onSuccess, onError }: UseSubmissionProps) {
  const [status, setStatus] = useState<TDLStatus>('Brouillon');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current status
  const loadStatus = useCallback(async () => {
    if (!tdlId) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('tdl_requests')
        .select('status')
        .eq('id', tdlId)
        .single();

      if (fetchError) throw fetchError;
      
      if (data?.status) {
        setStatus(data.status as TDLStatus);
      }
    } catch (err) {
      console.error('Error loading status:', err);
    }
  }, [tdlId]);

  // Validate form before submission
  const validate = useCallback((): { valid: boolean; missing: string[] } => {
    const missing = validateRequiredFields(formData);
    return {
      valid: missing.length === 0,
      missing,
    };
  }, [formData]);

  // Submit the TDL
  const submit = useCallback(async (): Promise<SubmissionResult> => {
    if (!tdlId) {
      return { success: false, error: 'Aucun TDL sélectionné' };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Validate
      const validation = validate();
      if (!validation.valid) {
        const errorMsg = `Champs obligatoires manquants: ${validation.missing.join(', ')}`;
        setError(errorMsg);
        onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Step 2: Update status to "Soumis"
      const { error: updateError } = await supabase
        .from('tdl_requests')
        .update({ 
          status: 'Soumis',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', tdlId);

      if (updateError) throw updateError;

      // Step 3: Log status change in history
      const { error: historyError } = await supabase
        .from('tdl_status_history')
        .insert({
          tdl_id: tdlId,
          old_status: status,
          new_status: 'Soumis',
        });

      if (historyError) {
        console.error('Warning: Could not log status history:', historyError);
      }

      // Step 4: Trigger notification workflow (async)
      // This will be handled by the Edge Function (CANLK-199/13)
      try {
        await supabase.functions.invoke('submit-workflow', {
          body: { tdl_id: tdlId },
        });
      } catch (fnError) {
        console.error('Warning: Workflow trigger failed:', fnError);
        // Don't fail the submission if the workflow fails
      }

      // Update local status
      setStatus('Soumis');
      onSuccess?.();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de soumission';
      setError(errorMessage);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [tdlId, status, validate, onSuccess, onError]);

  // Check if form is locked
  const isLocked = ['Soumis', 'En Analyse', 'En Révision', 'Qualifié', 'Rejeté'].includes(status);

  return {
    status,
    isSubmitting,
    error,
    isLocked,
    validate,
    submit,
    loadStatus,
  };
}

export default useSubmission;
