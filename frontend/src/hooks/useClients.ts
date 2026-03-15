import { useQuery } from '@tanstack/react-query'
import { supabase, type Client } from '@/lib/supabase'

interface UseClientsOptions {
  search?: string
  region?: 'QC' | 'ON' | 'all'
}

export function useClients(options: UseClientsOptions = {}) {
  const { search, region = 'all' } = options

  return useQuery({
    queryKey: ['clients', { search, region }],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
      }

      if (region !== 'all') {
        query = query.eq('region', region)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Client[]
    },
    enabled: true,
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}
