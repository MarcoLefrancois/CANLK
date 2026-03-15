import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour l'authentification
export type User = {
  id: string
  email: string
  role?: string
}

// Types pour les demandes TDL
export type TDLStatus = 'draft' | 'submitted' | 'in_analysis' | 'in_review' | 'qualified' | 'rejected' | 'completed'

export interface TDLRequest {
  id: string
  tdl_number: string
  status: TDLStatus
  client_id: string | null
  vendor_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Champs du Bloc A
  sample_description?: string
  sample_quantity?: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface Client {
  id: string
  name: string
  code: string
  region: 'QC' | 'ON'
  contact_email?: string
  contact_phone?: string
}
