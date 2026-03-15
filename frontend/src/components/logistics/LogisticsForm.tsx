/**
 * CANLK-11: Logistique & Sommaire (Bloc D)
 * 
 * En tant que Représentant aux ventes,
 * je veux définir les modalités logistiques et visualiser un sommaire HTML,
 * afin de vérifier l'exactitude des informations avant soumission.
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent front_nexus + ms_engine
 */

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export interface LogisticsData {
  containerFormat: string;
  isBillable: boolean;
  notes: string;
}

interface LogisticsFormProps {
  data: LogisticsData;
  onChange: (data: LogisticsData) => void;
  readOnly?: boolean;
}

const CONTAINER_OPTIONS = [
  { value: '1l', label: '1 Litre' },
  { value: '4l', label: '4 Litres' },
  { value: '20l', label: '20 Litres' },
  { value: 'custom', label: 'Personnalisé' },
  { value: 'virtual', label: 'Virtuel (Sans échantillon)' },
];

export function LogisticsForm({ data, onChange, readOnly = false }: LogisticsFormProps) {
  const handleChange = (field: keyof LogisticsData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="logistics-form">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Logistique & Expédition (Bloc D)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format du contenant */}
        <div className="space-y-2">
          <Label htmlFor="containerFormat">
            Format du contenant *
          </Label>
          <select
            id="containerFormat"
            value={data.containerFormat}
            onChange={(e) => handleChange('containerFormat', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="">Sélectionner...</option>
            {CONTAINER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Facturation */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.isBillable}
              onChange={(e) => handleChange('isBillable', e.target.checked)}
              disabled={readOnly}
            />
            <span>Échantillon facturable</span>
          </Label>
          <p className="text-sm text-gray-500">
            Cocher si le client doit payer pour les échantillons
          </p>
        </div>

        {/* Notes logistiques */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            Notes logistiques
          </Label>
          <textarea
            id="notes"
            value={data.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={readOnly}
            rows={4}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Instructions spéciales pour l'expédition..."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default LogisticsForm;
