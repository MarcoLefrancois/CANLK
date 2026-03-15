/**
 * CANLK-12: SubmitButton - Bouton de soumission du formulaire TDL
 * 
 * Gère la soumission du formulaire, la validation et le verrouillage.
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent front_nexus + ms_engine
 */

import { useState } from 'react';
import { Button } from '../ui/button';

export type TDLStatus = 'Brouillon' | 'Soumis' | 'En Analyse' | 'En Révision' | 'Qualifié' | 'Rejeté';

interface SubmitButtonProps {
  currentStatus: TDLStatus;
  onSubmit: () => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
  disabled?: boolean;
}

const STATUS_LABELS: Record<TDLStatus, string> = {
  'Brouillon': 'Soumettre',
  'Soumis': 'Soumis',
  'En Analyse': 'En cours...',
  'En Révision': 'En révision',
  'Qualifié': 'Qualifié',
  'Rejeté': 'Rejeté',
};

export function SubmitButton({ 
  currentStatus, 
  onSubmit, 
  isLoading = false,
  disabled = false 
}: SubmitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = ['Soumis', 'En Analyse', 'En Révision', 'Qualifié', 'Rejeté'].includes(currentStatus);
  const canSubmit = currentStatus === 'Brouillon' && !disabled;

  const handleClick = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit();
      
      if (!result.success) {
        setError(result.error || 'Erreur lors de la soumission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-button-container">
      {isLocked ? (
        <Button 
          disabled 
          className="bg-gray-400 cursor-not-allowed"
        >
          {STATUS_LABELS[currentStatus]}
        </Button>
      ) : (
        <Button 
          onClick={handleClick}
          disabled={!canSubmit || isSubmitting || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Soumission...' : STATUS_LABELS[currentStatus]}
        </Button>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

export default SubmitButton;
