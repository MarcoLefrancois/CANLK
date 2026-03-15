import { useMemo } from 'react';

export type Region = 'QC' | 'ON' | 'US';

export interface RegionalConfig {
  region: Region;
  language: 'fr' | 'en';
  currency: 'CAD' | 'USD';
  dateFormat: string;
  timezone: string;
  labHours: {
    start: string;
    end: string;
  };
  slaHours: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const REGIONAL_CONFIGS: Record<Region, RegionalConfig> = {
  QC: {
    region: 'QC',
    language: 'fr',
    currency: 'CAD',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'America/Toronto',
    labHours: {
      start: '08:00',
      end: '17:00',
    },
    slaHours: {
      critical: 24,
      high: 48,
      medium: 72,
      low: 168,
    },
  },
  ON: {
    region: 'ON',
    language: 'en',
    currency: 'CAD',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'America/Toronto',
    labHours: {
      start: '08:00',
      end: '17:00',
    },
    slaHours: {
      critical: 24,
      high: 48,
      medium: 72,
      low: 168,
    },
  },
  US: {
    region: 'US',
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    labHours: {
      start: '08:00',
      end: '18:00',
    },
    slaHours: {
      critical: 24,
      high: 48,
      medium: 96,
      low: 240,
    },
  },
};

export interface RoutingRule {
  id: string;
  sourceRegion: Region;
  targetDepartment: string;
  conditions: {
    formulaType?: string;
    priority?: string;
    clientType?: string;
  };
}

export const ROUTING_RULES: RoutingRule[] = [
  {
    id: 'qc-standard',
    sourceRegion: 'QC',
    targetDepartment: 'Labo QC',
    conditions: {},
  },
  {
    id: 'on-standard',
    sourceRegion: 'ON',
    targetDepartment: 'Labo ON',
    conditions: {},
  },
  {
    id: 'us-standard',
    sourceRegion: 'US',
    targetDepartment: 'Labo US',
    conditions: {},
  },
  {
    id: 'qc-urgent',
    sourceRegion: 'QC',
    targetDepartment: 'Labo QC Prioritaire',
    conditions: { priority: 'critical' },
  },
  {
    id: 'on-urgent',
    sourceRegion: 'ON',
    targetDepartment: 'Labo ON Prioritaire',
    conditions: { priority: 'critical' },
  },
];

export function useRegionalRouting(region: Region) {
  const config = useMemo(() => REGIONAL_CONFIGS[region], [region]);
  
  const getDepartment = (priority?: string, formulaType?: string): string => {
    const rules = ROUTING_RULES.filter(
      (r) => r.sourceRegion === region
    );
    
    // First try to match urgent rules
    const urgentRule = rules.find((r) => r.conditions.priority === priority);
    if (urgentRule) return urgentRule.targetDepartment;
    
    // Fall back to standard rule
    const standardRule = rules.find((r) => Object.keys(r.conditions).length === 0);
    return standardRule?.targetDepartment ?? 'Labo QC';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(
      region === 'QC' ? 'fr-CA' : 'en-CA',
      { year: 'numeric', month: '2-digit', day: '2-digit' }
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(region === 'QC' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: config.currency,
    }).format(amount);
  };

  const isLabOpen = (): boolean => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });
    return currentTime >= config.labHours.start && currentTime <= config.labHours.end;
  };

  const getSLAHours = (priority: 'critical' | 'high' | 'medium' | 'low'): number => {
    return config.slaHours[priority];
  };

  const calculateSLA = (priority: 'critical' | 'high' | 'medium' | 'low'): Date => {
    const slaHours = getSLAHours(priority);
    return new Date(Date.now() + slaHours * 60 * 60 * 1000);
  };

  return {
    config,
    getDepartment,
    formatDate,
    formatCurrency,
    isLabOpen,
    getSLAHours,
    calculateSLA,
  };
}
