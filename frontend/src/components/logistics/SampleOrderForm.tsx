import React, { useState, useCallback } from 'react';
import { useTDLRequests } from '@/hooks/useTDLRequests';
import { SampleLine } from './SampleLine';

export interface SampleOrderItem {
  id: string;
  sampleType: string;
  quantity: number;
  unit: string;
  shippingFormat: string;
  substrateId: string;
}

interface SampleOrderFormProps {
  tdlId: string;
  labEndDate?: Date;
  onSave?: (samples: SampleOrderItem[]) => void;
}

export function SampleOrderForm({ tdlId, labEndDate, onSave }: SampleOrderFormProps) {
  const { updateTDL } = useTDLRequests();
  const [samples, setSamples] = useState<SampleOrderItem[]>([
    {
      id: crypto.randomUUID(),
      sampleType: '',
      quantity: 1,
      unit: 'chips',
      shippingFormat: 'bag',
      substrateId: ''
    }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addSample = useCallback(() => {
    setSamples(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sampleType: '',
        quantity: 1,
        unit: 'chips',
        shippingFormat: 'bag',
        substrateId: ''
      }
    ]);
  }, []);

  const removeSample = useCallback((id: string) => {
    setSamples(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateSample = useCallback((id: string, field: keyof SampleOrderItem, value: string | number) => {
    setSamples(prev => prev.map(s => {
      if (s.id !== id) return s;
      
      const updated = { ...s, [field]: value };
      
      // Rule SAC-01: If chips > 10, suggest "Box" format
      if (field === 'quantity' && value > 10 && updated.unit === 'chips') {
        updated.shippingFormat = 'box';
      }
      
      return updated;
    }));
  }, []);

  // Calculate suggested shipping date (Rule SAC-02)
  const getSuggestedShippingDate = useCallback(() => {
    if (!labEndDate) return null;
    
    const date = new Date(labEndDate);
    let addedDays = 0;
    
    while (addedDays < 1) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) { // Skip weekends
        addedDays++;
      }
    }
    
    return date.toISOString().split('T')[0];
  }, [labEndDate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save sample orders to database
      const { error } = await updateTDL(tdlId, {
        sample_orders: JSON.stringify(samples)
      });
      
      if (error) throw error;
      onSave?.(samples);
    } catch (error) {
      console.error('Error saving sample order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const suggestedDate = getSuggestedShippingDate();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Commande d'Échantillons</h3>
        <button
          type="button"
          onClick={addSample}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Ajouter un échantillon
        </button>
      </div>

      {suggestedDate && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          📅 Date d'envoi suggérée: <strong>{suggestedDate}</strong>
        </div>
      )}

      <div className="space-y-3">
        {samples.map((sample, index) => (
          <SampleLine
            key={sample.id}
            index={index}
            sample={sample}
            onUpdate={(field, value) => updateSample(sample.id, field, value)}
            onRemove={() => removeSample(sample.id)}
            canRemove={samples.length > 1}
          />
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
