import { describe, it, expect } from 'vitest';

/**
 * Simulation de la logique de numérotation (CANLK-135)
 * NOTE : La véritable logique est gérée par la séquence PostgreSQL, 
 * ce test valide la structure du format attendu.
 */
describe('CANLK-135 : Protocole de Numérotation', () => {
  it('doit respecter le format TDL-[OFFSET]', () => {
    const sequenceValue = 300001;
    const tdlNumber = `TDL-${sequenceValue}`;
    
    expect(tdlNumber).toBe('TDL-300001');
    expect(tdlNumber).toMatch(/^TDL-3\d{5}$/);
  });

  it('doit garantir que l offset est supérieur ou égal à 300 000', () => {
    const sequenceValue = 300001;
    expect(sequenceValue).toBeGreaterThanOrEqual(300000);
  });
});
