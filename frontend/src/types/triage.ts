/**
 * Types pour le module Triage - Sprint 4
 * 
 * @version Sprint 4 | 2026-03-15
 */

export type TDLStatus = 
  | 'Brouillon'
  | 'Soumis'
  | 'En Analyse'
  | 'En Révision'
  | 'En Cours - Labo'
  | 'Info Requise'
  | 'Qualifié'
  | 'Rejeté'
  | 'Terminé';

export type DecisionAction = 'APPROVE' | 'REDIRECT' | 'REQUEST_INFO';

export interface TDLRecord {
  id: string;
  tdl_number: string;
  client_name: string;
  department: string;
  priority: string;
  status: TDLStatus;
  complexity_score?: number;
  submitted_at: string;
  submitted_by: string;
  assigned_technician?: string;
  assigned_at?: string;
}

export interface TriageQueueItem {
  id: string;
  tdl_id: string;
  tdl_number: string;
  client_name: string;
  department: string;
  priority: string;
  submitted_at: string;
  sla_deadline?: string;
  is_overdue?: boolean;
}

export interface Technician {
  id: string;
  user_id: string;
  name: string;
  department: string;
  current_load: number;
  max_load: number;
  is_active: boolean;
}

export interface LoadIndicator {
  technician_id: string;
  technician_name: string;
  current_load: number;
  max_load: number;
  percentage: number;
}

export interface DecisionPayload {
  tdl_id: string;
  action: DecisionAction;
  technician_id?: string;
  new_department?: string;
  reason?: string;
}

export interface StageLogEntry {
  id: string;
  tdl_id: string;
  status_from: string;
  status_to: string;
  actor_id: string;
  actor_name: string;
  reason?: string;
  timestamp: string;
}

export interface TriageFilters {
  department?: string;
  priority?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export const STATUS_COLORS: Record<TDLStatus, string> = {
  'Brouillon': '#6b7280',
  'Soumis': '#3b82f6',
  'En Analyse': '#eab308',
  'En Révision': '#8b5cf6',
  'En Cours - Labo': '#f59e0b',
  'Info Requise': '#ec4899',
  'Qualifié': '#22c55e',
  'Rejeté': '#ef4444',
  'Terminé': '#14b8a6',
};

export const PRIORITY_LABELS: Record<string, string> = {
  'high': 'Haute',
  'medium': 'Moyenne',
  'low': 'Basse',
};
