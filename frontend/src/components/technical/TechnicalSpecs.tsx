/**
 * CANLK-10: Spécifications Techniques (Bloc C)
 * 
 * En tant que Représentant aux ventes,
 * je veux saisir les spécificités techniques du produit requis (Application, Brilliance),
 * afin de fournir au laboratoire les paramètres nécessaires à l'exécution.
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus + ms_engine
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export interface TechnicalSpecsData {
  applicationType: string;
  isStandard: boolean;
  brilliance: number;
  drying: string;
  clientSharepointUrl: string | null;
  sopFolderUrl: string | null;
}

interface TechnicalSpecsProps {
  data: TechnicalSpecsData;
  onChange: (data: TechnicalSpecsData) => void;
  clientName?: string | null;
  readOnly?: boolean;
}

const APPLICATION_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'spray', label: 'Spray' },
  { value: 'wipe', label: 'Wipe' },
];

const BRILLIANCE_OPTIONS = [
  { value: 20, label: '20% - Mat' },
  { value: 50, label: '50% - Satiné' },
  { value: 70, label: '70% - Brillant' },
  { value: 90, label: '90% - Haute brillance' },
];

const DRYING_OPTIONS = [
  { value: 'air', label: 'Séchage à l\'air' },
  { value: 'oven', label: 'Four' },
  { value: 'uv', label: 'UV/IR' },
];

export function TechnicalSpecs({ data, onChange, clientName, readOnly = false }: TechnicalSpecsProps) {
  const [showDryingUVIR, setShowDryingUVIR] = useState(true);
  const [sopError, setSopError] = useState<string | null>(null);

  // Determine if SOP link should be shown based on client selection
  useEffect(() => {
    if (clientName) {
      // Generate SharePoint URLs dynamically
      const clientFolder = clientName.replace(/[^a-zA-Z0-9]/g, '');
      const sharepointBaseUrl = 'https://nmedia.sharepoint.com/sites/Clients';
      
      const newData = {
        ...data,
        clientSharepointUrl: `${sharepointBaseUrl}/${clientFolder}`,
        sopFolderUrl: `${sharepointBaseUrl}/${clientFolder}/SOP`,
      };
      
      onChange(newData);
      setSopError(null);
    } else {
      const newData = {
        ...data,
        clientSharepointUrl: null,
        sopFolderUrl: null,
      };
      onChange(newData);
    }
  }, [clientName]);

  // Hide UV/IR drying option when Wipe is selected
  useEffect(() => {
    if (data.applicationType === 'wipe') {
      setShowDryingUVIR(false);
      onChange({ ...data, drying: 'air' });
    } else {
      setShowDryingUVIR(true);
    }
  }, [data.applicationType]);

  const handleChange = (field: keyof TechnicalSpecsData, value: string | number | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="technical-specs">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Spécifications Techniques (Bloc C)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type d'application */}
        <div className="space-y-2">
          <Label htmlFor="applicationType">
            Type d'application *
          </Label>
          <select
            id="applicationType"
            value={data.applicationType}
            onChange={(e) => handleChange('applicationType', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Sélectionner...</option>
            {APPLICATION_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Standard */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.isStandard}
              onChange={(e) => handleChange('isStandard', e.target.checked)}
              disabled={readOnly}
            />
            <span>Produit standard</span>
          </Label>
        </div>

        {/* Brilliance */}
        <div className="space-y-2">
          <Label htmlFor="brilliance">
            Brilliance (Gloss) *
          </Label>
          <select
            id="brilliance"
            value={data.brilliance}
            onChange={(e) => handleChange('brilliance', parseInt(e.target.value))}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value={50}>50% - Par défaut</option>
            {BRILLIANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Séchage - conditionally shown */}
        {showDryingUVIR && (
          <div className="space-y-2">
            <Label htmlFor="drying">
              Type de séchage
            </Label>
            <select
              id="drying"
              value={data.drying}
              onChange={(e) => handleChange('drying', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Sélectionner...</option>
              {DRYING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* SharePoint Links - Read only section */}
        <div className="mt-6 pt-4 border-t space-y-3">
          <Label className="font-medium">Documents SharePoint</Label>
          
          {clientName ? (
            <div className="space-y-2">
              {/* Fiche client */}
              {data.clientSharepointUrl && (
                <a
                  href={data.clientSharepointUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <span className="icon">📁</span>
                  <span>Voir fiche client: {clientName}</span>
                </a>
              )}
              
              {/* Dossier SOP */}
              {data.sopFolderUrl ? (
                <a
                  href={data.sopFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <span className="icon">📋</span>
                  <span>Consulter SOP</span>
                </a>
              ) : (
                <p className="text-sm text-yellow-600">
                  Dossier SOP non trouvé pour ce client
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Sélectionnez un client pour afficher les documents
            </p>
          )}
          
          {sopError && (
            <p className="text-sm text-red-500">{sopError}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TechnicalSpecs;
