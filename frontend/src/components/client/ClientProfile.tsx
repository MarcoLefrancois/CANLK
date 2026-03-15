/**
 * CANLK-93: Consultation Fiche Client & SOP
 * 
 * En tant que Technicien,
 * je veux consulter la fiche client et les SOP associés au TDL
 * afin de respecter les procédures spécifiques au client.
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Download, 
  Eye,
  User,
  Calendar,
  AlertTriangle
} from 'lucide-react'

interface Sop {
  id: string
  code: string
  title: string
  title_en?: string
  version: string
  file_path?: string
}

interface ClientDetails {
  id: string
  name: string
  code: string
  email?: string
  phone?: string
  address?: string
  city?: string
  province?: string
  country?: string
  region?: 'QC' | 'ON'
  contact_name?: string
  contact_email?: string
  notes?: string
}

interface ClientProfileProps {
  clientId: string
  onSopSelect?: (sop: Sop) => void
}

export function ClientProfile({ clientId, onSopSelect }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState('info')

  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (error) throw error
      return data as ClientDetails
    },
    enabled: !!clientId,
  })

  // Fetch SOPs for this client
  const { data: sops, isLoading: sopsLoading } = useQuery({
    queryKey: ['client-sops', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tdl_sops')
        .select('*')
        .order('code', { ascending: true })
      
      if (error) throw error
      return data as Sop[]
    },
    enabled: !!clientId,
  })

  if (clientLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!client) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Aucun client trouvé</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatRegion = (region?: string) => {
    switch (region) {
      case 'QC': return 'Québec'
      case 'ON': return 'Ontario'
      default: return region || '-'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {client.name}
            </CardTitle>
            <CardDescription>Code: {client.code}</CardDescription>
          </div>
          {client.region && (
            <Badge variant={client.region === 'QC' ? 'default' : 'secondary'}>
              {formatRegion(client.region)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="sops">
              SOPs ({sops?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Contact principal */}
            {client.contact_name && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="font-medium">{client.contact_name}</p>
                  {client.contact_email && (
                    <p className="text-sm text-muted-foreground">{client.contact_email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Adresse */}
            {(client.address || client.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  {client.address && <p className="text-sm">{client.address}</p>}
                  {(client.city || client.province) && (
                    <p className="text-sm text-muted-foreground">
                      {client.city}{client.province ? `, ${client.province}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Téléphone */}
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                  {client.phone}
                </a>
              </div>
            )}

            {/* Email */}
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="text-sm hover:underline">
                  {client.email}
                </a>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sops" className="mt-4">
            {sopsLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            ) : sops && sops.length > 0 ? (
              <div className="space-y-2">
                {sops.map((sop) => (
                  <div
                    key={sop.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium">{sop.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Code: {sop.code} • Version: {sop.version}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSopSelect?.(sop)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {sop.file_path && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={sop.file_path} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun SOP trouvé pour ce client</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ClientProfile
