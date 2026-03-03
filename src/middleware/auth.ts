import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types/api';

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ success: false, error: 'Token inválido' });
    return;
  }

  // Get profile to know role and must_change_password flag
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, must_change_password')
    .eq('id', user.id)
    .single();

  req.userId = user.id;
  req.userRole = profile?.role || 'corretor';
  req.accessToken = token;

  // If user must change password, only allow specific auth routes
  const allowedPaths = ['/auth/me', '/auth/change-password', '/auth/logout'];
  if (profile?.must_change_password && !allowedPaths.some(p => req.originalUrl.endsWith(p))) {
    res.status(403).json({ success: false, error: 'MUST_CHANGE_PASSWORD' });
    return;
  }

  next();
}
