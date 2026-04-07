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

  async bulkUpsertVgv(brokerId: string, year: number, vgvAnual: number, _vgvMensal?: number) {
    // Distribute annual VGV across 12 months with remainder in the last month
    const vgvBase = Math.floor((vgvAnual / 12) * 100) / 100;
    const vgvUltimo = Math.round((vgvAnual - vgvBase * 11) * 100) / 100;

    // Step 1: Update VGV fields on all existing rows (months 0-10 get base, month 11 gets remainder)
    const { error: updateError } = await supabaseAdmin
      .from('metas')
      .update({ vgv_anual: vgvAnual, vgv_mensal: vgvBase })
      .eq('broker_id', brokerId)
      .eq('year', year)
      .lt('month', 11);
    if (updateError) throw new Error(updateError.message);

    const { error: updateLastError } = await supabaseAdmin
      .from('metas')
      .update({ vgv_anual: vgvAnual, vgv_mensal: vgvUltimo })
      .eq('broker_id', brokerId)
      .eq('year', year)
      .eq('month', 11);
    if (updateLastError) throw new Error(updateLastError.message);

    // Step 2: Find which months already have rows
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('metas')
      .select('month')
      .eq('broker_id', brokerId)
      .eq('year', year);
    if (fetchError) throw new Error(fetchError.message);

    const existingMonths = new Set((existing || []).map(r => r.month));

    // Step 3: Insert missing months with correct VGV distribution
    const missingRows = Array.from({ length: 12 }, (_, m) => m)
      .filter(m => !existingMonths.has(m))
      .map(month => ({
        broker_id: brokerId,
        month,
        year,
        vgv_anual: vgvAnual,
        vgv_mensal: month === 11 ? vgvUltimo : vgvBase,
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
