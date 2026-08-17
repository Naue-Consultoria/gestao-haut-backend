import { supabaseAdmin } from '../config/supabase';

export class InvestimentosService {
  async list(brokerId: string, month?: number, year?: number) {
    let query = supabaseAdmin.from('investimentos').select('*').eq('broker_id', brokerId);
    if (month !== undefined) query = query.eq('month', month);
    if (year !== undefined) query = query.eq('year', year);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async listMultiple(brokerIds: string[], month?: number, year?: number) {
    let query = supabaseAdmin.from('investimentos').select('*').in('broker_id', brokerIds);
    if (month !== undefined) query = query.eq('month', month);
    if (year !== undefined) query = query.eq('year', year);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async create(brokerId: string, record: { month: number; year: number; tipo: string; produto: string; valor: number; leads: number }) {
    const { data, error } = await supabaseAdmin
      .from('investimentos')
      .insert({ broker_id: brokerId, ...record })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, record: { tipo?: string; produto?: string; valor?: number; leads?: number }) {
    const { data, error } = await supabaseAdmin
      .from('investimentos')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }


  async updateScoped(id: string, brokerIds: string[], record: { tipo?: string; produto?: string; valor?: number; leads?: number }) {
    const { data, error } = await supabaseAdmin
      .from('investimentos')
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
      .from('investimentos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }


  async deleteScoped(id: string, brokerIds: string[]) {
    const { error } = await supabaseAdmin
      .from('investimentos')
      .delete()
      .eq('id', id)
      .in('broker_id', brokerIds);
    if (error) throw new Error(error.message);
  }
}

export const investimentosService = new InvestimentosService();
