/**
 * CANLK-202: Hook pour le workflow de décision
 * 
 * @version Sprint 4 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { DecisionPayload, StageLogEntry, TDLStatus } from '../../types/triage';

const STATUS_TRANSITIONS: Record<TDLStatus, TDLStatus> = {
  'Soumis': 'En Cours - Labo',
  'En Analyse': 'En Cours - Labo',
};

export function useDecisionWorkflow(tdlId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Execute decision
  const executeDecision = useCallback(async (payload: DecisionPayload): Promise<{ success: boolean; error?: string }> => {
    if (!payload.tdl_id) {
      return { success: false, error: 'ID TDL requis' };
    }

    setLoading(true);
    setError(null);

    try {
      // Get current TDL data
      const { data: tdl, error: fetchError } = await supabase
        .from('tdl_requests')
        .select('*')
        .eq('id', payload.tdl_id)
        .single();

      if (fetchError) throw fetchError;
      if (!tdl) throw new Error('TDL non trouvé');

      const oldStatus = tdl.status;
      let newStatus: TDLStatus;

      // Determine new status based on action
      switch (payload.action) {
        case 'APPROVE':
          newStatus = 'En Cours - Labo';
          break;
        case 'REDIRECT':
          newStatus = 'Soumis'; // Stay submitted, department will change
          break;
        case 'REQUEST_INFO':
          newStatus = 'Info Requise';
          break;
        default:
          throw new Error('Action inconnue');
      }

      // Build update object
      const updateData: any = {
        status: newStatus,
      };

      // Add technician if approving
      if (payload.action === 'APPROVE' && payload.technician_id) {
        updateData.assigned_technician = payload.technician_id;
        updateData.assigned_at = new Date().toISOString();
      }

      // Add new department if redirecting
      if (payload.action === 'REDIRECT' && payload.new_department) {
        updateData.department = payload.new_department;
      }

      // Update TDL
      const { error: updateError } = await supabase
        .from('tdl_requests')
        .update(updateData)
        .eq('id', payload.tdl_id);

      if (updateError) throw updateError;

      // Log status change
      const { error: logError } = await supabase
        .from('tdl_status_history')
        .insert({
          tdl_id: payload.tdl_id,
          old_status: oldStatus,
          new_status: newStatus,
          reason: payload.reason,
        });

      if (logError) {
        console.error('Warning: Could not log status change:', logError);
      }

      // If redirecting, notify new supervisor
      if (payload.action === 'REDIRECT' && payload.new_department) {
        try {
          await supabase.functions.invoke('notify-supervisor', {
            body: { 
              tdl_id: payload.tdl_id,
              new_department: payload.new_department,
              reason: payload.reason,
            },
          });
        } catch (fnError) {
          console.error('Warning: Could not notify new supervisor:', fnError);
        }
      }

      // If request info, notify sales rep
      if (payload.action === 'REQUEST_INFO') {
        try {
          await supabase.functions.invoke('notify-sales', {
            body: { 
              tdl_id: payload.tdl_id,
              reason: payload.reason,
            },
          });
        } catch (fnError) {
          console.error('Warning: Could not notify sales:', fnError);
        }
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de traitement';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stage log for a TDL
  const fetchStageLog = useCallback(async (tdlId: string): Promise<StageLogEntry[]> => {
    try {
      const { data, error } = await supabase
        .from('tdl_status_history')
        .select(`
          id,
          tdl_id,
          old_status,
          new_status,
          actor:changed_by(
            raw_user_meta_data->>'full_name'
          ),
          reason,
          changed_at
        `)
        .eq('tdl_id', tdlId)
        .order('changed_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(entry => ({
        id: entry.id,
        tdl_id: entry.tdl_id,
        status_from: entry.old_status,
        status_to: entry.new_status,
        actor_id: entry.changed_by,
        actor_name: entry.actor?.raw_user_meta_data?.full_name || 'Système',
        reason: entry.reason,
        timestamp: entry.changed_at,
      }));
    } catch (err) {
      console.error('Error fetching stage log:', err);
      return [];
    }
  }, []);

  return {
    loading,
    error,
    executeDecision,
    fetchStageLog,
  };
}

export default useDecisionWorkflow;
