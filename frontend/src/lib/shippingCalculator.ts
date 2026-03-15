/**
 * Shipping Calculator - Logique métier pour les échantillons
 * Règles: SAC-01, SAC-02
 */

export interface ShippingCalculation {
  suggestedFormat: string;
  estimatedDate: Date;
  carrier: string;
}

/**
 * Calculate shipping format based on quantity and unit
 * Rule SAC-01: If chips > 10, suggest "Box"
 */
export function calculateShippingFormat(quantity: number, unit: string): string {
  if (unit === 'chips' && quantity > 10) {
    return 'box';
  }
  if (unit === 'kg' && quantity > 5) {
    return 'container';
  }
  return 'bag';
}

/**
 * Calculate shipping date from lab end date
 * Rule SAC-02: Shipping date = Lab End Date + 1 business day
 */
export function calculateShippingDate(labEndDate: Date): Date {
  const date = new Date(labEndDate);
  let businessDaysAdded = 0;
  
  while (businessDaysAdded < 1) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    // Skip Saturday (6) and Sunday (0)
    if (day !== 0 && day !== 6) {
      businessDaysAdded++;
    }
  }
  
  return date;
}

/**
 * Get carrier recommendation based on format and urgency
 */
export function getCarrierRecommendation(format: string, urgent: boolean = false): string {
  if (urgent) {
    return 'DHL Express';
  }
  
  switch (format) {
    case 'box':
      return 'FedEx';
    case 'container':
      return 'Transporteur Spécialisé';
    case 'tube':
      return 'Chronopost';
    default:
      return 'Colissimo';
  }
}

/**
 * Full shipping calculation
 */
export function calculateShipping(
  quantity: number,
  unit: string,
  labEndDate: Date,
  urgent: boolean = false
): ShippingCalculation {
  const suggestedFormat = calculateShippingFormat(quantity, unit);
  const estimatedDate = calculateShippingDate(labEndDate);
  const carrier = getCarrierRecommendation(suggestedFormat, urgent);
  
  return {
    suggestedFormat,
    estimatedDate,
    carrier
  };
}
