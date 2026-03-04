import { supabaseAdmin } from '../config/supabase';

export class PlanosAcaoService {
  async getByBroker(brokerId: string) {
    const { data, error } = await supabaseAdmin
      .from('planos_acao')
      .select('*, gestor:profiles!planos_acao_gestor_id_fkey(name)')
      .eq('broker_id', brokerId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getByBrokerAndMonth(brokerId: string, month: number, year: number) {
    const { data, error } = await supabaseAdmin
      .from('planos_acao')
      .select('*, gestor:profiles!planos_acao_gestor_id_fkey(name)')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async create(brokerId: string, gestorId: string, data: { texto: string; prazo: string; status: string; month: number; year: number }) {
    const { data: result, error } = await supabaseAdmin
      .from('planos_acao')
      .insert({ broker_id: brokerId, gestor_id: gestorId, ...data })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string, data: { texto?: string; prazo?: string; status?: string }) {
    const { data: result, error } = await supabaseAdmin
      .from('planos_acao')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('planos_acao')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const planosAcaoService = new PlanosAcaoService();
