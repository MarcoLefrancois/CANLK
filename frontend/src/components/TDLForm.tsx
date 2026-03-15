/**
 * CANLK Formulaire TDL Complet - Tous les Blocs
 * 
 * Intégration des blocs:
 * - Bloc A: Identification (CANLK-6, CANLK-7)
 * - Bloc B: Analyse Commerciale (CANLK-9)
 * - Bloc C: Spécifications Techniques (CANLK-10)
 * - Bloc D: Logistique (CANLK-11)
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ClientSearch } from './ClientSearch'
import { ClientProfile } from './client/ClientProfile'
import { CommercialForm } from './commercial/CommercialForm'
import { TechnicalSpecs } from './technical/TechnicalSpecs'
import type { Client } from '@/lib/supabase'
import { 
  User, 
  Building2, 
  TrendingUp, 
  Settings, 
  Truck,
  Save,
  Send,
  CheckCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

// Schéma de validation complet
const tdlFormSchema = z.object({
  // Bloc A - Identification
  client_id: z.string().optional(),
  sample_description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  sample_quantity: z.number().min(1, 'La quantité doit être au moins 1'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Bloc B - Commercial
  annual_potential: z.string().optional(),
  estimated_volume: z.number().optional(),
  unit_price: z.number().optional(),
  target_price: z.number().optional(),
  negotiation_status: z.string().optional(),
  
  // Bloc C - Technique
  application: z.string().optional(),
  brilliance: z.string().optional(),
  color_code: z.string().optional(),
  
  // Bloc D - Logistique
  container_format: z.string().optional(),
  is_billable: z.boolean().optional(),
  notes: z.string().optional(),
})

type TDLFormData = z.infer<typeof tdlFormSchema>

type FormStep = 'identification' | 'commercial' | 'technical' | 'logistics'

interface TDLFormProps {
  initialData?: Partial<TDLFormData>
  onSubmit?: (data: TDLFormData) => void
  onSaveDraft?: (data: TDLFormData) => void
}

export function TDLForm({ initialData, onSubmit, onSaveDraft }: TDLFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('identification')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<TDLFormData>(initialData || {} as TDLFormData)
  
  const steps: { id: FormStep; label: string; icon: any }[] = [
    { id: 'identification', label: 'Identification', icon: User },
    { id: 'commercial', label: 'Commercial', icon: TrendingUp },
    { id: 'technical', label: 'Technique', icon: Settings },
    { id: 'logistics', label: 'Logistique', icon: Truck },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TDLFormData>({
    resolver: zodResolver(tdlFormSchema),
    defaultValues: {
      priority: 'medium',
      sample_quantity: 1,
      is_billable: true,
      ...initialData,
    },
  })

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setValue('client_id', client.id)
    setFormData(prev => ({ ...prev, client_id: client.id }))
  }

  const handleCommercialChange = (commercialData: any) => {
    setFormData(prev => ({ ...prev, ...commercialData }))
  }

  const handleTechnicalChange = (technicalData: any) => {
    setFormData(prev => ({ ...prev, ...technicalData }))
  }

  const handleLogisticsChange = (logisticsData: any) => {
    setFormData(prev => ({ ...prev, ...logisticsData }))
  }

  const handleFieldChange = (field: keyof TDLFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValue(field, value)
  }

  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id)
    }
  }

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }

  const onFormSubmit = async (data: TDLFormData) => {
    try {
      const completeData = { ...formData, ...data }
      await onSubmit?.(completeData)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    }
  }

  const handleSaveDraft = async () => {
    try {
      await onSaveDraft?.(formData)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'identification':
        return (
          <div className="space-y-6">
            {/* Client Selection (CANLK-7) */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Client</Label>
              <ClientSearch onSelect={handleClientSelect} />
              {selectedClient && (
                <div className="mt-4">
                  <ClientProfile 
                    clientId={selectedClient.id} 
                    onSopSelect={(sop) => console.log('SOP selected:', sop)}
                  />
                </div>
              )}
            </div>

            {/* Sample Description */}
            <div className="space-y-2">
              <Label htmlFor="sample_description">Description de l'échantillon</Label>
              <textarea
                id="sample_description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Décrivez l'échantillon à analyser..."
                value={formData.sample_description || ''}
                onChange={(e) => handleFieldChange('sample_description', e.target.value)}
              />
              {errors.sample_description && (
                <p className="text-sm text-destructive">{errors.sample_description.message}</p>
              )}
            </div>

            {/* Quantity & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sample_quantity">Quantité d'échantillons</Label>
                <Input
                  id="sample_quantity"
                  type="number"
                  min={1}
                  value={formData.sample_quantity || 1}
                  onChange={(e) => handleFieldChange('sample_quantity', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.priority || 'medium'}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          </div>
        )

      case 'commercial':
        return (
          <CommercialForm 
            initialData={formData}
            onChange={handleCommercialChange}
          />
        )

      case 'technical':
        return (
          <TechnicalSpecs 
            initialData={formData}
            onChange={handleTechnicalChange}
          />
        )

      case 'logistics':
        return (
          <div className="space-y-6">
            {/* Container Format */}
            <div className="space-y-2">
              <Label htmlFor="container_format">Format du contenant</Label>
              <select
                id="container_format"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.container_format || ''}
                onChange={(e) => handleFieldChange('container_format', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                <option value="pot">Pot</option>
                <option value="pail">Pail (seau)</option>
                <option value="drum">Tambour</option>
                <option value="bulk">Vrac</option>
              </select>
            </div>

            {/* Billable */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_billable"
                checked={formData.is_billable ?? true}
                onChange={(e) => handleFieldChange('is_billable', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_billable" className="font-normal">
                Facturable au client
              </Label>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes additionnelles</Label>
              <textarea
                id="notes"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Informations logistiques supplémentaires..."
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 'identification' && <User className="h-5 w-5" />}
              {currentStep === 'commercial' && <TrendingUp className="h-5 w-5" />}
              {currentStep === 'technical' && <Settings className="h-5 w-5" />}
              {currentStep === 'logistics' && <Truck className="h-5 w-5" />}
              {currentStep === 'identification' && 'Bloc A - Identification'}
              {currentStep === 'commercial' && 'Bloc B - Analyse Commerciale'}
              {currentStep === 'technical' && 'Bloc C - Spécifications Techniques'}
              {currentStep === 'logistics' && 'Bloc D - Logistique'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'identification' && 'Identifiez le client et décrivez l\'échantillon'}
              {currentStep === 'commercial' && 'Qualifiez la rentabilité du dossier'}
              {currentStep === 'technical' && 'Définissez les spécifications techniques'}
              {currentStep === 'logistics' && 'Configurez les options logistiques'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {renderStep()}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>
              {currentStepIndex > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPrevStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder brouillon
              </Button>
              {currentStepIndex < steps.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Envoi...' : 'Soumettre'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default TDLForm
