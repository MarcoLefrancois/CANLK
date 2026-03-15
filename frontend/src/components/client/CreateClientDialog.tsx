/**
 * CANLK-8: Create Client Dialog - SharePoint Form Compatible
 * 
 * Dialog pour la création d'un nouveau prospect conforme au formulaire SharePoint
 * Spécifications: CANLK-8
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  AlertTriangle, 
  Plus, 
  Loader2, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Mail, 
  Fax,
  FileText,
  DollarSign,
  Package,
  Globe,
  Check
} from 'lucide-react'

interface CreateClientDialogProps {
  onSuccess?: (clientId: string, clientName: string) => void
}

// Options pour les listes déroulantes (conformes SharePoint)
const ANNUAL_SALES_OPTIONS = [
  { value: '0-200k', label: '0 - 200 000$' },
  { value: '200-300k', label: '200 000$ - 300 000$' },
  { value: '300-500k', label: '300 000$ - 500 000$' },
  { value: '500k-1M', label: '500 000$ - 1 000 000$' },
  { value: '1M+', label: '1 000 000$ et plus' },
]

const SKU_POTENTIAL_OPTIONS = [
  { value: '1-5', label: '1 - 5 SKU' },
  { value: '5-15', label: '5 - 15 SKU' },
  { value: '15-30', label: '15 - 30 SKU' },
  { value: '30-50', label: '30 - 50 SKU' },
  { value: '50+', label: '50+ SKU' },
]

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Prospect', label: 'Prospect' },
  { value: 'Customer', label: 'Client' },
]

export function CreateClientDialog({ onSuccess }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [confirmedDuplicates, setConfirmedDuplicates] = useState(false)
  
  // Form state - conforme CANLK-8
  const [formData, setFormData] = useState({
    // En-tête
    account_number: 'NEWACCOUNT',
    
    // Informations principales
    name: '',                           // Titre - Required
    account_manager: '',               // Responsable compte (AD)
    account_type: 'Prospect',           // Type de compte (default: Prospect)
    annual_sales_potential: '',         // Potentiel annuel
    sku_potential: '',                  // Potentiel SKU
    
    // Adresse
    address: '',                        // Adresse - Required
    city: '',                          // Ville
    state: '',                         // Province
    postal_code: '',                   // Code postal
    country: 'Canada',                 // Pays (défaut)
    
    // Contact
    primary_contact: '',               // Contact principal - Required
    telephone1: '',                    // Téléphone bureau - Required
    fax: '',                           // Fax
    email: '',                         // E-Mail
    
    // Statut
    is_active: true,                   // Item actif (checkbox)
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: client, error } = await supabase
        .from('accounts')
        .insert({
          name: data.name,
          account_number: data.account_number,
          // Stocker les champs additionnels
          address: data.address,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country,
          contact_name: data.primary_contact,
          phone: data.telephone1,
          fax: data.fax,
          email: data.email,
          // Champs personnalisés (seront mappés vers Dataverse)
          account_manager: data.account_manager,
          account_type: data.account_type,
          annual_sales_potential: data.annual_sales_potential,
          sku_potential: data.sku_potential,
          is_active: data.is_active,
          type: data.account_type || 'Prospect', // Règle-02: Prospect par défaut
        })
        .select()
        .single()

      if (error) throw error
      return client
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['client'] })
      
      // Reset form
      setFormData({
        account_number: 'NEWACCOUNT',
        name: '',
        account_manager: '',
        account_type: 'Prospect',
        annual_sales_potential: '',
        sku_potential: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Canada',
        primary_contact: '',
        telephone1: '',
        fax: '',
        email: '',
        is_active: true,
      })
      setConfirmedDuplicates(false)
      setOpen(false)
      onSuccess?.(client.id, client.name)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Règle-01: Confirmation avertissement doublons obligatoire
    if (!confirmedDuplicates) {
      alert('Veuillez confirmer que vous avez vérifié les doublons avant de créer le client.')
      return
    }
    
    setIsLoading(true)
    
    try {
      await createMutation.mutateAsync(formData)
    } catch (error) {
      console.error('Error creating client:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau prospect
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Nouveau Client - Prospect
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau compte client de type Prospect.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-6 pt-4">
              
              {/* En-tête d'avertissement - RÈGLE-01 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-800">
                      Vérification des doublons obligatoire
                    </p>
                    <p className="text-xs text-red-700">
                      Avant de créer un nouveau compte, recherchez si le client existe déjà 
                      dans le système pour éviter les doublons.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox 
                        id="confirmDuplicates"
                        checked={confirmedDuplicates}
                        onCheckedChange={(checked) => setConfirmedDuplicates(checked as boolean)}
                      />
                      <label 
                        htmlFor="confirmDuplicates" 
                        className="text-sm text-red-800 cursor-pointer"
                      >
                        Je confirme avoir vérifié les doublons
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Numéro client - Lecture seule */}
              <div className="space-y-2">
                <Label htmlFor="account_number">Numéro client</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  disabled
                  className="bg-muted font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Sera généré automatiquement lors de la synchronisation Dataverse
                </p>
              </div>

              {/* Titre - REQUIRED */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Nom de l'entreprise"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Responsable compte & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_manager">
                    Responsable compte
                  </Label>
                  <Input
                    id="account_manager"
                    placeholder="Rechercher un utilisateur AD..."
                    value={formData.account_manager}
                    onChange={(e) => handleChange('account_manager', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Type de compte</Label>
                  <select
                    id="account_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.account_type}
                    onChange={(e) => handleChange('account_type', e.target.value)}
                  >
                    {ACCOUNT_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Potentiels */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annual_sales_potential" className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Potentiel annuel de ventes
                  </Label>
                  <select
                    id="annual_sales_potential"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.annual_sales_potential}
                    onChange={(e) => handleChange('annual_sales_potential', e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {ANNUAL_SALES_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku_potential" className="flex items-center gap-2">
                    <Package className="h-3 w-3" />
                    Potentiel nombre de SKU
                  </Label>
                  <select
                    id="sku_potential"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.sku_potential}
                    onChange={(e) => handleChange('sku_potential', e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {SKU_POTENTIAL_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Adresse - REQUIRED */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Adresse <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="Adresse complète"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  required
                  rows={2}
                />
              </div>

              {/* Ville / Province / Code postal / Pays */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    Ville
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ville"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">
                    Province / État
                  </Label>
                  <Input
                    id="state"
                    placeholder="QC, ON, etc."
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">
                    Code postal
                  </Label>
                  <Input
                    id="postal_code"
                    placeholder="G1A 1A1"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Pays
                  </Label>
                  <Input
                    id="country"
                    placeholder="Canada"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>

              {/* Contact principal - REQUIRED */}
              <div className="space-y-2">
                <Label htmlFor="primary_contact">
                  Contact principal <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="primary_contact"
                  placeholder="Nom du contact principal"
                  value={formData.primary_contact}
                  onChange={(e) => handleChange('primary_contact', e.target.value)}
                  required
                />
              </div>

              {/* Téléphone / Fax / Email */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone1">
                    Téléphone bureau <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="telephone1"
                    placeholder="(555) 123-4567"
                    value={formData.telephone1}
                    onChange={(e) => handleChange('telephone1', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fax" className="flex items-center gap-2">
                    <Fax className="h-3 w-3" />
                    Fax
                  </Label>
                  <Input
                    id="fax"
                    placeholder="(555) 123-4568"
                    value={formData.fax}
                    onChange={(e) => handleChange('fax', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    E-Mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@entreprise.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Item actif */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked as boolean)}
                />
                <label 
                  htmlFor="is_active" 
                  className="text-sm cursor-pointer"
                >
                  Compte actif
                </label>
              </div>

            </CardContent>
          </Card>

          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name.trim() || !formData.address.trim() || !formData.primary_contact.trim() || !formData.telephone1.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateClientDialog
