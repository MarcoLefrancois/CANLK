/**
 * CANLK-205: StageLogViewer - Visualisation de l'historique des changements
 * 
 * @version Sprint 4 | 2026-03-15
 * @agent front_nexus
 */

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { StageLogEntry, STATUS_COLORS } from '../../types/triage';

interface StageLogViewerProps {
  tdlId: string;
  entries: StageLogEntry[];
  isLoading?: boolean;
}

export function StageLogViewer({ tdlId, entries, isLoading = false }: StageLogViewerProps) {
  if (isLoading) {
    return (
      <Card className="stage-log-viewer">
        <CardHeader>
          <CardTitle className="text-lg">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="stage-log-viewer">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>📜</span>
          <span>Historique des changements</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aucun historique disponible
          </p>
        ) : (
          <div className="relative">
            {/* Timeline */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div key={entry.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div 
                    className="absolute left-2 top-2 w-4 h-4 rounded-full border-2 border-white"
                    style={{ backgroundColor: STATUS_COLORS[entry.status_to as keyof typeof STATUS_COLORS] || '#6b7280' }}
                  />

                  {/* Entry content */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          <span 
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ 
                              backgroundColor: `${STATUS_COLORS[entry.status_from as keyof typeof STATUS_COLORS] || '#6b7280']}20`,
                              color: STATUS_COLORS[entry.status_from as keyof typeof STATUS_COLORS] || '#6b7280'
                            }}
                          >
                            {entry.status_from}
                          </span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span 
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ 
                              backgroundColor: `${STATUS_COLORS[entry.status_to as keyof typeof STATUS_COLORS]}20`,
                              color: STATUS_COLORS[entry.status_to as keyof typeof STATUS_COLORS]
                            }}
                          >
                            {entry.status_to}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Par: <span className="font-medium">{entry.actor_name}</span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.timestamp).toLocaleString('fr-CA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    
                    {entry.reason && (
                      <p className="mt-2 text-sm text-gray-600 bg-white p-2 rounded border">
                        💬 {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StageLogViewer;
