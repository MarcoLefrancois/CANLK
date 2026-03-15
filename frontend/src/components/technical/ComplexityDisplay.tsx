/**
 * CANLK-105: ComplexityDisplay - Composant UI pour l'affichage de la complexité
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { ComplexityResult, calculateComplexity } from '../lib/complexityEngine';

interface ComplexityDisplayProps {
  isLustreAdjustment: boolean;
  isColorMatch: boolean;
  isMultiLayers: boolean;
  isNewProduct: boolean;
  isHighExigence: boolean;
  hasPastExperience: boolean;
  score?: number;
  locked?: boolean;
}

const COMPLEXITY_COLORS: Record<number, string> = {
  1: '#22c55e', // Mineur - vert
  2: '#3b82f6', // Standard - bleu
  3: '#f59e0b', // Avancé - orange
  4: '#ef4444', // Expert - rouge
  5: '#7c3aed', // Critique - violet
};

export function ComplexityDisplay({
  isLustreAdjustment,
  isColorMatch,
  isMultiLayers,
  isNewProduct,
  isHighExigence,
  hasPastExperience,
  score,
  locked = false,
}: ComplexityDisplayProps) {
  // Calculate complexity if no score provided
  const result: ComplexityResult = score 
    ? {
        score,
        level: score as any,
        label: getLabelForScore(score),
        description: getDescriptionForScore(score),
      }
    : calculateComplexity({
        isLustreAdjustment,
        isColorMatch,
        isMultiLayers,
        isNewProduct,
        isHighExigence,
        hasPastExperience,
      });

  const color = COMPLEXITY_COLORS[result.score] || '#9ca3af';

  return (
    <div className={`complexity-display p-4 border rounded-lg ${locked ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: color }}
          >
            {result.score}
          </div>
          <div>
            <p className="font-medium">{result.label}</p>
            <p className="text-sm text-gray-500">{result.description}</p>
          </div>
        </div>
        
        {locked && (
          <span className="text-sm text-gray-400 px-2 py-1 bg-gray-100 rounded">
            Verrouillé
          </span>
        )}
      </div>

      {/* Scale visualization */}
      <div className="mt-4 flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`flex-1 h-2 rounded ${level <= result.score ? '' : 'bg-gray-200'}`}
            style={{ 
              backgroundColor: level <= result.score ? COMPLEXITY_COLORS[level] : undefined 
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>Mineur</span>
        <span>Critique</span>
      </div>
    </div>
  );
}

function getLabelForScore(score: number): string {
  const labels: Record<number, string> = {
    1: 'Mineur',
    2: 'Standard',
    3: 'Avancé',
    4: 'Expert',
    5: 'Critique',
  };
  return labels[score] || 'Inconnu';
}

function getDescriptionForScore(score: number): string {
  const descriptions: Record<number, string> = {
    1: 'Ajustement de lustre ou couleur simple',
    2: 'Match de couleur avec substrat existant',
    3: 'Nouveau système de finition (Multi-couches)',
    4: 'Développement de nouveau produit chimique',
    5: 'Aucune expérience passée / Haute exigence client',
  };
  return descriptions[score] || '';
}

export default ComplexityDisplay;
