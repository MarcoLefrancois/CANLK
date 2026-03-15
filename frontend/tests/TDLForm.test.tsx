import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TDLForm } from '@/components/TDLForm'

// Mock des hooks
vi.mock('@/hooks/useClients', () => ({
  useClients: () => ({
    data: [],
    isLoading: false,
  }),
}))

describe('TDLForm', () => {
  beforeEach(() => {
    // Reset mocks si nécessaire
  })

  it('devrait afficher le titre du formulaire', () => {
    render(<TDLForm />)
    expect(screen.getByText('Formulaire de Saisie TDL - Bloc A')).toBeDefined()
  })

  it('devrait avoir un champ pour la description', () => {
    render(<TDLForm />)
    expect(screen.getByLabelText('Description de l\'échantillon')).toBeDefined()
  })

  it('devrait avoir un champ pour la quantité', () => {
    render(<TDLForm />)
    expect(screen.getByLabelText('Quantité d\'échantillons')).toBeDefined()
  })

  it('devrait avoir un champ pour la priorité', () => {
    render(<TDLForm />)
    expect(screen.getByLabelText('Priorité')).toBeDefined()
  })

  it('devrait avoir un bouton de soumission', () => {
    render(<TDLForm />)
    expect(screen.getByRole('button', { name: 'Soumettre' })).toBeDefined()
  })

  it('devrait avoir un bouton sauvegarder brouillon', () => {
    render(<TDLForm />)
    expect(screen.getByRole('button', { name: 'Sauvegarder comme brouillon' })).toBeDefined()
  })
})
