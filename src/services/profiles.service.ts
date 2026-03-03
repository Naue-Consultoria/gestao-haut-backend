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
}

export const profilesService = new ProfilesService();
