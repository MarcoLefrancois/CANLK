import { clsx } from 'clsx';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type SLAStatus = 'on_track' | 'at_risk' | 'breached';

interface PriorityIndicatorProps {
  priority: PriorityLevel;
  slaStatus?: SLAStatus;
  slaDeadline?: Date;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PRIORITY_CONFIG = {
  critical: {
    color: 'bg-red-600',
    borderColor: 'border-red-600',
    textColor: 'text-red-600',
    label: 'Critique',
    slaHours: 24,
  },
  high: {
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-500',
    label: 'Haute',
    slaHours: 48,
  },
  medium: {
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-500',
    label: 'Moyenne',
    slaHours: 72,
  },
  low: {
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-500',
    label: 'Basse',
    slaHours: 168,
  },
};

const SIZE_CONFIG = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function PriorityIndicator({
  priority,
  slaStatus,
  slaDeadline,
  showLabel = false,
  size = 'md',
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority];
  
  const calculateSLAStatus = (): SLAStatus => {
    if (!slaDeadline) return 'on_track';
    
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 0) return 'breached';
    if (hoursRemaining <= config.slaHours * 0.25) return 'at_risk';
    return 'on_track';
  };

  const currentSLAStatus = slaStatus ?? calculateSLAStatus();
  
  const getSLAColor = () => {
    switch (currentSLAStatus) {
      case 'breached': return 'bg-red-500';
      case 'at_risk': return 'bg-yellow-500 animate-pulse';
      case 'on_track': return 'bg-green-500';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className={clsx('rounded-full', config.color, SIZE_CONFIG[size])} />
        {currentSLAStatus !== 'on_track' && (
          <span className={clsx('rounded-full animate-pulse', getSLAColor(), SIZE_CONFIG[size])} />
        )}
      </div>
      
      {showLabel && (
        <span className={clsx('font-medium', config.textColor)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

interface PriorityBadgeProps {
  priority: PriorityLevel;
  slaStatus?: SLAStatus;
}

export function PriorityBadge({ priority, slaStatus }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        config.borderColor,
        config.color,
        'text-white'
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      {config.label}
      {slaStatus === 'at_risk' && '⚠️'}
      {slaStatus === 'breached' && '🚨'}
    </span>
  );
}

// Hook for SLA calculations
export function useSLACalculation(deadline: Date | null, priority: PriorityLevel) {
  const calculateRemainingTime = () => {
    if (!deadline) return null;
    
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 0) return { text: 'SLA échu', status: 'breached' as SLAStatus };
    if (hours < 24) return { text: `${hours}h ${minutes}m`, status: 'breached' as SLAStatus };
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours < config.slaHours * 0.25) {
      return { text: `${days}j ${remainingHours}h`, status: 'at_risk' as SLAStatus };
    }
    
    return { text: `${days}j ${remainingHours}h`, status: 'on_track' as SLAStatus };
  };
  
  const config = PRIORITY_CONFIG[priority];
  const remaining = calculateRemainingTime();
  
  return {
    remaining,
    slaHours: config.slaHours,
  };
}
