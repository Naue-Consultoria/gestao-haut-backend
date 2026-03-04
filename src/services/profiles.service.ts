import { supabaseAdmin } from '../config/supabase';

export class ProfilesService {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
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
