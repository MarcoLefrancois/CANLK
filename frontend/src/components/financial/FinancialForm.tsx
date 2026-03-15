/**
 * CANLK-9: Analyse Commerciale (Bloc B)
 * 
 * En tant que Représentant aux ventes,
 * je veux saisir le potentiel financier et le prix visé de l'opportunité,
 * afin de qualifier la rentabilité du dossier.
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus + ms_engine
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

export interface FinancialData {
  targetPrice: number | null;
  dueDate: string | null;
  priorityCode: string;
  annualPotential: string;
  sku: string;
}

interface FinancialFormProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  readOnly?: boolean;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Haute' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'low', label: 'Basse' },
];

const ANNUAL_POTENTIAL_OPTIONS = [
  { value: 'lt10k', label: 'Moins de 10K$' },
  { value: '10k50k', label: '10K$ - 50K$' },
  { value: '50k100k', label: '50K$ - 100K$' },
  { value: 'gt100k', label: 'Plus de 100K$' },
];

const SKU_OPTIONS = [
  { value: '1-5', label: '1-5 SKUs' },
  { value: '6-20', label: '6-20 SKUs' },
  { value: '21-50', label: '21-50 SKUs' },
  { value: 'gt50', label: 'Plus de 50 SKUs' },
];

export function FinancialForm({ data, onChange, readOnly = false }: FinancialFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);

  // Calculate default due date (today + 30 days)
  useEffect(() => {
    if (!data.dueDate) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      onChange({
        ...data,
        dueDate: defaultDate.toISOString().split('T')[0]
      });
    }
  }, []);

  const validateAndUpdate = (field: keyof FinancialData, value: string | number | null) => {
    const newData = { ...data, [field]: value };
    const newErrors: Record<string, string> = {};

    // Validate due date is in the future
    if (field === 'dueDate' && value) {
      const selectedDate = new Date(value as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'La date de livraison ne peut être dans le passé';
      }
    }

    // Check target price warning
    if (field === 'targetPrice' && value !== null && (value as number) < 1) {
      setWarning('Attention: Le prix visé est inférieur à 1.00$');
    } else {
      setWarning(null);
    }

    setErrors(newErrors);
    onChange(newData);
  };

  return (
    <Card className="financial-form">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Analyse Commerciale (Bloc B)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date de fin de développement */}
        <div className="space-y-2">
          <Label htmlFor="dueDate">
            Date de fin de développement *
          </Label>
          <Input
            id="dueDate"
            type="date"
            value={data.dueDate || ''}
            onChange={(e) => validateAndUpdate('dueDate', e.target.value)}
            disabled={readOnly}
            className={errors.dueDate ? 'border-red-500' : ''}
          />
          {errors.dueDate && (
            <p className="text-sm text-red-500">{errors.dueDate}</p>
          )}
        </div>

        {/* Prix visé */}
        <div className="space-y-2">
          <Label htmlFor="targetPrice">
            Prix visé ($) *
          </Label>
          <Input
            id="targetPrice"
            type="number"
            step="0.01"
            min="0"
            value={data.targetPrice || ''}
            onChange={(e) => validateAndUpdate('targetPrice', e.target.value ? parseFloat(e.target.value) : null)}
            disabled={readOnly}
            className={warning ? 'border-yellow-500' : ''}
          />
          {warning && (
            <p className="text-sm text-yellow-600">{warning}</p>
          )}
        </div>

        {/* Ventes potentielles */}
        <div className="space-y-2">
          <Label htmlFor="annualPotential">
            Potentiel annuel
          </Label>
          <select
            id="annualPotential"
            value={data.annualPotential}
            onChange={(e) => validateAndUpdate('annualPotential', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sélectionner...</option>
            {ANNUAL_POTENTIAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* SKU */}
        <div className="space-y-2">
          <Label htmlFor="sku">
            Nombre de SKUs
          </Label>
          <select
            id="sku"
            value={data.sku}
            onChange={(e) => validateAndUpdate('sku', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sélectionner...</option>
            {SKU_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priorité */}
        <div className="space-y-2">
          <Label>Priorité</Label>
          <div className="flex gap-4">
            {PRIORITY_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priorityCode"
                  value={option.value}
                  checked={data.priorityCode === option.value}
                  onChange={(e) => validateAndUpdate('priorityCode', e.target.value)}
                  disabled={readOnly}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialForm;
