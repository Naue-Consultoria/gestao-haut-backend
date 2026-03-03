import { supabaseAdmin } from '../config/supabase';

export class MetasService {
  async getByBroker(brokerId: string) {
    const { data, error } = await supabaseAdmin
      .from('metas')
      .select('*')
      .eq('broker_id', brokerId)
      .order('year', { ascending: true })
      .order('month', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async getByBrokerAndMonth(brokerId: string, month: number, year: number) {
    const { data, error } = await supabaseAdmin
      .from('metas')
      .select('*')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsert(brokerId: string, month: number, year: number, metaData: Record<string, number>) {
    const { data, error } = await supabaseAdmin
      .from('metas')
      .upsert(
        { broker_id: brokerId, month, year, ...metaData },
        { onConflict: 'broker_id,month,year' }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export const metasService = new MetasService();
