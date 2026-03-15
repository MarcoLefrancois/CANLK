// CANLK-144: Notification Templates for SAC (Janice) and Training
export type NotificationTemplateType = 
  | 'sac_alert'
  | 'submission_confirmation'
  | 'approval_request'
  | 'rejection_notice'
  | 'completion_notice'
  | 'sla_warning'
  | 'training_reminder';

export interface NotificationTemplate {
  id: NotificationTemplateType;
  subject: {
    fr: string;
    en: string;
  };
  body: {
    fr: string;
    en: string;
  };
  variables: string[];
  channel: 'email' | 'sms' | 'teams' | 'all';
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'sac_alert',
    subject: {
      fr: '🔔 Alerte TDL - Fin de préparation labo',
      en: '🔔 TDL Alert - Lab Preparation Complete',
    },
    body: {
      fr: `Bonjour,

La demande TDL #{{tdl_number}} pour le client {{client_name}} est prête pour révision.

Détails:
- Formule: {{formula_id}}
- Complexité: {{complexity}}
- Date de soumission: {{submission_date}}

Merci de procéder à la clôture administrative.

- L'équipe CANLK`,
      en: `Hello,

TDL request #{{tdl_number}} for client {{client_name}} is ready for review.

Details:
- Formula: {{formula_id}}
- Complexity: {{complexity}}
- Submission date: {{submission_date}}

Please proceed with administrative closure.

- CANLK Team`,
    },
    variables: ['tdl_number', 'client_name', 'formula_id', 'complexity', 'submission_date'],
    channel: 'email',
  },
  {
    id: 'submission_confirmation',
    subject: {
      fr: '✅ Confirmation de soumission - TDL #{{tdl_number}}',
      en: '✅ Submission Confirmation - TDL #{{tdl_number}}',
    },
    body: {
      fr: `Votre demande TDL a été soumise avec succès.

Numéro de suivi: {{tdl_number}}
Client: {{client_name}}
Statut: En analyse

Vous recevrez une notification lorsque votre demande sera traitée.

- CANLK`,
      en: `Your TDL request has been successfully submitted.

Tracking number: {{tdl_number}}
Client: {{client_name}}
Status: Under review

You will be notified when your request has been processed.

- CANLK`,
    },
    variables: ['tdl_number', 'client_name'],
    channel: 'email',
  },
  {
    id: 'approval_request',
    subject: {
      fr: '📋 Demande d\'approbation - TDL #{{tdl_number}}',
      en: '📋 Approval Request - TDL #{{tdl_number}}',
    },
    body: {
      fr: `Une demande TDL requiert votre approbation.

Numéro: {{tdl_number}}
Client: {{client_name}}
Priorité: {{priority}}

Veuillez vous connecter pour traiter cette demande.`,
      en: `A TDL request requires your approval.

Number: {{tdl_number}}
Client: {{client_name}}
Priority: {{priority}}

Please log in to process this request.`,
    },
    variables: ['tdl_number', 'client_name', 'priority'],
    channel: 'teams',
  },
  {
    id: 'completion_notice',
    subject: {
      fr: '🎉 TDL Qualifié - TDL #{{tdl_number}}',
      en: '🎉 TDL Qualified - TDL #{{tdl_number}}',
    },
    body: {
      fr: `Félicitations! Votre demande TDL a été qualifiée.

Numéro: {{tdl_number}}
Date de qualification: {{qualification_date}}
Rapport disponible: {{report_link}}

Merci de votre confiance.

- CANLK`,
      en: `Congratulations! Your TDL request has been qualified.

Number: {{tdl_number}}
Qualification date: {{qualification_date}}
Report available: {{report_link}}

Thank you for your trust.

- CANLK`,
    },
    variables: ['tdl_number', 'qualification_date', 'report_link'],
    channel: 'email',
  },
  {
    id: 'sla_warning',
    subject: {
      fr: '⚠️ Avertissement SLA - TDL #{{tdl_number}}',
      en: '⚠️ SLA Warning - TDL #{{tdl_number}}',
    },
    body: {
      fr: `Attention: Le délai SLA approche pour cette demande.

Numéro: {{tdl_number}}
Deadline: {{sla_deadline}}
Temps restant: {{time_remaining}}

Veuillez traiter en priorité.`,
      en: `Warning: SLA deadline approaching for this request.

Number: {{tdl_number}}
Deadline: {{sla_deadline}}
Time remaining: {{time_remaining}}

Please process with priority.`,
    },
    variables: ['tdl_number', 'sla_deadline', 'time_remaining'],
    channel: 'teams',
  },
];

export function useNotificationTemplates() {
  const renderTemplate = (
    templateId: NotificationTemplateType,
    variables: Record<string, string>,
    language: 'fr' | 'en' = 'fr'
  ): { subject: string; body: string } => {
    const template = NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
    
    if (!template) {
      return { subject: '', body: '' };
    }
    
    let subject = template.subject[language];
    let body = template.body[language];
    
    Object.entries(variables).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return { subject, body };
  };

  const getTemplate = (templateId: NotificationTemplateType): NotificationTemplate | undefined => {
    return NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
  };

  return {
    templates: NOTIFICATION_TEMPLATES,
    renderTemplate,
    getTemplate,
  };
}
