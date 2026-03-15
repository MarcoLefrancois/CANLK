/**
 * CANLK-197: TriageDashboard - Tableau de bord pour superviseurs
 * 
 * @version Sprint 4 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TriageQueueItem, Technician, LoadIndicator, TriageFilters, PRIORITY_LABELS } from '../../types/triage';

interface TriageDashboardProps {
  department: string;
  onSelectTDL?: (tdlId: string) => void;
}

export function TriageDashboard({ department, onSelectTDL }: TriageDashboardProps) {
  const [queue, setQueue] = useState<TriageQueueItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TriageFilters>({});
  const [selectedTDL, setSelectedTDL] = useState<string | null>(null);

  // Calculate load indicators
  const loadIndicators: LoadIndicator[] = technicians.map(tech => ({
    technician_id: tech.id,
    technician_name: tech.name,
    current_load: tech.current_load,
    max_load: tech.max_load,
    percentage: Math.round((tech.current_load / tech.max_load) * 100),
  }));

  // Filter queue based on selected filters
  const filteredQueue = queue.filter(item => {
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });

  // Count overdue items
  const overdueCount = queue.filter(item => item.is_overdue).length;

  const handleSelectTDL = (tdlId: string) => {
    setSelectedTDL(tdlId);
    onSelectTDL?.(tdlId);
  };

  return (
    <div className="triage-dashboard space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold">{queue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">En retard</p>
            <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Techniciens</p>
            <p className="text-2xl font-bold">{technicians.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Charge moy.</p>
            <p className="text-2xl font-bold">
              {loadIndicators.length > 0 
                ? Math.round(loadIndicators.reduce((acc, l) => acc + l.percentage, 0) / loadIndicators.length)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Load Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Charge des techniciens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loadIndicators.map(indicator => (
              <div key={indicator.technician_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{indicator.technician_name}</span>
                  <span>{indicator.current_load}/{indicator.max_load}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      indicator.percentage >= 90 ? 'bg-red-500' :
                      indicator.percentage >= 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(indicator.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {loadIndicators.length === 0 && (
              <p className="text-gray-500 text-sm">Aucun technicien actif</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">File d'attente - {department}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <select
              className="px-3 py-2 border rounded-md"
              value={filters.priority || ''}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
            >
              <option value="">Toutes priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Client</th>
                  <th className="text-left py-2 px-2">Priorité</th>
                  <th className="text-left py-2 px-2">Soumis</th>
                  <th className="text-left py-2 px-2">SLA</th>
                  <th className="text-left py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map(item => (
                  <tr 
                    key={item.id} 
                    className={`border-b hover:bg-gray-50 ${item.is_overdue ? 'bg-red-50' : ''}`}
                  >
                    <td className="py-2 px-2 font-mono text-sm">{item.tdl_number}</td>
                    <td className="py-2 px-2">{item.client_name}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.priority === 'high' ? 'bg-red-100 text-red-700' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {PRIORITY_LABELS[item.priority] || item.priority}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-sm">
                      {new Date(item.submitted_at).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="py-2 px-2">
                      {item.is_overdue ? (
                        <span className="text-red-600 font-medium">En retard</span>
                      ) : item.sla_deadline ? (
                        <span className="text-sm">
                          {new Date(item.sla_deadline).toLocaleDateString('fr-CA')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => handleSelectTDL(item.tdl_id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Traiter →
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun TDL en attente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TriageDashboard;
