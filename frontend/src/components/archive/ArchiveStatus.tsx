import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ArchiveStatusProps {
  tdlId: string;
  status: string;
  pdfGenerated: boolean;
  onArchived?: () => void;
}

export function ArchiveStatus({ tdlId, status, pdfGenerated, onArchived }: ArchiveStatusProps) {
  const [archived, setArchived] = useState(false);
  const [archiveDate, setArchiveDate] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already archived
  useEffect(() => {
    const checkArchive = async () => {
      const { data } = await supabase
        .from('tdl_archives')
        .select('archived_at')
        .eq('tdl_id', tdlId)
        .order('archived_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setArchived(true);
        setArchiveDate(data.archived_at);
      }
    };

    checkArchive();
  }, [tdlId]);

  const canArchive = (status === 'Clôturé' || status === 'Closed') && pdfGenerated;

  const handleArchive = async () => {
    if (!canArchive) return;

    setIsArchiving(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'archive-tdl',
        { body: { tdlId } }
      );

      if (functionError) throw functionError;

      if (data?.success) {
        setArchived(true);
        setArchiveDate(data.archivedAt);
        onArchived?.();
      } else {
        throw new Error(data?.error || 'Failed to archive');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error archiving TDL');
    } finally {
      setIsArchiving(false);
    }
  };

  if (archived) {
    return (
      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
        <h3 className="text-lg font-semibold mb-2 text-green-800">✅ Archivage Terminé</h3>
        <p className="text-sm text-green-700">
          Ce TDL a été archivé le {archiveDate ? new Date(archiveDate).toLocaleDateString('fr-CA') : 'N/A'}
        </p>
        <p className="text-xs text-green-600 mt-2">
          Le rapport est disponible sur SharePoint pour les vendeurs.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3">Archivage & Clôture</h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Archive automatiquement le rapport PDF sur SharePoint à la clôture du TDL.
      </p>

      {error && (
        <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className={status === 'Clôturé' || status === 'Closed' ? 'text-green-600' : 'text-gray-400'}>
            {status === 'Clôturé' || status === 'Closed' ? '✅' : '⏳'} Statut{Clôturé}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={pdfGenerated ? 'text-green-600' : 'text-gray-400'}>
            {pdfGenerated ? '✅' : '⏳'} PDF généré
          </span>
        </div>
      </div>

      <button
        onClick={handleArchive}
        disabled={!canArchive || isArchiving}
        className={`px-4 py-2 rounded text-white ${
          canArchive
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isArchiving ? '⏳ Archivage en cours...' : '📦 Archiver sur SharePoint'}
      </button>

      {!canArchive && (
        <p className="text-xs text-gray-500 mt-2">
          Le TDL doit être clôturé et le PDF généré avant l'archivage.
        </p>
      )}
    </div>
  );
}
