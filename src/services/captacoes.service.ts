import { supabaseAdmin } from '../config/supabase';

export class CaptacoesService {
  async list(brokerId: string, month?: number, year?: number) {
    let query = supabaseAdmin.from('captacoes').select('*').eq('broker_id', brokerId);
    if (month !== undefined) query = query.eq('month', month);
    if (year !== undefined) query = query.eq('year', year);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async listMultiple(brokerIds: string[], month?: number, year?: number) {
    let query = supabaseAdmin.from('captacoes').select('*').in('broker_id', brokerIds);
    if (month !== undefined) query = query.eq('month', month);
    if (year !== undefined) query = query.eq('year', year);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async create(brokerId: string, record: { month: number; year: number; oportunidade: string; exclusivo: string; origem: string; vgv: number }) {
    const { data, error } = await supabaseAdmin
      .from('captacoes')
      .insert({ broker_id: brokerId, ...record })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, record: { oportunidade?: string; exclusivo?: string; origem?: string; vgv?: number }) {
    const { data, error } = await supabaseAdmin
      .from('captacoes')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }


  async updateScoped(id: string, brokerIds: string[], record: { oportunidade?: string; exclusivo?: string; origem?: string; vgv?: number }) {
    // Escopo vazio nunca vira consulta: '.in(col, [])' geraria 'col=in.()',
    // que o PostgREST pode recusar. Sem ninguém no escopo, não há o que alterar.
    if (brokerIds.length === 0) throw new Error('Acesso negado');
    const { data, error } = await supabaseAdmin
      .from('captacoes')
      .update(record)
      .eq('id', id)
      .in('broker_id', brokerIds)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteById(id: string) {
    const { error } = await supabaseAdmin
      .from('captacoes')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }


  async deleteScoped(id: string, brokerIds: string[]) {
    // Escopo vazio nunca vira consulta: '.in(col, [])' geraria 'col=in.()',
    // que o PostgREST pode recusar. Sem ninguém no escopo, não há o que alterar.
    if (brokerIds.length === 0) throw new Error('Acesso negado');
    const { error } = await supabaseAdmin
      .from('captacoes')
      .delete()
      .eq('id', id)
      .in('broker_id', brokerIds);
    if (error) throw new Error(error.message);
  }
}

export const captacoesService = new CaptacoesService();
