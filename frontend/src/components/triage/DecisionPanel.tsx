/**
 * CANLK-202: DecisionPanel - Panneau de décision pour superviseurs
 * 
 * @version Sprint 4 | 2026-03-15
 * @agent front_nexus + ms_engine
 */

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { TDLRecord, Technician, DecisionAction, DecisionPayload } from '../../types/triage';

interface DecisionPanelProps {
  tdl: TDLRecord;
  technicians: Technician[];
  onDecision: (payload: DecisionPayload) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

const DEPARTMENTS = [
  { code: 'colors_qc', label: 'Couleurs Québec' },
  { code: 'colors_on', label: 'Couleurs Ontario' },
  { code: 'rd_qc', label: 'R&D Québec' },
  { code: 'rd_on', label: 'R&D Ontario' },
];

export function DecisionPanel({ tdl, technicians, onDecision, isLoading = false }: DecisionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<DecisionAction | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter technicians by current department
  const availableTechnicians = technicians.filter(
    t => t.department === tdl.department && t.is_active && t.current_load < t.max_load
  );

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!selectedAction) {
      setError('Veuillez sélectionner une action');
      return;
    }

    if (selectedAction === 'APPROVE' && !selectedTechnician) {
      setError('Veuillez sélectionner un technicien');
      return;
    }

    if (selectedAction === 'REQUEST_INFO' && !reason.trim()) {
      setError('Veuillez fournir un motif');
      return;
    }

    setSubmitting(true);

    try {
      const result = await onDecision({
        tdl_id: tdl.id,
        action: selectedAction,
        technician_id: selectedAction === 'APPROVE' ? selectedTechnician : undefined,
        new_department: selectedAction === 'REDIRECT' ? selectedDepartment : undefined,
        reason: selectedAction === 'REQUEST_INFO' ? reason : undefined,
      });

      if (!result.success) {
        setError(result.error || 'Erreur lors de la décision');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  };

  const isReadOnly = tdl.status !== 'Soumis';

  return (
    <Card className="decision-panel">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>📋</span>
          <span>Décision TDL #{tdl.tdl_number}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isReadOnly ? (
          <div className="text-center py-8 text-gray-500">
            <p>Ce TDL ne peut plus être traité.</p>
            <p className="text-sm">Statut actuel: {tdl.status}</p>
          </div>
        ) : (
          <>
            {/* Client Info */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{tdl.client_name}</p>
              <p className="text-sm text-gray-500">Département: {tdl.department}</p>
            </div>

            {/* Action Selection */}
            <div className="space-y-2">
              <label className="font-medium">Action *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAction('APPROVE')}
                  disabled={submitting}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selectedAction === 'APPROVE' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-1">✅</div>
                  <div className="text-sm font-medium">Approuver</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction('REDIRECT')}
                  disabled={submitting}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selectedAction === 'REDIRECT' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="text-sm font-medium">Rediriger</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAction('REQUEST_INFO')}
                  disabled={submitting}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    selectedAction === 'REQUEST_INFO' 
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-1">❓</div>
                  <div className="text-sm font-medium">Demander info</div>
                </button>
              </div>
            </div>

            {/* Technician Selection (for APPROVE) */}
            {selectedAction === 'APPROVE' && (
              <div className="space-y-2">
                <label className="font-medium">Technicien *</label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Sélectionner un technician...</option>
                  {availableTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} ({tech.current_load}/{tech.max_load})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Selection (for REDIRECT) */}
            {selectedAction === 'REDIRECT' && (
              <div className="space-y-2">
                <label className="font-medium">Nouveau département *</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept.code} value={dept.code} disabled={dept.code === tdl.department}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reason (for REQUEST_INFO) */}
            {selectedAction === 'REQUEST_INFO' && (
              <div className="space-y-2">
                <label className="font-medium">Motif *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={submitting}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Précisions المطلوبة..."
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedAction || submitting}
              className="w-full"
            >
              {submitting ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DecisionPanel;
