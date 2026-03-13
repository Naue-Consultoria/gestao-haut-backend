import { supabaseAdmin } from '../config/supabase';

export class ParceriasService {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('parcerias')
      .select('*, parceria_membros(*, broker:profiles(id, name, email, team, avatar_url))')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as any[];
  }

  async getActive(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('parcerias')
      .select('*, parceria_membros(*, broker:profiles(id, name, email, team, avatar_url))')
      .eq('active', true)
      .order('nome');
    if (error) throw new Error(error.message);
    return data as any[];
  }

  async getById(id: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('parcerias')
      .select('*, parceria_membros(*, broker:profiles(id, name, email, team, avatar_url))')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data as any;
  }

  async getByBrokerId(brokerId: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('parceria_membros')
      .select('parceria_id')
      .eq('broker_id', brokerId);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;

    // Check each partnership for active status
    for (const row of data) {
      const parceria = await this.getById(row.parceria_id);
      if (parceria && parceria.active) return parceria;
    }
    return null;
  }

  async create(nome: string, brokerIds: string[]) {
    // Check if any broker is already in an active partnership
    for (const brokerId of brokerIds) {
      const existing: any = await this.getByBrokerId(brokerId);
      if (existing) {
        const { data: broker } = await supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', brokerId)
          .single();
        throw new Error(`${broker?.name || brokerId} já está em uma parceria ativa (${existing.nome})`);
      }
    }

    const { data: parceria, error } = await supabaseAdmin
      .from('parcerias')
      .insert({ nome })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const membros = brokerIds.map(broker_id => ({
      parceria_id: parceria.id,
      broker_id,
    }));

    const { error: membrosError } = await supabaseAdmin
      .from('parceria_membros')
      .insert(membros);
    if (membrosError) throw new Error(membrosError.message);

    return this.getById(parceria.id);
  }

  async update(id: string, nome: string, active: boolean) {
    const { error } = await supabaseAdmin
      .from('parcerias')
      .update({ nome, active })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return this.getById(id);
  }

  async updateMembros(id: string, brokerIds: string[]) {
    // Check if any new broker is already in another active partnership
    for (const brokerId of brokerIds) {
      const existing: any = await this.getByBrokerId(brokerId);
      if (existing && existing.id !== id) {
        const { data: broker } = await supabaseAdmin
          .from('profiles')
          .select('name')
          .eq('id', brokerId)
          .single();
        throw new Error(`${broker?.name || brokerId} já está em outra parceria ativa (${existing.nome})`);
      }
    }

    // Remove existing members
    const { error: delError } = await supabaseAdmin
      .from('parceria_membros')
      .delete()
      .eq('parceria_id', id);
    if (delError) throw new Error(delError.message);

    // Add new members
    const membros = brokerIds.map(broker_id => ({
      parceria_id: id,
      broker_id,
    }));

    const { error: insError } = await supabaseAdmin
      .from('parceria_membros')
      .insert(membros);
    if (insError) throw new Error(insError.message);

    return this.getById(id);
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('parcerias')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // --- Metas da Parceria ---

  async getMetas(parceriaId: string) {
    const { data, error } = await supabaseAdmin
      .from('metas_parceria')
      .select('*')
      .eq('parceria_id', parceriaId)
      .order('year')
      .order('month');
    if (error) throw new Error(error.message);
    return data;
  }

  async getMetaByMonth(parceriaId: string, month: number, year: number) {
    const { data, error } = await supabaseAdmin
      .from('metas_parceria')
      .select('*')
      .eq('parceria_id', parceriaId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsertMeta(parceriaId: string, month: number, year: number, metaData: Record<string, number>) {
    const { data, error } = await supabaseAdmin
      .from('metas_parceria')
      .upsert(
        { parceria_id: parceriaId, month, year, ...metaData },
        { onConflict: 'parceria_id,month,year' }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async bulkUpsertVgv(parceriaId: string, year: number, vgvAnual: number, vgvMensal: number) {
    const { error: updateError } = await supabaseAdmin
      .from('metas_parceria')
      .update({ vgv_anual: vgvAnual, vgv_mensal: vgvMensal })
      .eq('parceria_id', parceriaId)
      .eq('year', year);
    if (updateError) throw new Error(updateError.message);

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('metas_parceria')
      .select('month')
      .eq('parceria_id', parceriaId)
      .eq('year', year);
    if (fetchError) throw new Error(fetchError.message);

    const existingMonths = new Set((existing || []).map(r => r.month));

    const missingRows = Array.from({ length: 12 }, (_, m) => m)
      .filter(m => !existingMonths.has(m))
      .map(month => ({
        parceria_id: parceriaId,
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
        .from('metas_parceria')
        .insert(missingRows);
      if (insertError) throw new Error(insertError.message);
    }

    return { updated: 12 - missingRows.length, created: missingRows.length };
  }

  // --- Comentários da Parceria ---

  async getComentarios(parceriaId: string) {
    const { data, error } = await supabaseAdmin
      .from('comentarios_parceria')
      .select('*, gestor:profiles!comentarios_parceria_gestor_id_fkey(name)')
      .eq('parceria_id', parceriaId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getComentarioByMonth(parceriaId: string, month: number, year: number) {
    const { data, error } = await supabaseAdmin
      .from('comentarios_parceria')
      .select('*, gestor:profiles!comentarios_parceria_gestor_id_fkey(name)')
      .eq('parceria_id', parceriaId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsertComentario(parceriaId: string, gestorId: string, month: number, year: number, texto: string) {
    const { data, error } = await supabaseAdmin
      .from('comentarios_parceria')
      .upsert(
        { parceria_id: parceriaId, gestor_id: gestorId, month, year, texto },
        { onConflict: 'parceria_id,month,year' }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteComentario(id: string) {
    const { error } = await supabaseAdmin
      .from('comentarios_parceria')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // --- Planos de Ação da Parceria ---

  async getPlanosAcao(parceriaId: string) {
    const { data, error } = await supabaseAdmin
      .from('planos_acao_parceria')
      .select('*, gestor:profiles!planos_acao_parceria_gestor_id_fkey(name)')
      .eq('parceria_id', parceriaId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getPlanosAcaoByMonth(parceriaId: string, month: number, year: number) {
    const { data, error } = await supabaseAdmin
      .from('planos_acao_parceria')
      .select('*, gestor:profiles!planos_acao_parceria_gestor_id_fkey(name)')
      .eq('parceria_id', parceriaId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async createPlanoAcao(parceriaId: string, gestorId: string, data: { texto: string; prazo: string; status: string; month: number; year: number }) {
    const { data: result, error } = await supabaseAdmin
      .from('planos_acao_parceria')
      .insert({ parceria_id: parceriaId, gestor_id: gestorId, ...data })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  }

  async updatePlanoAcao(id: string, data: { texto?: string; prazo?: string; status?: string }) {
    const { data: result, error } = await supabaseAdmin
      .from('planos_acao_parceria')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return result;
  }

  async deletePlanoAcao(id: string) {
    const { error } = await supabaseAdmin
      .from('planos_acao_parceria')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // Helper: get broker IDs for a partnership
  async getMemberIds(parceriaId: string): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('parceria_membros')
      .select('broker_id')
      .eq('parceria_id', parceriaId);
    if (error) throw new Error(error.message);
    return (data || []).map(m => m.broker_id);
  }
}

export const parceriasService = new ParceriasService();
