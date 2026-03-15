/**
 * CANLK-11: Summary Builder - Logique de construction du sommaire HTML
 * 
 * Construit dynamiquement le sommaire HTML à partir des données du formulaire.
 * Performance cible: < 100ms
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent ms_engine
 */

import { SummaryData } from '../components/logistics/SummaryViewer';

export interface TDLFormData {
  client?: {
    name: string;
    number: string;
    contact: string;
    email: string;
    phone: string;
  };
  commercial?: {
    targetPrice: number | null;
    dueDate: string | null;
    priorityCode: string;
    annualPotential: string;
    sku: string;
  };
  technical?: {
    applicationType: string;
    isStandard: boolean;
    brilliance: number;
    drying: string;
  };
  logistics?: {
    containerFormat: string;
    isBillable: boolean;
    notes: string;
  };
}

/**
 * Valide les champs obligatoires et retourne la liste des champs manquants
 */
export function validateRequiredFields(data: TDLFormData): string[] {
  const missing: string[] = [];

  // Bloc A - Client
  if (!data.client?.name) {
    missing.push('Nom du client (Bloc A)');
  }
  if (!data.client?.contact) {
    missing.push('Contact (Bloc A)');
  }

  // Bloc B - Commercial
  if (!data.commercial?.targetPrice) {
    missing.push('Prix visé (Bloc B)');
  }
  if (!data.commercial?.dueDate) {
    missing.push('Date limite (Bloc B)');
  }

  // Bloc C - Technique
  if (!data.technical?.applicationType) {
    missing.push('Type application (Bloc C)');
  }

  // Bloc D - Logistique
  if (!data.logistics?.containerFormat) {
    missing.push('Format contenant (Bloc D)');
  }

  return missing;
}

/**
 * Convertit les données du formulaire en format pour le SummaryViewer
 */
export function prepareSummaryData(data: TDLFormData): SummaryData {
  const missingFields = validateRequiredFields(data);

  return {
    client: data.client ? {
      name: data.client.name,
      number: data.client.number,
      contact: data.client.contact,
    } : undefined,
    commercial: data.commercial ? {
      targetPrice: data.commercial.targetPrice,
      dueDate: data.commercial.dueDate,
      priority: translatePriority(data.commercial.priorityCode),
      annualPotential: translatePotential(data.commercial.annualPotential),
    } : undefined,
    technical: data.technical ? {
      applicationType: data.technical.applicationType,
      brilliance: data.technical.brilliance,
      drying: data.technical.drying,
      isStandard: data.technical.isStandard,
    } : undefined,
    logistics: data.logistics ? {
      containerFormat: translateContainer(data.logistics.containerFormat),
      isBillable: data.logistics.isBillable,
      notes: data.logistics.notes,
    } : undefined,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}

// Fonctions de traduction pour l'affichage
function translatePriority(code: string): string {
  const translations: Record<string, string> = {
    'high': 'Haute',
    'medium': 'Moyenne',
    'low': 'Basse',
  };
  return translations[code] || code;
}

function translatePotential(code: string): string {
  const translations: Record<string, string> = {
    'lt10k': 'Moins de 10K$',
    '10k50k': '10K$ - 50K$',
    '50k100k': '50K$ - 100K$',
    'gt100k': 'Plus de 100K$',
  };
  return translations[code] || code;
}

function translateContainer(code: string): string {
  const translations: Record<string, string> = {
    '1l': '1 Litre',
    '4l': '4 Litres',
    '20l': '20 Litres',
    'custom': 'Personnalisé',
    'virtual': 'Virtuel (Sans échantillon)',
  };
  return translations[code] || code;
}

/**
 * Construit le sommaire HTML (pour export ou affichage avancé)
 * Note: Le SummaryViewer utilise maintenant JSX directement
 */
export function buildHTMLSummary(data: TDLFormData): string {
  const summary = prepareSummaryData(data);
  
  // Construction du HTML (si besoin d'export)
  let html = `<div class="tdl-summary">`;
  
  if (summary.client) {
    html += `<h3>Client</h3>`;
    html += `<p><strong>Nom:</strong> ${summary.client.name}</p>`;
    html += `<p><strong>Numéro:</strong> ${summary.client.number}</p>`;
  }
  
  if (summary.commercial) {
    html += `<h3>Analyse Commerciale</h3>`;
    html += `<p><strong>Prix visé:</strong> ${summary.commercial.targetPrice || '-'}</p>`;
    html += `<p><strong>Date:</strong> ${summary.commercial.dueDate || '-'}</p>`;
  }
  
  if (summary.technical) {
    html += `<h3>Spécifications Techniques</h3>`;
    html += `<p><strong>Application:</strong> ${summary.technical.applicationType}</p>`;
    html += `<p><strong>Brilliance:</strong> ${summary.technical.brilliance}%</p>`;
  }
  
  if (summary.logistics) {
    html += `<h3>Logistique</h3>`;
    html += `<p><strong>Format:</strong> ${summary.logistics.containerFormat}</p>`;
    html += `<p><strong>Facturable:</strong> ${summary.logistics.isBillable ? 'Oui' : 'Non'}</p>`;
  }
  
  html += `</div>`;
  
  return html;
}

export default {
  validateRequiredFields,
  prepareSummaryData,
  buildHTMLSummary,
};
