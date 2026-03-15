/**
 * CANLK-197: Hook pour la charge des techniciens
 * 
 * @version Sprint 4 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Technician } from '../../types/triage';

export function useTechnicianLoad(department: string | null) {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTechnicians = useCallback(async () => {
    if (!department) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch technicians for the department
      const { data, error: fetchError } = await supabase
        .from('tdl_technicians')
        .select(`
          id,
          user_id,
          department,
          current_load,
          max_load,
          is_active,
          user:user_id(
            raw_user_meta_data->>'full_name'
          )
        `)
        .eq('department', department)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      const techList: Technician[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.user?.raw_user_meta_data?.full_name || 'Technicien',
        department: item.department,
        current_load: item.current_load || 0,
        max_load: item.max_load || 10,
        is_active: item.is_active,
      }));

      setTechnicians(techList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // Refresh every minute
  useEffect(() => {
    const interval = setInterval(fetchTechnicians, 60000);
    return () => clearInterval(interval);
  }, [fetchTechnicians]);

  return {
    technicians,
    loading,
    error,
    refresh: fetchTechnicians,
  };
}

export default useTechnicianLoad;
