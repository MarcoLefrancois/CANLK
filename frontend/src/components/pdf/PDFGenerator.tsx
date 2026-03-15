import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PDFGeneratorProps {
  tdlId: string;
  tdlNumber: string;
  status: string;
  onGenerated?: (url: string) => void;
}

export function PDFGenerator({ tdlId, tdlNumber, status, onGenerated }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const canGenerate = status === 'Terminé' || status === 'Completed';

  const generatePDF = async () => {
    if (!canGenerate) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-pdf',
        {
          body: { tdlId }
        }
      );

      if (functionError) throw functionError;

      if (data?.success) {
        setPdfUrl(data.url);
        onGenerated?.(data.url);
      } else {
        throw new Error(data?.error || 'Failed to generate PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3">Génération Rapport PDF</h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Génère un rapport bilingue (FR/EN) avec toutes les données du TDL.
      </p>

      {error && (
        <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {pdfUrl ? (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
            ✅ PDF généré avec succès!
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📄 Télécharger le PDF
          </a>
        </div>
      ) : (
        <button
          onClick={generatePDF}
          disabled={!canGenerate || isGenerating}
          className={`px-4 py-2 rounded text-white ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isGenerating ? '⏳ Génération en cours...' : '📄 Générer PDF'}
        </button>
      )}

      {!canGenerate && (
        <p className="text-xs text-gray-500 mt-2">
          Le rapport ne peut être généré que pour les TDLs terminés.
        </p>
      )}
    </div>
  );
}
