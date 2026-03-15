/**
 * CANLK-12: StatusBadge - Indicateur visuel du statut TDL
 * 
 * Affiche le statut actuel du TDL avec code couleur.
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent front_nexus
 */

export type TDLStatus = 'Brouillon' | 'Soumis' | 'En Analyse' | 'En Révision' | 'Qualifié' | 'Rejeté';

interface StatusBadgeProps {
  status: TDLStatus;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<TDLStatus, { color: string; bgColor: string; label: string }> = {
  'Brouillon': { 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-100', 
    label: 'Brouillon' 
  },
  'Soumis': { 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100', 
    label: 'Soumis' 
  },
  'En Analyse': { 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100', 
    label: 'En Analyse' 
  },
  'En Révision': { 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-100', 
    label: 'En Révision' 
  },
  'Qualifié': { 
    color: 'text-green-700', 
    bgColor: 'bg-green-100', 
    label: 'Qualifié' 
  },
  'Rejeté': { 
    color: 'text-red-700', 
    bgColor: 'bg-red-100', 
    label: 'Rejeté' 
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Brouillon'];

  return (
    <span 
      className={`
        inline-flex items-center font-medium rounded-full
        ${config.color} ${config.bgColor}
        ${SIZE_CLASSES[size]}
      `}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${status === 'Brouillon' ? 'bg-gray-500' : 
        status === 'Soumis' ? 'bg-blue-500' :
        status === 'En Analyse' ? 'bg-yellow-500' :
        status === 'En Révision' ? 'bg-purple-500' :
        status === 'Qualifié' ? 'bg-green-500' :
        'bg-red-500'}`}
      />
      {config.label}
    </span>
  );
}

export default StatusBadge;
