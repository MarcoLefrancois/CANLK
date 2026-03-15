/**
 * CANLK-9: Analyse Commerciale (Bloc B)
 * 
 * En tant que Représentant aux ventes,
 * je veux saisir le potentiel financier et le prix visé de l'opportunité,
 * afin de qualifier la rentabilité du dossier.
 * 
 * @version Sprint 2 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'

interface CommercialData {
  // Potentiel financier
  annual_potential?: string
  estimated_volume?: number
  unit_price?: number
  currency?: string
  
  // Prix visé
  target_price?: number
  discount_percentage?: number
  negotiation_status?: string
  
  // Métadonnées
  is_qualified?: boolean
  qualification_notes?: string
}

interface CommercialFormProps {
  initialData?: CommercialData
  onChange?: (data: CommercialData) => void
  readOnly?: boolean
}

const POTENTIAL_OPTIONS = [
  { value: 'lt10k', label: 'Moins de 10K$', labelEn: 'Less than 10K$' },
  { value: '10k50k', label: '10K$ - 50K$', labelEn: '10K$ - 50K$' },
  { value: '50k100k', label: '50K$ - 100K$', labelEn: '50K$ - 100K$' },
  { value: 'gt100k', label: 'Plus de 100K$', labelEn: 'More than 100K$' },
]

const NEGOTIATION_STATUS = [
  { value: 'initial', label: 'Contact initial', labelEn: 'Initial contact' },
  { value: 'discussion', label: 'En discussion', labelEn: 'In discussion' },
  { value: 'proposal', label: 'Proposition envoyée', labelEn: 'Proposal sent' },
  { value: 'negotiation', label: 'Négociation', labelEn: 'Negotiation' },
  { value: 'closing', label: 'Clôture imminente', labelEn: 'Closing soon' },
]

export function CommercialForm({ initialData, onChange, readOnly = false }: CommercialFormProps) {
  const [formData, setFormData] = useState<CommercialData>(initialData || {})
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0)

  useEffect(() => {
    if (formData.estimated_volume && formData.unit_price) {
      const total = formData.estimated_volume * formData.unit_price
      setCalculatedTotal(total)
      onChange?.({ ...formData, unit_price: total })
    }
  }, [formData.estimated_volume, formData.unit_price])

  const handleChange = (field: keyof CommercialData, value: any) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    onChange?.(updated)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: formData.currency || 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (readOnly) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analyse Commerciale (Bloc B)
          </CardTitle>
          <CardDescription>Potentiel financier et prix visé</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Potentiel annuel</Label>
              <p className="font-medium">
                {POTENTIAL_OPTIONS.find(o => o.value === formData.annual_potential)?.label || '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Volume estimé</Label>
              <p className="font-medium">{formData.estimated_volume || '-'} unités</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prix unitaire</Label>
              <p className="font-medium">
                {formData.unit_price ? formatCurrency(formData.unit_price) : '-'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Prix cible</Label>
              <p className="font-medium">
                {formData.target_price ? formatCurrency(formData.target_price) : '-'}
              </p>
            </div>
          </div>
          {calculatedTotal > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <Label className="text-muted-foreground">Valeur totale estimée</Label>
              <p className="text-2xl font-bold">{formatCurrency(calculatedTotal)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Analyse Commerciale (Bloc B)
        </CardTitle>
        <CardDescription>
          Qualifiez la rentabilité du dossier en définissant le potentiel financier et le prix visé
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Section Potentiel Annuel */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Potentiel Financier
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Potentiel annuel */}
            <div className="space-y-2">
              <Label htmlFor="annual_potential">Potentiel annuel</Label>
              <select
                id="annual_potential"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.annual_potential || ''}
                onChange={(e) => handleChange('annual_potential', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {POTENTIAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume estimé */}
            <div className="space-y-2">
              <Label htmlFor="estimated_volume">Volume estimé (unités)</Label>
              <Input
                id="estimated_volume"
                type="number"
                min={1}
                placeholder="Ex: 1000"
                value={formData.estimated_volume || ''}
                onChange={(e) => handleChange('estimated_volume', parseInt(e.target.value) || undefined)}
              />
            </div>

            {/* Prix unitaire */}
            <div className="space-y-2">
              <Label htmlFor="unit_price">Prix unitaire ($CAD)</Label>
              <Input
                id="unit_price"
                type="number"
                min={0}
                step={0.01}
                placeholder="Ex: 50.00"
                value={formData.unit_price || ''}
                onChange={(e) => handleChange('unit_price', parseFloat(e.target.value) || undefined)}
              />
            </div>

            {/* Devise */}
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <select
                id="currency"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.currency || 'CAD'}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="CAD">CAD - Dollar canadien</option>
                <option value="USD">USD - Dollar américain</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calcul automatique */}
        {calculatedTotal > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Valeur totale estimée</span>
              </div>
              <span className="text-2xl font-bold text-blue-700">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Section Prix Visé */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Prix Visé
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prix cible */}
            <div className="space-y-2">
              <Label htmlFor="target_price">Prix cible ($CAD)</Label>
              <Input
                id="target_price"
                type="number"
                min={0}
                step={0.01}
                placeholder="Prix visé par le client"
                value={formData.target_price || ''}
                onChange={(e) => handleChange('target_price', parseFloat(e.target.value) || undefined)}
              />
            </div>

            {/* Pourcentage de remise */}
            <div className="space-y-2">
              <Label htmlFor="discount_percentage">Remise souhaitée (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                min={0}
                max={100}
                placeholder="Ex: 15"
                value={formData.discount_percentage || ''}
                onChange={(e) => handleChange('discount_percentage', parseInt(e.target.value) || undefined)}
              />
            </div>

            {/* Statut de négociation */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="negotiation_status">Statut de négociation</Label>
              <select
                id="negotiation_status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.negotiation_status || ''}
                onChange={(e) => handleChange('negotiation_status', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {NEGOTIATION_STATUS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes de qualification */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="qualification_notes">Notes de qualification</Label>
          <textarea
            id="qualification_notes"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Commentaires sur la qualification commerciale..."
            value={formData.qualification_notes || ''}
            onChange={(e) => handleChange('qualification_notes', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default CommercialForm
