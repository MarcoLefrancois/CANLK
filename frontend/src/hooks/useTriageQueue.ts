/**
 * CANLK-197: Hook pour la file d'attente de triage
 * 
 * @version Sprint 4 | 2026-03-15
 * @agent ms_engine
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { TriageQueueItem, TriageFilters } from '../../types/triage';

export function useTriageQueue(department: string | null) {
  const [queue, setQueue] = useState<TriageQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!department) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch TDLs with status "Soumis" for the department
      const { data, error: fetchError } = await supabase
        .from('tdl_requests')
        .select(`
          id,
          tdl_number,
          client_name,
          department,
          priority,
          status,
          submitted_at,
          complexity_score
        `)
        .eq('department', department)
        .eq('status', 'Soumis')
        .order('submitted_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Calculate SLA deadline (24 hours)
      const now = new Date();
      const queueItems: TriageQueueItem[] = (data || []).map(item => {
        const submittedAt = new Date(item.submitted_at);
        const slaDeadline = new Date(submittedAt.getTime() + 24 * 60 * 60 * 1000);
        const isOverdue = now > slaDeadline;

        return {
          id: item.id,
          tdl_id: item.id,
          tdl_number: item.tdl_number,
          client_name: item.client_name,
          department: item.department,
          priority: item.priority,
          submitted_at: item.submitted_at,
          sla_deadline: slaDeadline.toISOString(),
          is_overdue: isOverdue,
        };
      });

      setQueue(queueItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  return {
    queue,
    loading,
    error,
    refresh: fetchQueue,
  };
}

export default useTriageQueue;
