/**
 * CANLK-11: SummaryViewer - Vue HTML consolidée du formulaire TDL
 * 
 * Affiche un sommaire HTML dynamique de toutes les données saisies dans les blocs A, B, C.
 * Se met à jour en temps réel lors de la modification des données.
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent front_nexus
 */

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export interface SummaryData {
  // Bloc A - Identification
  client?: {
    name: string;
    number: string;
    contact: string;
  };
  // Bloc B - Analyse commerciale
  commercial?: {
    targetPrice: number | null;
    dueDate: string | null;
    priority: string;
    annualPotential: string;
  };
  // Bloc C - Spécifications techniques
  technical?: {
    applicationType: string;
    brilliance: number;
    drying: string;
    isStandard: boolean;
  };
  // Bloc D - Logistique
  logistics?: {
    containerFormat: string;
    isBillable: boolean;
    notes: string;
  };
  // Métadonnées
  missingFields?: string[];
}

interface SummaryViewerProps {
  data: SummaryData;
  isLoading?: boolean;
}

export function SummaryViewer({ data, isLoading = false }: SummaryViewerProps) {
  const hasMissingFields = data.missingFields && data.missingFields.length > 0;

  if (isLoading) {
    return (
      <Card className="summary-viewer">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Résumé de la demande</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="summary-viewer">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span>
          <span>Résumé de la demande</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Avertissement si champs manquants */}
        {hasMissingFields && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-medium text-yellow-800">⚠️ Informations manquantes</p>
            <ul className="mt-1 text-sm text-yellow-700">
              {data.missingFields.map((field, index) => (
                <li key={index}>• {field}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Client (Bloc A) */}
        {data.client && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 border-b pb-1 mb-2">
              Client
            </h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500">Nom</dt>
                <dd className="font-medium">{data.client.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Numéro</dt>
                <dd className="font-medium">{data.client.number}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Contact</dt>
                <dd className="font-medium">{data.client.contact}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Analyse commerciale (Bloc B) */}
        {data.commercial && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 border-b pb-1 mb-2">
              Analyse Commerciale
            </h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500">Prix visé</dt>
                <dd className="font-medium">
                  {data.commercial.targetPrice 
                    ? `${data.commercial.targetPrice.toFixed(2)} $` 
                    : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Date d'échéance</dt>
                <dd className="font-medium">{data.commercial.dueDate || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Priorité</dt>
                <dd className="font-medium">{data.commercial.priority || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Potentiel annuel</dt>
                <dd className="font-medium">{data.commercial.annualPotential || '-'}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Spécifications techniques (Bloc C) */}
        {data.technical && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 border-b pb-1 mb-2">
              Spécifications Techniques
            </h4>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-gray-500">Application</dt>
                <dd className="font-medium capitalize">{data.technical.applicationType || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Brilliance</dt>
                <dd className="font-medium">{data.technical.brilliance || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Séchage</dt>
                <dd className="font-medium capitalize">{data.technical.drying || '-'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Standard</dt>
                <dd className="font-medium">
                  {data.technical.isStandard ? 'Oui' : 'Non'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Logistique (Bloc D) */}
        {data.logistics && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 border-b pb-1 mb-2">
              Logistique
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Format</dt>
                <dd className="font-medium">{data.logistics.containerFormat || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Facturable</dt>
                <dd className="font-medium">
                  {data.logistics.isBillable ? 'Oui' : 'Non'}
                </dd>
              </div>
              {data.logistics.notes && (
                <div>
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="font-medium">{data.logistics.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Mention facturation */}
        {data.logistics?.isBillable && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            💰 Les échantillons seront facturés au client
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SummaryViewer;
