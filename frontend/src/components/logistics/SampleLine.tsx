import React from 'react';
import { SampleOrderItem } from './SampleOrderForm';

interface SampleLineProps {
  index: number;
  sample: SampleOrderItem;
  onUpdate: (field: keyof SampleOrderItem, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const SAMPLE_TYPES = [
  { value: 'final_product', label: 'Produit Final' },
  { value: 'raw_material', label: 'Matière Première' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'reference', label: 'Échantillon de Référence' },
];

const UNITS = [
  { value: 'chips', label: 'Chips' },
  { value: 'grams', label: 'Grammes' },
  { value: 'kg', label: 'Kg' },
  { value: 'liters', label: 'Litres' },
];

const SHIPPING_FORMATS = [
  { value: 'bag', label: 'Sac' },
  { value: 'box', label: 'Boîte' },
  { value: 'tube', label: 'Tube' },
  { value: 'container', label: 'Récipient' },
];

export function SampleLine({ index, sample, onUpdate, onRemove, canRemove }: SampleLineProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-medium text-gray-600">Échantillon #{index + 1}</span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            ✕ Supprimer
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select
            value={sample.sampleType}
            onChange={(e) => onUpdate('sampleType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            <option value="">Sélectionner...</option>
            {SAMPLE_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Quantité</label>
          <input
            type="number"
            min="1"
            value={sample.quantity}
            onChange={(e) => onUpdate('quantity', parseInt(e.target.value) || 1)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Unité</label>
          <select
            value={sample.unit}
            onChange={(e) => onUpdate('unit', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            {UNITS.map(unit => (
              <option key={unit.value} value={unit.value}>{unit.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Format</label>
          <select
            value={sample.shippingFormat}
            onChange={(e) => onUpdate('shippingFormat', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            {SHIPPING_FORMATS.map(format => (
              <option key={format.value} value={format.value}>{format.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">ID Substrat</label>
          <input
            type="text"
            value={sample.substrateId}
            onChange={(e) => onUpdate('substrateId', e.target.value)}
            placeholder="ex: SUB-001"
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
    </div>
  );
}
