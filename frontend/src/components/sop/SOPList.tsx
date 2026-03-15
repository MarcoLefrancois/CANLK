/**
 * CANLK-108: SOPList - Liste des documents SOP
 * 
 * @version Sprint 5 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export interface SOPDocument {
  id: string;
  sharepointId: string;
  clientId: string;
  title: string;
  description: string;
  filePath: string;
  productType: string;
  version: string;
}

interface SOPListProps {
  clientId?: string | null;
  onSelectDocument?: (doc: SOPDocument) => void;
}

export function SOPList({ clientId, onSelectDocument }: SOPListProps) {
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        let query = fetch('/api/sop/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId }),
        });

        // Simulated for now - in production, this would be a real API call
        // For demo purposes, using mock data
        setDocuments([
          {
            id: '1',
            sharepointId: 'SP-001',
            clientId: clientId || 'default',
            title: 'Procédure Standard - Vernis UV',
            description: 'Procédure de contrôle qualité pourapplication de vernis UV',
            filePath: '/sop/vernis-uv.pdf',
            productType: 'Vernis',
            version: '2.1',
          },
          {
            id: '2',
            sharepointId: 'SP-002',
            clientId: clientId || 'default',
            title: 'Guide Application - Peintures',
            description: 'Guide pour l\'application de peintures hydro',
            filePath: '/sop/peintures-hydro.pdf',
            productType: 'Peinture',
            version: '1.5',
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [clientId]);

  const handleSelect = (doc: SOPDocument) => {
    setSelectedId(doc.id);
    onSelectDocument?.(doc);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents SOP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sop-list">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>📋</span>
          <span>Documents SOP</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-4">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aucun document SOP disponible
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => handleSelect(doc)}
                className={`w-full p-3 text-left border rounded-lg transition-colors ${
                  selectedId === doc.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-gray-500">{doc.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {doc.productType}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        v{doc.version}
                      </span>
                    </div>
                  </div>
                  <span className="text-blue-600">→</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SOPList;
