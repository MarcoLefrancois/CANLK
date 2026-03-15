/**
 * CANLK-199: Notification Templates - Templates FR/EN pour les notifications
 * 
 * @version Sprint 3 | 2026-03-15
 * @agent ms_engine
 */

export interface NotificationPayload {
  tdlNumber: string;
  tdlId: string;
  clientName: string;
  priority: string;
  department: string;
  submittedBy: string;
  submittedAt: string;
  link: string;
  targetPrice?: number;
  applicationType?: string;
}

/**
 * Génère le sujet bilingue de la notification
 */
export function generateSubject(payload: NotificationPayload): string {
  return `[${payload.tdlNumber}] NOUVELLE DEMANDE / NEW REQUEST - ${payload.clientName}`;
}

/**
 * Génère le corps de l'email en format bilingue
 */
export function generateEmailBody(payload: NotificationPayload): string {
  const date = new Date(payload.submittedAt).toLocaleString('fr-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #0056b3; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9f9f9; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .value { color: #333; }
    .footer { padding: 15px; background: #eee; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 10px 20px; background: #0056b3; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Nouvelle demande TDL / New TDL Request</h2>
  </div>
  
  <div class="content">
    <div class="field">
      <span class="label">Numéro TDL / TDL Number:</span>
      <span class="value">${payload.tdlNumber}</span>
    </div>
    
    <div class="field">
      <span class="label">Client:</span>
      <span class="value">${payload.clientName}</span>
    </div>
    
    <div class="field">
      <span class="label">Priorité / Priority:</span>
      <span class="value">${payload.priority}</span>
    </div>
    
    <div class="field">
      <span class="label">Département / Department:</span>
      <span class="value">${payload.department}</span>
    </div>
    
    ${payload.targetPrice ? `
    <div class="field">
      <span class="label">Prix visé / Target Price:</span>
      <span class="value">${payload.targetPrice.toFixed(2)} $</span>
    </div>
    ` : ''}
    
    ${payload.applicationType ? `
    <div class="field">
      <span class="label">Type application / Application Type:</span>
      <span class="value">${payload.applicationType}</span>
    </div>
    ` : ''}
    
    <div class="field">
      <span class="label">Soumis par / Submitted by:</span>
      <span class="value">${payload.submittedBy}</span>
    </div>
    
    <div class="field">
      <span class="label">Date:</span>
      <span class="value">${date}</span>
    </div>
    
    <div style="margin-top: 25px;">
      <a href="${payload.link}" class="button">Ouvrir la demande / Open Request</a>
    </div>
  </div>
  
  <div class="footer">
    <p>Ce message a été envoyé automatiquement par le système TDL. / This message was sent automatically by the TDL system.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Génère le payload pour Teams/JSON notification
 */
export function generateTeamsPayload(payload: NotificationPayload): object {
  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '0056b3',
    summary: `Nouvelle demande TDL - ${payload.clientName}`,
    sections: [
      {
        activityTitle: `🔔 Nouvelle demande TDL - ${payload.tdlNumber}`,
        facts: [
          {
            name: 'Client:',
            value: payload.clientName,
          },
          {
            name: 'Priorité / Priority:',
            value: payload.priority,
          },
          {
            name: 'Département:',
            value: payload.department,
          },
          {
            name: 'Soumis par:',
            value: payload.submittedBy,
          },
        ],
        potentialAction: [
          {
            '@type': 'OpenUri',
            name: 'Ouvrir la demande / Open Request',
            targets: [
              {
                os: 'default',
                uri: payload.link,
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Vérifie le throttle (anti-spam)
 */
export function shouldSendNotification(lastNotificationTime: string | null): boolean {
  if (!lastNotificationTime) return true;
  
  const lastTime = new Date(lastNotificationTime);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60);
  
  // Ne pas envoyer si moins de 5 minutes
  return diffMinutes >= 5;
}

export default {
  generateSubject,
  generateEmailBody,
  generateTeamsPayload,
  shouldSendNotification,
};
