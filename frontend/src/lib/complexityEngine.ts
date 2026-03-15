/**
 * CANLK-105: Logique de Complexité & Priorité
 * 
 * En tant que Technicien ou Superviseur,
 * je veux que la complexité et la priorité métier soient calculées automatiquement,
 * afin de prioriser le plan de travail du laboratoire sans interprétation subjective.
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent ms_engine
 */

/**
 * Niveaux de complexité selon les critères métier
 */
export enum ComplexityLevel {
  MINEUR = 1,      // Ajustement de lustre ou couleur simple
  STANDARD = 2,    // Match de couleur avec substrat existant
  EXPERT = 4,      // Développement de nouveau produit chimique
  CRITICAL = 5,    // Aucune expérience passée / Haute exigence client
}

/**
 * Catégories de complexité avec leurs critères
 */
export interface ComplexityCriteria {
  type: 'lustre' | 'couleur' | 'multi_couches' | 'nouveau_produit' | 'haute_exigence';
  label: string;
  score: ComplexityLevel;
}

/**
 * Options de priorité visuelle
 */
export enum PriorityIndicator {
  VERT = 'green',   // Engagement fort, prêt à l'achat
  ROUGE = 'red',    // Faible probabilité, prix agressif demandé
  JAUNE = 'yellow', // En attente
}

/**
 * Données d'entrée pour le calcul de complexité
 */
export interface ComplexityInput {
  isLustreAdjustment: boolean;
  isColorMatch: boolean;
  isMultiLayers: boolean;
  isNewProduct: boolean;
  isHighExigence: boolean;
  hasPastExperience: boolean;
}

/**
 * Résultat du calcul de complexité
 */
export interface ComplexityResult {
  score: number;
  level: ComplexityLevel;
  label: string;
  description: string;
}

/**
 * Résultat du calcul de priorité
 */
export interface PriorityResult {
  indicator: PriorityIndicator;
  label: string;
  description: string;
}

/**
 * Calcule le niveau de complexité basé sur les critères sélectionnés
 */
export function calculateComplexity(input: ComplexityInput): ComplexityResult {
  // Logique de calcul basée sur les critères métier
  let maxScore = ComplexityLevel.MINEUR;

  if (input.isLustreAdjustment && !input.isColorMatch) {
    maxScore = ComplexityLevel.MINEUR;
  } else if (input.isColorMatch && !input.isMultiLayers && !input.isNewProduct) {
    maxScore = ComplexityLevel.STANDARD;
  } else if (input.isMultiLayers) {
    maxScore = 3; // Avancé
  } else if (input.isNewProduct) {
    maxScore = ComplexityLevel.EXPERT;
  } else if (input.isHighExigence || !input.hasPastExperience) {
    maxScore = ComplexityLevel.CRITICAL;
  }

  const labels: Record<number, { label: string; description: string }> = {
    1: { label: 'Mineur', description: 'Ajustement de lustre ou couleur simple' },
    2: { label: 'Standard', description: 'Match de couleur avec substrat existant' },
    3: { label: 'Avancé', description: 'Nouveau système de finition (Multi-couches)' },
    4: { label: 'Expert', description: 'Développement de nouveau produit chimique' },
    5: { label: 'Critique', description: 'Aucune expérience passée / Haute exigence client' },
  };

  return {
    score: maxScore,
    level: maxScore,
    label: labels[maxScore]?.label || 'Inconnu',
    description: labels[maxScore]?.description || '',
  };
}

/**
 * Calcule l'indicateur de priorité basé sur les critères commerciaux
 */
export function calculatePriority(
  targetPrice: number | null,
  annualPotential: string,
  isReadyToBuy: boolean = false
): PriorityResult {
  // Logique de priorité basée sur les critères commerciaux
  
  // Critère 1: Prix agressif demandé
  if (targetPrice !== null && targetPrice < 100) {
    return {
      indicator: PriorityIndicator.ROUGE,
      label: 'Prix agressif',
      description: 'Faible probabilité, prix agressif demandé',
    };
  }

  // Critère 2: Fort potentiel et prêt à acheter
  if (isReadyToBuy && (annualPotential === '50k100k' || annualPotential === 'gt100k')) {
    return {
      indicator: PriorityIndicator.VERT,
      label: 'Fort potentiel',
      description: 'Engagement fort, prêt à l\'achat',
    };
  }

  // Par défaut: jaune (en attente)
  return {
    indicator: PriorityIndicator.JAUNE,
    label: 'En attente',
    description: 'En cours d\'évaluation',
  };
}

/**
 * Vérifie si le champ complexité doit être verrouillé
 * (après validation par le superviseur)
 */
export function isComplexityLocked(status: string): boolean {
  const lockedStatuses = ['qualifié', 'qualified', 'en_révision', 'en_revision', 'révision', 'revision'];
  return lockedStatuses.includes(status.toLowerCase());
}

/**
 * Retourne la couleur hex pour l'indicateur de priorité
 */
export function getPriorityColor(indicator: PriorityIndicator): string {
  const colors: Record<PriorityIndicator, string> = {
    [PriorityIndicator.VERT]: '#22c55e',
    [PriorityIndicator.JAUNE]: '#eab308',
    [PriorityIndicator.ROUGE]: '#ef4444',
  };
  return colors[indicator] || '#9ca3af';
}

/**
 * Classe principale pour orchestrer les calculs de complexité et priorité
 */
export class ComplexityEngine {
  /**
   * Calcule la complexité complète
   */
  static calculate(input: ComplexityInput): ComplexityResult {
    return calculateComplexity(input);
  }

  /**
   * Calcule la priorité
   */
  static calculatePriority(
    targetPrice: number | null,
    annualPotential: string,
    isReadyToBuy?: boolean
  ): PriorityResult {
    return calculatePriority(targetPrice, annualPotential, isReadyToBuy);
  }

  /**
   * Vérifie le verrouillage
   */
  static isLocked(status: string): boolean {
    return isComplexityLocked(status);
  }
}

export default ComplexityEngine;
