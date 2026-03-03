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

  async create(brokerId: string, record: { month: number; year: number; oportunidade: string; exclusivo: string; origem: string; vgv: number }) {
    const { data, error } = await supabaseAdmin
      .from('captacoes')
      .insert({ broker_id: brokerId, ...record })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string, brokerId: string) {
    const { error } = await supabaseAdmin
      .from('captacoes')
      .delete()
      .eq('id', id)
      .eq('broker_id', brokerId);
    if (error) throw new Error(error.message);
  }
}

export const captacoesService = new CaptacoesService();
