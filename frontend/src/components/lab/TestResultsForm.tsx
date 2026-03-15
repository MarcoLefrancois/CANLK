/**
 * CANLK-96: TestResultsForm - Formulaire pour l'enregistrement des résultats de tests
 * 
 * @version Sprint 5 | 2026-03-15
 * @agent ms_engine + front_nexus
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';

export interface TestResultsData {
  observations: string;
  testEndDate: string;
  complexityScore?: number;
}

interface TestResultsFormProps {
  data: TestResultsData;
  onChange: (data: TestResultsData) => void;
  readOnly?: boolean;
}

export function TestResultsForm({ data, onChange, readOnly = false }: TestResultsFormProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof TestResultsData, value: string) => {
    const newData = { ...data, [field]: value };
    setError(null);
    onChange(newData);
  };

  // Check if photos are required based on complexity
  const photosRequired = data.complexityScore && data.complexityScore >= 4;

  return (
    <Card className="test-results-form">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>🧪</span>
          <span>Résultats de tests</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date de fin de test */}
        <div className="space-y-2">
          <Label htmlFor="testEndDate">
            Date de fin de test
          </Label>
          <input
            id="testEndDate"
            type="date"
            value={data.testEndDate || ''}
            onChange={(e) => handleChange('testEndDate', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* Observations */}
        <div className="space-y-2">
          <Label htmlFor="observations">
            Observations techniques
          </Label>
          <textarea
            id="observations"
            value={data.observations || ''}
            onChange={(e) => handleChange('observations', e.target.value)}
            disabled={readOnly}
            rows={6}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Saisissez vos observations et conclusions techniques..."
          />
          <p className="text-xs text-gray-500">
            Utilisez ce champ pour documenter vos conclusions, méthodes utilisées et recommandations.
          </p>
        </div>

        {/* Warning pour complexité élevée */}
        {photosRequired && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Ce test nécessite des photos. Veuillez uploader au moins une photo.
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TestResultsForm;
