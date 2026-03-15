/**
 * CANLK-105: Hook pour le calcul de complexité et priorité
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  ComplexityEngine, 
  ComplexityResult, 
  PriorityResult 
} from '../lib/complexityEngine';

interface ComplexityData {
  // Score
  complexityScore: number | null;
  complexityLevel: string;
  complexityDescription: string;
  
  // Critères
  isLustreAdjustment: boolean;
  isColorMatch: boolean;
  isMultiLayers: boolean;
  isNewProduct: boolean;
  isHighExigence: boolean;
  hasPastExperience: boolean;
  
  // Priorité
  priorityIndicator: string;
  priorityLabel: string;
  priorityDescription: string;
  
  // Verrouillage
  isLocked: boolean;
  lockedAt: string | null;
}

export function useComplexityLogic(tdlId: string | null) {
  const [data, setData] = useState<ComplexityData>({
    complexityScore: null,
    complexityLevel: '',
    complexityDescription: '',
    isLustreAdjustment: false,
    isColorMatch: false,
    isMultiLayers: false,
    isNewProduct: false,
    isHighExigence: false,
    hasPastExperience: true,
    priorityIndicator: 'yellow',
    priorityLabel: 'En attente',
    priorityDescription: 'En cours d\'évaluation',
    isLocked: false,
    lockedAt: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    if (!tdlId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('tdl_complexity_priority')
        .select('*')
        .eq('tdl_id', tdlId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (result) {
        setData({
          complexityScore: result.complexity_score,
          complexityLevel: result.complexity_level || '',
          complexityDescription: result.complexity_description || '',
          isLustreAdjustment: result.is_lustre_adjustment || false,
          isColorMatch: result.is_color_match || false,
          isMultiLayers: result.is_multi_layers || false,
          isNewProduct: result.is_new_product || false,
          isHighExigence: result.is_high_exigence || false,
          hasPastExperience: result.has_past_experience ?? true,
          priorityIndicator: result.priority_indicator || 'yellow',
          priorityLabel: result.priority_label || 'En attente',
          priorityDescription: result.priority_description || '',
          isLocked: result.is_locked || false,
          lockedAt: result.locked_at,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Calculate complexity based on criteria
  const calculateComplexity = useCallback((
    criteria: ComplexityData
  ): ComplexityResult => {
    return ComplexityEngine.calculate({
      isLustreAdjustment: criteria.isLustreAdjustment,
      isColorMatch: criteria.isColorMatch,
      isMultiLayers: criteria.isMultiLayers,
      isNewProduct: criteria.isNewProduct,
      isHighExigence: criteria.isHighExigence,
      hasPastExperience: criteria.hasPastExperience,
    });
  }, []);

  // Calculate priority
  const calculatePriority = useCallback((
    targetPrice: number | null,
    annualPotential: string,
    isReadyToBuy?: boolean
  ): PriorityResult => {
    return ComplexityEngine.calculatePriority(targetPrice, annualPotential, isReadyToBuy);
  }, []);

  // Save calculated data to Supabase
  const saveCalculations = useCallback(async (
    complexityResult: ComplexityResult,
    priorityResult: PriorityResult
  ) => {
    if (!tdlId) return { success: false, error: 'Aucun TDL sélectionné' };

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('tdl_complexity_priority')
        .upsert({
          tdl_id: tdlId,
          complexity_score: complexityResult.score,
          complexity_level: complexityResult.label,
          complexity_description: complexityResult.description,
          priority_indicator: priorityResult.indicator,
          priority_label: priorityResult.label,
          priority_description: priorityResult.description,
          calculated_at: new Date().toISOString(),
        }, { onConflict: 'tdl_id' });

      if (upsertError) throw upsertError;

      // Update local state
      setData(prev => ({
        ...prev,
        complexityScore: complexityResult.score,
        complexityLevel: complexityResult.label,
        complexityDescription: complexityResult.description,
        priorityIndicator: priorityResult.indicator,
        priorityLabel: priorityResult.label,
        priorityDescription: priorityResult.description,
      }));

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Lock complexity (for supervisors)
  const lockComplexity = useCallback(async () => {
    if (!tdlId) return { success: false, error: 'Aucun TDL sélectionné' };

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('tdl_complexity_priority')
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
        })
        .eq('tdl_id', tdlId);

      if (updateError) throw updateError;

      setData(prev => ({ ...prev, isLocked: true, lockedAt: new Date().toISOString() }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erreur' };
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Check if locked
  const isLocked = useCallback((status: string): boolean => {
    return ComplexityEngine.isLocked(status);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    calculateComplexity,
    calculatePriority,
    saveCalculations,
    lockComplexity,
    isLocked,
    refresh: loadData,
  };
}

export default useComplexityLogic;
