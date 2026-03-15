import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientSearch } from './ClientSearch'
import type { Client } from '@/lib/supabase'

// Schéma de validation Zod pour le Bloc A
const tdlFormSchema = z.object({
  client_id: z.string().optional(),
  sample_description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  sample_quantity: z.number().min(1, 'La quantité doit être au moins 1'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

type TDLFormData = z.infer<typeof tdlFormSchema>

interface TDLFormProps {
  onSubmit?: (data: TDLFormData) => void
}

export function TDLForm({ onSubmit }: TDLFormProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
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
    },
  })

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setValue('client_id', client.id)
  }

  const onFormSubmit = async (data: TDLFormData) => {
    try {
      await onSubmit?.(data)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Formulaire de Saisie TDL - Bloc A</CardTitle>
        <CardDescription>
          Identifiez le client et décrivez l'échantillon à analyser
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <CardContent className="space-y-6">
          {/* Client Selection (CANLK-7) */}
          <div className="space-y-2">
            <Label>Client</Label>
            <ClientSearch onSelect={handleClientSelect} />
            {selectedClient && (
              <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                Client sélectionné: <strong>{selectedClient.name}</strong> ({selectedClient.code})
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
              {...register('sample_description')}
            />
            {errors.sample_description && (
              <p className="text-sm text-destructive">{errors.sample_description.message}</p>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="sample_quantity">Quantité d'échantillons</Label>
            <Input
              id="sample_quantity"
              type="number"
              min={1}
              {...register('sample_quantity', { valueAsNumber: true })}
            />
            {errors.sample_quantity && (
              <p className="text-sm text-destructive">{errors.sample_quantity.message}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <select
              id="priority"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register('priority')}
            >
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" type="button">
            Sauvegarder comme brouillon
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Soumettre'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
