import { supabaseAdmin } from '../config/supabase';

export class ProfilesService {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .neq('email', 'gestor@haut.com')
      .order('name');
    if (error) throw new Error(error.message);
    return data;
  }

  async getBrokers() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'corretor')
      .eq('active', true)
      .order('name');
    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async delete(id: string) {
    // Delete all related data before deleting the user
    const tables = [
      'positivacoes',
      'captacoes',
      'negocios',
      'treinamentos',
      'investimentos',
      'comentarios',
      'planos_acao',
      'metas',
      'parceria_membros',
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq('broker_id', id);
      if (error) throw new Error(`Erro ao limpar ${table}: ${error.message}`);
    }

    // Also clean comentarios/planos where user is the gestor
    await supabaseAdmin.from('comentarios').delete().eq('gestor_id', id);
    await supabaseAdmin.from('planos_acao').delete().eq('gestor_id', id);

    // Delete profile and auth user
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    if (profileError) throw new Error(profileError.message);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw new Error(authError.message);
  }

  async updateAvatarUrl(id: string, avatarUrl: string | null) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export const profilesService = new ProfilesService();
