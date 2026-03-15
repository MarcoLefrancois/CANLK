/**
 * CANLK-93: Consultation de la fiche client et des SOP
 * 
 * En tant que Technicien de laboratoire,
 * je veux accéder à la fiche client et aux SOP directement depuis le formulaire TDL,
 * afin de consulter les exigences spécifiques du client pour réaliser les tests correctement.
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';

export interface SopViewerData {
  clientId: string | null;
  clientName: string | null;
  clientSharepointUrl: string | null;
  sopFolderUrl: string | null;
}

interface SopViewerProps {
  data: SopViewerData;
  onRefresh?: () => void;
}

export function SopViewer({ data, onRefresh }: SopViewerProps) {
  const hasClient = !!data.clientName;
  const hasSop = !!data.sopFolderUrl;
  const hasClientDoc = !!data.clientSharepointUrl;

  return (
    <Card className="sop-viewer">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span>
          <span>Documents Client & SOP</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasClient ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">Aucun client sélectionné</p>
            <p className="text-sm">
              Sélectionnez un client pour accéder aux documents
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Client Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium">{data.clientName}</p>
            </div>

            {/* Fiche client SharePoint */}
            <div>
              {hasClientDoc ? (
                <a
                  href={data.clientSharepointUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-blue-600"
                >
                  <span className="text-xl">📁</span>
                  <div>
                    <p className="font-medium">Voir fiche client</p>
                    <p className="text-xs text-gray-500">Documents SharePoint</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 text-gray-400">
                  <span className="text-xl">📁</span>
                  <div>
                    <p className="font-medium">Fiche client non disponible</p>
                    <p className="text-xs">Contactez l'administrateur</p>
                  </div>
                </div>
              )}
            </div>

            {/* Dossier SOP */}
            <div>
              {hasSop ? (
                <a
                  href={data.sopFolderUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors text-blue-600"
                >
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="font-medium">Consulter SOP</p>
                    <p className="text-xs text-gray-500">Procédures opérationnelles standard</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-yellow-50 text-yellow-700">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-medium">Dossier SOP introuvable</p>
                    <p className="text-xs">Le dossier n'existe pas encore pour ce client</p>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh button */}
            {onRefresh && (
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="w-full"
              >
                🔄 Rafraîchir les liens
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Génère les URLs SharePoint pour un client
 */
export function generateSharePointUrls(clientName: string | null): SopViewerData {
  if (!clientName) {
    return {
      clientId: null,
      clientName: null,
      clientSharepointUrl: null,
      sopFolderUrl: null,
    };
  }

  // Normalize client name for SharePoint URL
  const normalizedName = clientName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9]/g, '');   // Remove special chars

  const baseUrl = 'https://nmedia.sharepoint.com/sites/Clients';

  return {
    clientId: null,
    clientName,
    clientSharepointUrl: `${baseUrl}/${normalizedName}`,
    sopFolderUrl: `${baseUrl}/${normalizedName}/SOP`,
  };
}

export default SopViewer;
