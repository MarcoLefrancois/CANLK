/**
 * Tests pour CommercialForm (CANLK-9)
 * 
 * @version Sprint 2 | 2026-03-15
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommercialForm } from '../components/commercial/CommercialForm'

describe('CommercialForm (CANLK-9)', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('affiche le formulaire avec tous les champs', () => {
    render(<CommercialForm onChange={mockOnChange} />)
    
    expect(screen.getByLabelText(/Potentiel annuel/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Volume estimé/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prix unitaire/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Prix cible/i)).toBeInTheDocument()
  })

  it('calcule automatiquement le total', () => {
    render(<CommercialForm onChange={mockOnChange} />)
    
    const volumeInput = screen.getByLabelText(/Volume estimé/i)
    const priceInput = screen.getByLabelText(/Prix unitaire/i)
    
    fireEvent.change(volumeInput, { target: { value: '100' } })
    fireEvent.change(priceInput, { target: { value: '50' } })
    
    expect(screen.getByText(/5000/)).toBeInTheDocument()
  })

  it('appelle onChange lors de la modification', () => {
    render(<CommercialForm onChange={mockOnChange} />)
    
    const potentialSelect = screen.getByLabelText(/Potentiel annuel/i)
    fireEvent.change(potentialSelect, { target: { value: 'gt100k' } })
    
    expect(mockOnChange).toHaveBeenCalled()
  })

  it('affiche les options de potentiel annuel', () => {
    render(<CommercialForm onChange={mockOnChange} />)
    
    expect(screen.getByText(/Moins de 10K\$/i)).toBeInTheDocument()
    expect(screen.getByText(/10K\$ - 50K\$/i)).toBeInTheDocument()
    expect(screen.getByText(/Plus de 100K\$/i)).toBeInTheDocument()
  })

  it('affiche le mode lecture seule correctement', () => {
    render(
      <CommercialForm 
        readOnly 
        initialData={{
          annual_potential: 'gt100k',
          estimated_volume: 100,
          unit_price: 50,
        }} 
      />
    )
    
    expect(screen.getByText(/Plus de 100K\$/i)).toBeInTheDocument()
    expect(screen.getByText(/100/)).toBeInTheDocument()
  })
})
