/**
 * CANLK-10: Hook pour les spécifications techniques (Bloc C)
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { TechnicalSpecsData } from '../components/technical/TechnicalSpecs';

export function useTechnicalSpecs(tdlId: string | null) {
  const [data, setData] = useState<TechnicalSpecsData>({
    applicationType: '',
    isStandard: false,
    brilliance: 50,
    drying: '',
    clientSharepointUrl: null,
    sopFolderUrl: null,
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
        .from('tdl_technical_specs')
        .select('*')
        .eq('tdl_id', tdlId)
        .single();

      if (fetchError) throw fetchError;

      if (result) {
        setData({
          applicationType: result.application_type || '',
          isStandard: result.is_standard || false,
          brilliance: result.brilliance || 50,
          drying: result.drying_type || '',
          clientSharepointUrl: result.client_sharepoint_url,
          sopFolderUrl: result.sop_folder_url,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Save data to Supabase
  const saveData = useCallback(async (newData: TechnicalSpecsData) => {
    if (!tdlId) return { success: false, error: 'Aucun TDL sélectionné' };

    setLoading(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('tdl_technical_specs')
        .upsert({
          tdl_id: tdlId,
          application_type: newData.applicationType,
          is_standard: newData.isStandard,
          brilliance: newData.brilliance,
          drying_type: newData.drying,
          client_sharepoint_url: newData.clientSharepointUrl,
          sop_folder_url: newData.sopFolderUrl,
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

export default useTechnicalSpecs;
