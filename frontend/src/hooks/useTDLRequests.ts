import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type TDLRequest } from '@/lib/supabase'

interface CreateTDLInput {
  client_id?: string
  vendor_id?: string
  sample_description?: string
  sample_quantity?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export function useTDLRequests() {
  return useQuery({
    queryKey: ['tdl-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tdl_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TDLRequest[]
    },
  })
}

export function useTDLRequest(id: string) {
  return useQuery({
    queryKey: ['tdl-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tdl_requests')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as TDLRequest
    },
    enabled: !!id,
  })
}

export function useCreateTDL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTDLInput) => {
      const { data, error } = await supabase
        .from('tdl_requests')
        .insert({
          ...input,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data as TDLRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tdl-requests'] })
    },
  })
}

export function useUpdateTDL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TDLRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from('tdl_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TDLRequest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tdl-requests'] })
      queryClient.invalidateQueries({ queryKey: ['tdl-request', data.id] })
    },
  })
}
