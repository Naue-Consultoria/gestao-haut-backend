import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { profilesService } from '../services/profiles.service';
import { authService } from '../services/auth.service';
import { supabaseAdmin } from '../config/supabase';
import { env } from '../config/env';
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
      console.error('resetPassword error:', (err as Error).message);
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        sendError(res, 'Nenhum arquivo enviado', 400);
        return;
      }

      const ext = file.originalname.split('.').pop() || 'jpg';
      const filePath = `${id}.${ext}`;

      // Remove old avatar if exists (ignore errors)
      await supabaseAdmin.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabaseAdmin.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) throw new Error(uploadError.message);

      const publicUrl = `${env.SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;

      const data = await profilesService.updateAvatarUrl(id, publicUrl);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async removeAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // List and remove files matching this user id
      const { data: files } = await supabaseAdmin.storage.from('avatars').list('', {
        search: id,
      });

      if (files && files.length > 0) {
        const filesToRemove = files
          .filter(f => f.name.startsWith(id))
          .map(f => f.name);
        if (filesToRemove.length > 0) {
          await supabaseAdmin.storage.from('avatars').remove(filesToRemove);
        }
      }

      const data = await profilesService.updateAvatarUrl(id, null);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const profilesController = new ProfilesController();
