import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDebounce } from './useDebounce';

export interface Account {
  id: string;
  name: string;
  account_number: string;
  city: string;
  address?: string;
  phone?: string;
  contact_name?: string;
  email?: string;
  fax?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  account_manager?: string;
  account_type?: string;
  annual_sales_potential?: string;
  sku_potential?: string;
  is_active?: boolean;
  type?: string;
}

/**
 * Hook de recherche client SMART-AC (CANLK-7)
 * Agent : front_nexus
 */
export function useClientSearch(query: string) {
  const [results, setResults] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    async function search() {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: pgError } = await supabase
          .from('accounts')
          .select('id, name, account_number, city, address, phone, contact_name, email, fax, state, postal_code, country, account_manager, account_type, annual_sales_potential, sku_potential, is_active, type')
          .or(`name.ilike.%${debouncedQuery}%,account_number.ilike.%${debouncedQuery}%,city.ilike.%${debouncedQuery}%`)
          .limit(10);

        if (pgError) throw pgError;
        setResults(data || []);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  return { results, isLoading, error };
}
