/**
 * CANLK-9: Hook pour les données financières (Bloc B)
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { FinancialData } from '../components/financial/FinancialForm';

export function useFinancialData(tdlId: string | null) {
  const [data, setData] = useState<FinancialData>({
    targetPrice: null,
    dueDate: null,
    priorityCode: '',
    annualPotential: '',
    sku: '',
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
        .from('tdl_financial_analysis')
        .select('*')
        .eq('tdl_id', tdlId)
        .single();

      if (fetchError) throw fetchError;

      if (result) {
        setData({
          targetPrice: result.target_price,
          dueDate: result.due_date,
          priorityCode: result.priority_code || '',
          annualPotential: result.annual_potential || '',
          sku: result.sku_range || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Save data to Supabase
  const saveData = useCallback(async (newData: FinancialData) => {
    if (!tdlId) return { success: false, error: 'Aucun TDL sélectionné' };

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('tdl_financial_analysis')
        .upsert({
          tdl_id: tdlId,
          target_price: newData.targetPrice,
          due_date: newData.dueDate,
          priority_code: newData.priorityCode,
          annual_potential: newData.annualPotential,
          sku_range: newData.sku,
        }, { onConflict: 'tdl_id' });

      if (upsertError) throw upsertError;

      setData(newData);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    saveData,
    refresh: loadData,
  };
}

export default useFinancialData;
