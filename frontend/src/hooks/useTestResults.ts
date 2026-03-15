/**
 * CANLK-96: Hook pour les résultats de tests
 * 
 * @version Sprint 5 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { TestResultsData } from '../components/lab/TestResultsForm';

export function useTestResults(tdlId: string | null) {
  const [data, setData] = useState<TestResultsData>({
    observations: '',
    testEndDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!tdlId) return;

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase
        .from('tdl_test_results')
        .select('*')
        .eq('tdl_id', tdlId)
        .single();

      if (fetchError) throw fetchError;

      if (result) {
        setData({
          observations: result.observations || '',
          testEndDate: result.test_end_date || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  const saveData = useCallback(async (newData: TestResultsData) => {
    if (!tdlId) return { success: false, error: 'Aucun TDL sélectionné' };

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('tdl_test_results')
        .upsert({
          tdl_id: tdlId,
          observations: newData.observations,
          test_end_date: newData.testEndDate,
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

export default useTestResults;
