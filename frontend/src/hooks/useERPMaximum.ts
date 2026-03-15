import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ERPFormula {
  id: string;
  erp_code: string;
  formula_name: string;
  category: string;
  unit_price: number;
  is_active: boolean;
  last_sync: Date;
}

export interface ERPLinkValidation {
  formula_id: string;
  erp_code: string;
  status: 'valid' | 'invalid' | 'pending';
  error_message?: string;
}

export function useERPMaximumIntegration() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Validate formula ID against ERP Maximum
  const validateFormulaLink = async (formulaId: string, erpCode: string): Promise<ERPLinkValidation> => {
    try {
      // Call Edge Function to validate against ERP
      const { data, error } = await supabase.functions.invoke('validate-erp-link', {
        body: { formula_id: formulaId, erp_code: erpCode }
      });

      if (error) throw error;

      return {
        formula_id: formulaId,
        erp_code: erpCode,
        status: data.is_valid ? 'valid' : 'invalid',
        error_message: data.error,
      };
    } catch (error) {
      return {
        formula_id: formulaId,
        erp_code: erpCode,
        status: 'pending',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Sync formulas from ERP Maximum
  const syncFromERP = async (): Promise<{ success: boolean; count: number }> => {
    setIsSyncing(true);
    
    try {
      // Call Edge Function to sync from ERP
      const { data, error } = await supabase.functions.invoke('sync-erp-formulas');
      
      if (error) throw error;

      setLastSync(new Date());
      return { success: true, count: data?.count || 0 };
    } catch (error) {
      console.error('ERP sync failed:', error);
      return { success: false, count: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  // Get formula by ERP code
  const getFormulaByERP = async (erpCode: string): Promise<ERPFormula | null> => {
    const { data, error } = await supabase
      .from('erp_formulas')
      .select('*')
      .eq('erp_code', erpCode)
      .single();

    if (error || !data) return null;
    return data;
  };

  // Link TDL to ERP formula
  const linkToERP = async (tdlId: string, erpCode: string): Promise<boolean> => {
    const validation = await validateFormulaLink(tdlId, erpCode);
    
    if (validation.status !== 'valid') {
      return false;
    }

    const { error } = await supabase
      .from('tdl_requests')
      .update({ erp_code: erpCode })
      .eq('id', tdlId);

    return !error;
  };

  // Auto-suggest ERP code based on formula
  const suggestERPCode = async (formulaId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('tdl_requests')
      .select('formula_id, formula_name')
      .eq('id', formulaId)
      .single();

    if (error || !data) return null;

    // Search for matching ERP formula
    const { data: erpFormulas } = await supabase
      .from('erp_formulas')
      .select('erp_code')
      .ilike('formula_name', `%${data.formula_name}%`)
      .limit(1);

    return erpFormulas?.[0]?.erp_code || null;
  };

  return {
    isSyncing,
    lastSync,
    validateFormulaLink,
    syncFromERP,
    getFormulaByERP,
    linkToERP,
    suggestERPCode,
  };
}
