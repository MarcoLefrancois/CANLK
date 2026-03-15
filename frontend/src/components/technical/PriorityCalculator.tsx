/**
 * CANLK-105: PriorityCalculator - Composant UI pour l'affichage de la priorité
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { 
  PriorityIndicator, 
  getPriorityColor, 
  calculatePriority,
  PriorityResult 
} from '../lib/complexityEngine';

interface PriorityCalculatorProps {
  targetPrice: number | null;
  annualPotential: string;
  isReadyToBuy?: boolean;
  onChange?: (result: PriorityResult) => void;
}

export function PriorityCalculator({ 
  targetPrice, 
  annualPotential,
  isReadyToBuy = false,
  onChange 
}: PriorityCalculatorProps) {
  const result = calculatePriority(targetPrice, annualPotential, isReadyToBuy);
  
  const color = getPriorityColor(result.indicator);

  return (
    <div className="priority-calculator p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="font-medium">{result.label}</p>
          <p className="text-sm text-gray-500">{result.description}</p>
        </div>
      </div>
    </div>
  );
}

export default PriorityCalculator;
