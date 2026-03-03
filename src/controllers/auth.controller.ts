import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema, changePasswordSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

export class AuthController {
  async login(req: AuthenticatedRequest, res: Response) {
    try {
      const body = loginSchema.parse(req.body);
      const data = await authService.login(body.email, body.password);
      sendSuccess(res, {
        user: data.user,
        session: { access_token: data.session?.access_token, refresh_token: data.session?.refresh_token },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Invalid login')) {
        sendError(res, 'Credenciais inválidas', 401);
        return;
      }
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async register(req: AuthenticatedRequest, res: Response) {
    try {
      const body = registerSchema.parse(req.body);
      const data = await authService.register(body.email, body.password, {
        name: body.name,
        team: body.team,
        role: body.role,
      });
      sendSuccess(res, {
        user: data.user,
        session: { access_token: data.session?.access_token, refresh_token: data.session?.refresh_token },
      }, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await authService.getProfile(req.userId!);
      sendSuccess(res, profile);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async logout(_req: AuthenticatedRequest, res: Response) {
    sendSuccess(res, { message: 'Sessão encerrada' });
  }

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const body = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.userId!, body.newPassword);
      sendSuccess(res, { message: 'Senha alterada com sucesso' });
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }
}

export const authController = new AuthController();
