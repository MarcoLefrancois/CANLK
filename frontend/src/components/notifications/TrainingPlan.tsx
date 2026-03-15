/**
 * CANLK-144: Templates de Notification & Plan de Formation
 * 
 * En tant qu'Administrateur ou Champion Projet,
 * je veux disposer de templates de communication normalisés et d'un plan de formation structuré,
 * afin de maximiser l'adoption du nouveau système et de minimiser les erreurs de saisie lors du Go-Live.
 * 
 * @version Sprint 7 | 2026-03-15
 * @agent front_nexus
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  FileText, 
  Mail, 
  Download, 
  Edit, 
  Save, 
  Copy, 
  CheckCircle,
  BookOpen,
  Users,
  Video,
  FileQuestion,
  GraduationCap
} from 'lucide-react'

interface NotificationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'teams'
  event: string
  subject_fr: string
  subject_en: string
  body_fr: string
  body_en: string
  is_active: boolean
}

interface TrainingModule {
  id: string
  title: string
  title_en: string
  description: string
  duration_minutes: number
  target_role: string
  order: number
}

// Templates de notification par défaut
const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Soumission TDL',
    type: 'email',
    event: 'tdl_submitted',
    subject_fr: 'Nouveau TDL #{{tdl_number}} - {{client_name}}',
    subject_en: 'New TDL #{{tdl_number}} - {{client_name}}',
    body_fr: 'Un nouveau TDL a été soumis et est en attente de traitement.',
    body_en: 'A new TDL has been submitted and is awaiting processing.',
    is_active: true,
  },
  {
    id: 'tpl-002',
    name: 'TDL Qualifié',
    type: 'email',
    event: 'tdl_qualified',
    subject_fr: 'TDL #{{tdl_number}} qualifié - Prêt pour laboratoire',
    subject_en: 'TDL #{{tdl_number}} qualified - Ready for laboratory',
    body_fr: 'Le TDL a été qualifié et est prêt pour traitement par le laboratoire.',
    body_en: 'The TDL has been qualified and is ready for laboratory processing.',
    is_active: true,
  },
  {
    id: 'tpl-003',
    name: 'Prêt Expédition',
    type: 'email',
    event: 'lab_completed',
    subject_fr: 'TDL #{{tdl_number}} prêt pour expédition',
    subject_en: 'TDL #{{tdl_number}} ready for shipment',
    body_fr: 'Les échantillons sont prêts pour expédition.',
    body_en: 'Samples are ready for shipment.',
    is_active: true,
  },
  {
    id: 'tpl-004',
    name: 'Assignation Technician',
    type: 'email',
    event: 'tdl_assigned',
    subject_fr: 'TDL #{{tdl_number}} vous a été assigné',
    subject_en: 'TDL #{{tdl_number}} has been assigned to you',
    body_fr: 'Un nouveau TDL vous a été assigné. Veuillez le traiter dans les délais impartis.',
    body_en: 'A new TDL has been assigned to you. Please process it within the allocated timeframe.',
    is_active: true,
  },
]

// Modules de formation
const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'mod-001',
    title: 'Introduction au système CANLK',
    title_en: 'Introduction to CANLK System',
    description: 'Vue d\'ensemble du système, navigation et concepts de base',
    duration_minutes: 15,
    target_role: 'all',
    order: 1,
  },
  {
    id: 'mod-002',
    title: 'Création d\'un nouveau TDL',
    title_en: 'Creating a new TDL',
    description: 'Comment saisir un nouveau TDL (Formulaire complet)',
    duration_minutes: 20,
    target_role: 'sales',
    order: 2,
  },
  {
    id: 'mod-003',
    title: 'Traitement et qualification TDL',
    title_en: 'TDL Processing and Qualification',
    description: 'Comment traiter et qualifier un TDL en laboratoire',
    duration_minutes: 25,
    target_role: 'technician',
    order: 3,
  },
  {
    id: 'mod-004',
    title: 'Gestion du tableau de bord',
    title_en: 'Dashboard Management',
    description: 'Utilisation du dashboard superviseur et gestion des priorités',
    duration_minutes: 15,
    target_role: 'supervisor',
    order: 4,
  },
  {
    id: 'mod-005',
    title: 'Expédition et clôture',
    title_en: 'Shipment and Closure',
    description: 'Gestion des échantillons et clôture des dossiers',
    duration_minutes: 15,
    target_role: 'sac',
    order: 5,
  },
]

interface TrainingPlanProps {
  onDownload?: (format: 'pdf' | 'xlsx') => void
}

export function TrainingPlan({ onDownload }: TrainingPlanProps) {
  const [activeTab, setActiveTab] = useState('templates')

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Centre de Formation CANLK
        </CardTitle>
        <CardDescription>
          Templates de notification et plan de formation pour le Go-Live
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="training">Formation</TabsTrigger>
          </TabsList>
          
          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Templates de notification</h4>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
            
            <div className="space-y-2">
              {DEFAULT_NOTIFICATION_TEMPLATES.map((template) => (
                <div 
                  key={template.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{template.name}</span>
                      <Badge variant={template.is_active ? 'success' : 'secondary'}>
                        {template.type}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Événement: {template.event}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Training Tab */}
          <TabsContent value="training" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Plan de formation</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onDownload?.('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDownload?.('xlsx')}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {TRAINING_MODULES.map((module, index) => (
                <div 
                  key={module.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{module.title}</h5>
                        <Badge variant="outline">
                          {module.duration_minutes} min
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Rôle: {module.target_role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Session de formation recommandée</p>
                  <p className="text-sm text-blue-700">
                    5 modules • ~90 minutes au total
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default TrainingPlan
