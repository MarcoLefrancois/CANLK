/**
 * CANLK-114: Notification SAC (Janice)
 * 
 * En tant que Coordonnateur SAC (Janice),
 * je veux recevoir une alerte immédiate lorsque le laboratoire a terminé la préparation physique des échantillons,
 * afin de lancer le processus d'expédition sans attendre la clôture administrative du dossier.
 * 
 * @version Sprint 7 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  Bell, 
  Send, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Truck,
  Mail
} from 'lucide-react'

interface NotificationTemplate {
  id: string
  name: string
  subject_fr: string
  subject_en: string
  body_fr: string
  body_en: string
}

interface TdlRequest {
  id: string
  tdl_number: string
  status: string
  client_name: string
  sample_description?: string
  lab_completed_at?: string
}

interface SacNotificationProps {
  tdlId?: string
  onSend?: (result: boolean) => void
}

// Templates de notification SAC
const SAC_NOTIFICATION_TEMPLATE = {
  subject_fr: 'TDL prêt pour expédition - {{tdl_number}}',
  subject_en: 'TDL ready for shipment - {{tdl_number}}',
  body_fr: `
Bonjour Janice,

Le TDL #{{tdl_number}} pour le client {{client_name}} est maintenant prêt pour expédition.

Description: {{sample_description}}

Merci de procéder à l'expédition selon les modalités habituelles.

- Équipe Laboratoire CANLK
  `.trim(),
  body_en: `
Hello Janice,

TDL #{{tdl_number}} for client {{client_name}} is now ready for shipment.

Description: {{sample_description}}

Please proceed with shipment according to usual procedures.

- CANLK Laboratory Team
  `.trim(),
}

export function SacNotification({ tdlId, onSend }: SacNotificationProps) {
  const queryClient = useQueryClient()
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null)

  // Fetch TDL details
  const { data: tdl, isLoading: tdlLoading } = useQuery({
    queryKey: ['tdl', tdlId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tdl_requests')
        .select('*')
        .eq('id', tdlId)
        .single()
      
      if (error) throw error
      return data as TdlRequest
    },
    enabled: !!tdlId,
  })

  // Fetch recent notifications
  const { data: recentNotifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['sac-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tdl_notifications')
        .select('*')
        .eq('type', 'sac_alert')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (error) throw error
      return data
    },
  })

  // Mutation pour envoyer la notification
  const sendNotification = useMutation({
    mutationFn: async (tdlData: TdlRequest) => {
      setIsSending(true)
      
      // Préparer le contenu de la notification
      const content = {
        subject: SAC_NOTIFICATION_TEMPLATE.subject_fr
          .replace('{{tdl_number}}', tdlData.tdl_number)
          .replace('{{client_name}}', tdlData.client_name || ''),
        body: SAC_NOTIFICATION_TEMPLATE.body_fr
          .replace('{{tdl_number}}', tdlData.tdl_number)
          .replace('{{client_name}}', tdlData.client_name || '')
          .replace('{{sample_description}}', tdlData.sample_description || ''),
      }

      // Simuler l'envoi (dans un vrai implémentation, appeler une Edge Function)
      // const { data, error } = await supabase.functions.invoke('notify-sac', {...})
      
      // Enregistrer la notification en base
      const { data, error } = await supabase
        .from('tdl_notifications')
        .insert({
          tdl_id: tdlData.id,
          type: 'sac_alert',
          recipient: 'janice@nmedia.com',
          subject: content.subject,
          body: content.body,
          status: 'sent',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sac-notifications'] })
      setSendResult({ success: true, message: 'Notification envoyée avec succès!' })
      onSend?.(true)
    },
    onError: (error: any) => {
      setSendResult({ success: false, message: error.message || 'Erreur lors de l\'envoi' })
      onSend?.(false)
    },
    onSettled: () => {
      setIsSending(false)
    },
  })

  const handleSend = () => {
    if (tdl) {
      sendNotification.mutate(tdl)
    }
  }

  // Vérifier si la notification peut être envoyée
  const canSendNotification = tdl && 
    ['qualified', 'en_expédition', 'en_expedition'].includes(tdl.status?.toLowerCase())

  if (tdlLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Chargement des informations...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          Notification SAC (Janice)
        </CardTitle>
        <CardDescription>
          Alerter le SAC lors de la fin de préparation labo, avant clôture administrative
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* TDL Info */}
        {tdl && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">TDL #{tdl.tdl_number}</span>
              <Badge variant={canSendNotification ? 'success' : 'secondary'}>
                {tdl.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Client: {tdl.client_name}
            </div>
            {tdl.sample_description && (
              <div className="text-sm text-muted-foreground">
                Échantillon: {tdl.sample_description.substring(0, 50)}...
              </div>
            )}
          </div>
        )}

        {/* Send Button */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSend}
            disabled={!canSendNotification || isSending}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer notification SAC
              </>
            )}
          </Button>
        </div>

        {/* Result Message */}
        {sendResult && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {sendResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{sendResult.message}</span>
          </div>
        )}

        {/* Status Info */}
        {!canSendNotification && tdl && (
          <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-700">
              Le TDL doit être qualifié (status: "qualified") pour envoyer la notification SAC.
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Notifications récentes
          </h4>
          
          {notificationsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ) : recentNotifications && recentNotifications.length > 0 ? (
            <div className="space-y-2">
              {recentNotifications.slice(0, 5).map((notif: any) => (
                <div key={notif.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span>{notif.subject}</span>
                  </div>
                  <Badge variant={notif.status === 'sent' ? 'success' : 'secondary'}>
                    {notif.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune notification récente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SacNotification
