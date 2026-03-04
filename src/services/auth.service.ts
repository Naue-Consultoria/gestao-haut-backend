import { supabaseAdmin, supabaseAuth } from '../config/supabase';

export class AuthService {
  async login(email: string, password: string) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  }

  async register(email: string, password: string, metadata: { name: string; team: string; role: string }) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw new Error(error.message);

    return { user: data.user };
  }

  async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async changePassword(userId: string, newPassword: string) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new Error(error.message);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', userId);
    if (profileError) throw new Error(profileError.message);
  }

  async resetPassword(userId: string, newPassword: string) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) throw new Error(error.message);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('id', userId);
    if (profileError) throw new Error(profileError.message);
  }
}

export const authService = new AuthService();
