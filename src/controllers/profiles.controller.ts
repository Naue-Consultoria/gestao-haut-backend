import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { profilesService } from '../services/profiles.service';
import { authService } from '../services/auth.service';
import { supabaseAdmin } from '../config/supabase';
import { registerSchema, profileUpdateSchema, resetPasswordSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

export class ProfilesController {
  async getAll(_req: AuthenticatedRequest, res: Response) {
    try {
      const data = await profilesService.getAll();
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getBrokers(_req: AuthenticatedRequest, res: Response) {
    try {
      const data = await profilesService.getBrokers();
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = registerSchema.parse(req.body);
      const data = await authService.register(body.email, body.password, {
        name: body.name,
        team: body.team,
        role: body.role,
      });

      // Set must_change_password flag so user is forced to change on first login
      await supabaseAdmin
        .from('profiles')
        .update({ must_change_password: true })
        .eq('id', data.user.id);

      sendSuccess(res, data.user, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const updates = profileUpdateSchema.parse(req.body);
      const data = await profilesService.update(req.params.id, updates);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      await profilesService.delete(req.params.id);
      sendSuccess(res, null);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const body = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(req.params.id, body.password);
      sendSuccess(res, null);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }
}

export const profilesController = new ProfilesController();
