import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Test du schéma de validation Zod
describe('TDL Form Schema', () => {
  const tdlFormSchema = z.object({
    client_id: z.string().optional(),
    sample_description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
    sample_quantity: z.number().min(1, 'La quantité doit être au moins 1'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
  })

  it('devrait valider un formulaire valide', () => {
    const validData = {
      sample_description: 'Échantillon d\'eau pour analyse chimique',
      sample_quantity: 5,
      priority: 'medium' as const,
    }
    
    const result = tdlFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('devrait rejeter une description trop courte', () => {
    const invalidData = {
      sample_description: 'test',
      sample_quantity: 1,
      priority: 'medium' as const,
    }
    
    const result = tdlFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('devrait rejeter une quantité inférieure à 1', () => {
    const invalidData = {
      sample_description: 'Échantillon valide',
      sample_quantity: 0,
      priority: 'medium' as const,
    }
    
    const result = tdlFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('devrait rejeter une priorité invalide', () => {
    const invalidData = {
      sample_description: 'Échantillon valide',
      sample_quantity: 1,
      priority: 'invalid',
    }
    
    const result = tdlFormSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('devrait accepter un client_id optionnel', () => {
    const dataWithClient = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      sample_description: 'Échantillon d\'eau',
      sample_quantity: 2,
      priority: 'high' as const,
    }
    
    const result = tdlFormSchema.safeParse(dataWithClient)
    expect(result.success).toBe(true)
  })
})

// Test des utilitaires
describe('Utils', () => {
  // Fonction utilitaire de test (simulée)
  const cn = (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ')
  }

  it('devrait concaténer les classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('devrait filtrer les valeurs nulles', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar')
  })

  it('devrait filtrer les false', () => {
    expect(cn('foo', false && 'bar')).toBe('foo')
  })
})
