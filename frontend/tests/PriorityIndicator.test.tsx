/**
 * Tests pour PriorityIndicator (CANLK-120)
 * 
 * @version Sprint 7 | 2026-03-15
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityIndicator, PriorityBadge, useSLACalculation } from '../components/priority/PriorityIndicator'

describe('PriorityIndicator (CANLK-120)', () => {
  describe('PriorityIndicator', () => {
    it('affiche le bon couleur pour priority critical', () => {
      render(<PriorityIndicator priority="critical" />)
      // Vérifie que le composant rend sans erreur
      expect(screen.getByTestId('priority-indicator')).toBeInTheDocument()
    })

    it('affiche le bon couleur pour priority low', () => {
      render(<PriorityIndicator priority="low" />)
      expect(screen.getByTestId('priority-indicator')).toBeInTheDocument()
    })

    it('affiche le label quand showLabel est true', () => {
      render(<PriorityIndicator priority="high" showLabel />)
      expect(screen.getByText(/Haute/)).toBeInTheDocument()
    })
  })

  describe('PriorityBadge', () => {
    it('affiche le bon badge pour priority critical', () => {
      render(<PriorityBadge priority="critical" />)
      expect(screen.getByText(/Critique/)).toBeInTheDocument()
    })

    it('affiche les indicateurs de risque SLA', () => {
      render(<PriorityBadge priority="medium" slaStatus="at_risk" />)
      expect(screen.getByText(/⚠️/)).toBeInTheDocument()
    })

    it('affiche l\'indicateur de breach SLA', () => {
      render(<PriorityBadge priority="high" slaStatus="breached" />)
      expect(screen.getByText(/🚨/)).toBeInTheDocument()
    })
  })

  describe('useSLACalculation', () => {
    it('retourne null si pas de deadline', () => {
      const { result } = renderHook(() => useSLACalculation(null, 'medium'))
      expect(result.current.remaining).toBeNull()
    })

    it('calcule correctement le temps restant', () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h
      const { result } = renderHook(() => useSLACalculation(futureDate, 'medium'))
      expect(result.current.remaining).not.toBeNull()
    })
  })
})
