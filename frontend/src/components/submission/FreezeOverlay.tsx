/**
 * CANLK-12: FreezeOverlay - Overlay de verrouillage pour formulaire soumis
 * 
 * Affiche un overlay semi-transparent quand le formulaire est verrouillé (soumis).
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent front_nexus
 */

interface FreezeOverlayProps {
  isFrozen: boolean;
  message?: string;
  children: React.ReactNode;
}

export function FreezeOverlay({ 
  isFrozen, 
  message = 'Ce formulaire a été soumis et est en lecture seule.',
  children 
}: FreezeOverlayProps) {
  if (!isFrozen) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Contenu original (en lecture seule) */}
      <div className="pointer-events-none opacity-60">
        {children}
      </div>
      
      {/* Overlay de verrouillage */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center border">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Formulaire verrouillé
          </h3>
          <p className="text-gray-600">
            {message}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Cette demande est en cours de traitement par le laboratoire.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pour déterminer si le formulaire doit être verrouillé
 */
export function useFormFreeze(status: string): boolean {
  const frozenStatuses = ['Soumis', 'En Analyse', 'En Révision', 'Qualifié', 'Rejeté'];
  return frozenStatuses.includes(status);
}

export default FreezeOverlay;
