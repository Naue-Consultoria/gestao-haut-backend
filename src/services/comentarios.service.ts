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

  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('comentarios')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /** Exclui apenas se o comentário for de um corretor dentro do escopo informado. */
  async deleteScoped(id: string, brokerIds: string[]) {
    // Escopo vazio nunca vira consulta: '.in(col, [])' geraria 'col=in.()',
    // que o PostgREST pode recusar. Sem ninguém no escopo, não há o que alterar.
    if (brokerIds.length === 0) throw new Error('Acesso negado');
    const { error } = await supabaseAdmin
      .from('comentarios')
      .delete()
      .eq('id', id)
      .in('broker_id', brokerIds);
    if (error) throw new Error(error.message);
  }
}

export const comentariosService = new ComentariosService();
