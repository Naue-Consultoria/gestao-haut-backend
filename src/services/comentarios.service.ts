import { supabaseAdmin } from '../config/supabase';

export class ComentariosService {
  async getByBroker(brokerId: string) {
    const { data, error } = await supabaseAdmin
      .from('comentarios')
      .select('*, gestor:profiles!comentarios_gestor_id_fkey(name)')
      .eq('broker_id', brokerId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getByBrokerAndMonth(brokerId: string, month: number, year: number) {
    const { data, error } = await supabaseAdmin
      .from('comentarios')
      .select('*, gestor:profiles!comentarios_gestor_id_fkey(name)')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsert(brokerId: string, gestorId: string, month: number, year: number, texto: string) {
    const { data, error } = await supabaseAdmin
      .from('comentarios')
      .upsert(
        { broker_id: brokerId, gestor_id: gestorId, month, year, texto },
        { onConflict: 'broker_id,month,year' }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export const comentariosService = new ComentariosService();
