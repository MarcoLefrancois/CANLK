import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface QueryAnalysis {
  query: string;
  avg_duration_ms: number;
  calls_count: number;
  total_duration_ms: number;
  recommendation?: string;
}

export interface TableStats {
  table_name: string;
  row_count: number;
  last_vacuum: Date | null;
  last_autovacuum: Date | null;
  dead_rows: number;
  index_size: string;
  table_size: string;
}

export function useQueryOptimizer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [slowQueries, setSlowQueries] = useState<QueryAnalysis[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);

  const analyzeSlowQueries = async (): Promise<QueryAnalysis[]> => {
    setIsAnalyzing(true);
    
    try {
      // Get pg_stat_statements data (requires extension)
      const { data, error } = await supabase.rpc('analyze_slow_queries', {
        threshold_ms: 100, // Queries taking more than 100ms
      });

      if (error) {
        console.warn('Slow query analysis not available:', error);
        return [];
      }

      setSlowQueries(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to analyze queries:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTableStats = async (): Promise<TableStats[]> => {
    try {
      const { data, error } = await supabase.rpc('get_table_stats');
      
      if (error) {
        console.warn('Table stats not available:', error);
        return [];
      }

      setTableStats(data || []);
      return data || [];
    } catch (error) {
      console.error('Failed to get table stats:', error);
      return [];
    }
  };

  const runVACUUM = async (tableName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('vacuum_table', { table_name: tableName });
      return !error;
    } catch (error) {
      console.error('VACUUM failed:', error);
      return false;
    }
  };

  const createMissingIndexes = async (): Promise<{ created: string[]; errors: string[] }> => {
    const recommendations = getIndexRecommendations();
    const created: string[] = [];
    const errors: string[] = [];

    for (const rec of recommendations) {
      try {
        const { error } = await supabase.rpc('create_index', {
          table_name: rec.table,
          column_name: rec.column,
          index_name: rec.index_name,
        });

        if (error) {
          errors.push(`Failed to create ${rec.index_name}: ${error.message}`);
        } else {
          created.push(rec.index_name);
        }
      } catch (error) {
        errors.push(`Error creating ${rec.index_name}: ${error}`);
      }
    }

    return { created, errors };
  };

  const getIndexRecommendations = (): { table: string; column: string; index_name: string }[] => {
    // Common patterns for CANLK
    return [
      { table: 'tdl_requests', column: 'status', index_name: 'idx_tdl_status' },
      { table: 'tdl_requests', column: 'region', index_name: 'idx_tdl_region' },
      { table: 'tdl_requests', column: 'client_name', index_name: 'idx_tdl_client' },
      { table: 'tdl_requests', column: 'submission_date', index_name: 'idx_tdl_submission' },
      { table: 'tdl_requests', column: 'assigned_intervenant_id', index_name: 'idx_tdl_intervenant' },
      { table: 'tdl_status_history', column: 'tdl_id', index_name: 'idx_history_tdl' },
      { table: 'tdl_status_history', column: 'created_at', index_name: 'idx_history_created' },
    ];
  };

  return {
    isAnalyzing,
    slowQueries,
    tableStats,
    analyzeSlowQueries,
    getTableStats,
    runVACUUM,
    createMissingIndexes,
    getIndexRecommendations,
  };
}
