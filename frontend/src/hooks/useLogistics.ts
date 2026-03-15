/**
 * CANLK-11: Hook pour les données logistiques (Bloc D)
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { LogisticsData } from '../components/logistics/LogisticsForm';

export function useLogistics(tdlId: string | null) {
  const [data, setData] = useState<LogisticsData>({
    containerFormat: '',
    isBillable: false,
    notes: '',
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
        .from('tdl_logistics')
        .select('*')
        .eq('tdl_id', tdlId)
        .single();

      if (fetchError) throw fetchError;

      if (result) {
        setData({
          containerFormat: result.container_format || '',
          isBillable: result.is_billable || false,
          notes: result.notes || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Save data to Supabase
  const saveData = useCallback(async (newData: LogisticsData) => {
    if (!tdlId) return { success: false, error: 'Aucun TDL sélectionné' };

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('tdl_logistics')
        .upsert({
          tdl_id: tdlId,
          container_format: newData.containerFormat,
          is_billable: newData.isBillable,
          notes: newData.notes,
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

export default useLogistics;
