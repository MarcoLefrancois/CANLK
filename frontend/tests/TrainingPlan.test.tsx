/**
 * Tests pour TrainingPlan (CANLK-144)
 * 
 * @version Sprint 7 | 2026-03-15
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrainingPlan } from '../components/notifications/TrainingPlan'

describe('TrainingPlan (CANLK-144)', () => {
  const mockOnDownload = vi.fn()

  beforeEach(() => {
    mockOnDownload.mockClear()
  })

  it('affiche les onglets Templates et Formation', () => {
    render(<TrainingPlan onDownload={mockOnDownload} />)
    
    expect(screen.getByText(/Templates/)).toBeInTheDocument()
    expect(screen.getByText(/Formation/)).toBeInTheDocument()
  })

  it('affiche les templates de notification par défaut', () => {
    render(<TrainingPlan onDownload={mockOnDownload} />)
    
    expect(screen.getByText(/Soumission TDL/)).toBeInTheDocument()
    expect(screen.getByText(/TDL Qualifié/)).toBeInTheDocument()
    expect(screen.getByText(/Prêt Expédition/)).toBeInTheDocument()
  })

  it('affiche les modules de formation', () => {
    render(<TrainingPlan onDownload={mockOnDownload} />)
    
    // Cliquer sur l'onglet Formation
    fireEvent.click(screen.getByText(/Formation/))
    
    expect(screen.getByText(/Introduction au système CANLK/)).toBeInTheDocument()
    expect(screen.getByText(/Création d'un nouveau TDL/)).toBeInTheDocument()
  })

  it('affiche la durée totale de formation', () => {
    render(<TrainingPlan onDownload={mockOnDownload} />)
    
    fireEvent.click(screen.getByText(/Formation/))
    
    expect(screen.getByText(/90 minutes/)).toBeInTheDocument()
  })

  it('appelle onDownload avec format PDF', () => {
    render(<TrainingPlan onDownload={mockOnDownload} />)
    
    fireEvent.click(screen.getByText(/Formation/))
    fireEvent.click(screen.getByText(/PDF/))
    
    expect(mockOnDownload).toHaveBeenCalledWith('pdf')
  })

  it('affiche les boutons de téléchargement Excel', () => {
    render(<TrainingPlan onDownload={mockOnDownload} />)
    
    fireEvent.click(screen.getByText(/Formation/))
    
    expect(screen.getByText(/Excel/)).toBeInTheDocument()
  })
})
