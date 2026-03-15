import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Client Supabase Standard A-SPEC
 * Agent : ms_engine (Supabase-standard)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service pour la gestion des TDL
 */
export const tdlService = {
  /**
   * Créer une nouvelle demande TDL
   */
  async createRequest(data: any) {
    const { data: result, error } = await supabase
      .from('tdl_requests')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  /**
   * Récupérer les TDL de l'utilisateur courant
   */
  async getMyRequests() {
    const { data, error } = await supabase
      .from('tdl_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
