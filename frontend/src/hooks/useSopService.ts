/**
 * CANLK-93: Hook pour la consultation SOP et fiche client
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { generateSharePointUrls, SopViewerData } from '../components/sop/SopViewer';

export function useSopService(tdlId: string | null) {
  const [data, setData] = useState<SopViewerData>({
    clientId: null,
    clientName: null,
    clientSharepointUrl: null,
    sopFolderUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load client info and generate SOP URLs
  const loadClientInfo = useCallback(async () => {
    if (!tdlId) return;

    setLoading(true);
    setError(null);

    try {
      // Get TDL with client info
      const { data: tdl, error: tdlError } = await supabase
        .from('tdl_requests')
        .select(`
          id,
          client:clients(id, name)
        `)
        .eq('id', tdlId)
        .single();

      if (tdlError) throw tdlError;

      if (tdl?.client) {
        const urls = generateSharePointUrls(tdl.client.name);
        setData({
          clientId: tdl.client.id,
          clientName: tdl.client.name,
          clientSharepointUrl: urls.clientSharepointUrl,
          sopFolderUrl: urls.sopFolderUrl,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [tdlId]);

  // Update URLs when client changes
  const updateClient = useCallback((clientName: string | null) => {
    const urls = generateSharePointUrls(clientName);
    setData(prev => ({
      ...prev,
      clientName,
      clientSharepointUrl: urls.clientSharepointUrl,
      sopFolderUrl: urls.sopFolderUrl,
    }));
  }, []);

  // Refresh SOP links
  const refresh = useCallback(async () => {
    await loadClientInfo();
  }, [loadClientInfo]);

  // Load client info on mount
  useEffect(() => {
    loadClientInfo();
  }, [loadClientInfo]);

  return {
    data,
    loading,
    error,
    updateClient,
    refresh,
  };
}

export default useSopService;
