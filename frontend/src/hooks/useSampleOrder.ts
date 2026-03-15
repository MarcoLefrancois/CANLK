import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SampleOrderItem } from '@/components/logistics/SampleOrderForm';

export interface UseSampleOrderReturn {
  samples: SampleOrderItem[];
  loading: boolean;
  error: string | null;
  loadSamples: (tdlId: string) => Promise<void>;
  saveSamples: (tdlId: string, samples: SampleOrderItem[]) => Promise<boolean>;
  deleteSample: (tdlId: string, sampleId: string) => Promise<boolean>;
}

export function useSampleOrder(): UseSampleOrderReturn {
  const [samples, setSamples] = useState<SampleOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSamples = useCallback(async (tdlId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('tdl_sample_orders')
        .select('*')
        .eq('tdl_id', tdlId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Parse sample orders from JSON field if stored as JSON
      if (data && data.length > 0) {
        const parsed = data.map(item => ({
          id: item.id,
          sampleType: item.sample_type,
          quantity: item.quantity,
          unit: item.unit,
          shippingFormat: item.shipping_format,
          substrateId: item.substrate_id || ''
        }));
        setSamples(parsed);
      } else {
        setSamples([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading samples');
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSamples = useCallback(async (tdlId: string, samples: SampleOrderItem[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Delete existing samples for this TDL
      await supabase
        .from('tdl_sample_orders')
        .delete()
        .eq('tdl_id', tdlId);

      // Insert new samples
      const samplesToInsert = samples.map(sample => ({
        tdl_id: tdlId,
        sample_type: sample.sampleType,
        quantity: sample.quantity,
        unit: sample.unit,
        shipping_format: sample.shippingFormat,
        substrate_id: sample.substrateId
      }));

      const { error: insertError } = await supabase
        .from('tdl_sample_orders')
        .insert(samplesToInsert);

      if (insertError) throw insertError;

      setSamples(samples);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving samples');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSample = useCallback(async (tdlId: string, sampleId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('tdl_sample_orders')
        .delete()
        .eq('id', sampleId);

      if (deleteError) throw deleteError;

      setSamples(prev => prev.filter(s => s.id !== sampleId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting sample');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    samples,
    loading,
    error,
    loadSamples,
    saveSamples,
    deleteSample
  };
}
