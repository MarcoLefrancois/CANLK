import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LegacyRecord {
  id: string;
  tdl_number_legacy: string;
  client_name: string;
  formula_id: string;
  submission_date: string;
  status: string;
  technician: string;
  results: Record<string, unknown>;
}

export interface MigrationProgress {
  total: number;
  processed: number;
  success: number;
  failed: number;
  current: string | null;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errorCount: number;
  errors: string[];
}

export function useLegacyMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    current: null,
  });

  const migrateRecords = async (legacyRecords: LegacyRecord[]): Promise<MigrationResult> => {
    setIsMigrating(true);
    
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errorCount: 0,
      errors: [],
    };

    setProgress({
      total: legacyRecords.length,
      processed: 0,
      success: 0,
      failed: 0,
      current: null,
    });

    for (const record of legacyRecords) {
      try {
        setProgress((prev) => ({ ...prev, current: record.tdl_number_legacy }));

        // Map legacy status to new status
        const statusMap: Record<string, string> = {
          'Brouillon': 'brouillon',
          'En cours': 'en_analyse',
          'Terminé': 'qualifie',
          'Rejeté': 'rejete',
        };

        const { error } = await supabase.from('tdl_requests').insert({
          tdl_number: record.tdl_number_legacy,
          client_name: record.client_name,
          formula_id: record.formula_id,
          status: statusMap[record.status] || 'brouillon',
          submission_date: record.submission_date,
          assigned_technician: record.technician,
          metadata: record.results,
          is_legacy: true,
          legacy_id: record.id,
        });

        if (error) throw error;

        result.migratedCount++;
        setProgress((prev) => ({
          ...prev,
          success: prev.success + 1,
          processed: prev.processed + 1,
        }));
      } catch (error) {
        result.errorCount++;
        result.errors.push(`Failed to migrate ${record.tdl_number_legacy}: ${error}`);
        setProgress((prev) => ({
          ...prev,
          failed: prev.failed + 1,
          processed: prev.processed + 1,
        }));
      }
    }

    result.success = result.errorCount === 0;
    setIsMigrating(false);
    setProgress((prev) => ({ ...prev, current: null }));

    return result;
  };

  const validateMigration = async (legacyId: string, newId: string): Promise<boolean> => {
    const { data: newRecord, error } = await supabase
      .from('tdl_requests')
      .select('*')
      .eq('id', newId)
      .single();

    if (error || !newRecord) return false;

    const { data: legacyRecord } = await supabase
      .from('tdl_requests')
      .select('*')
      .eq('legacy_id', legacyId)
      .single();

    return !!legacyRecord;
  };

  const getMigrationStats = async () => {
    const { count: total } = await supabase
      .from('tdl_requests')
      .select('*', { count: 'exact', head: true });

    const { count: legacy } = await supabase
      .from('tdl_requests')
      .select('*', { count: 'exact', head: true })
      .eq('is_legacy', true);

    return {
      total: total || 0,
      legacy: legacy || 0,
      new: (total || 0) - (legacy || 0),
    };
  };

  return {
    isMigrating,
    progress,
    migrateRecords,
    validateMigration,
    getMigrationStats,
  };
}
