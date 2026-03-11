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

  async bulkUpsertVgv(brokerId: string, year: number, vgvAnual: number, vgvMensal: number) {
    // Step 1: Update VGV fields on all existing rows for this broker/year
    const { error: updateError } = await supabaseAdmin
      .from('metas')
      .update({ vgv_anual: vgvAnual, vgv_mensal: vgvMensal })
      .eq('broker_id', brokerId)
      .eq('year', year);
    if (updateError) throw new Error(updateError.message);

    // Step 2: Find which months already have rows
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('metas')
      .select('month')
      .eq('broker_id', brokerId)
      .eq('year', year);
    if (fetchError) throw new Error(fetchError.message);

    const existingMonths = new Set((existing || []).map(r => r.month));

    // Step 3: Insert missing months with full default values
    const missingRows = Array.from({ length: 12 }, (_, m) => m)
      .filter(m => !existingMonths.has(m))
      .map(month => ({
        broker_id: brokerId,
        month,
        year,
        vgv_anual: vgvAnual,
        vgv_mensal: vgvMensal,
        captacoes: 0,
        capt_exclusivas: 0,
        negocios: 0,
        treinamento: 0,
        investimento: 0,
        positivacao: 0,
      }));

    if (missingRows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('metas')
        .insert(missingRows);
      if (insertError) throw new Error(insertError.message);
    }

    return { updated: 12 - missingRows.length, created: missingRows.length };
  }
}

export const metasService = new MetasService();
