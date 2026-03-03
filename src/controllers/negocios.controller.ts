import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { negociosService } from '../services/negocios.service';
import { negocioSchema, monthYearQuery } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

export class NegociosController {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const query = monthYearQuery.parse(req.query);
      const brokerId = (query.brokerId || req.userId)!;
      if (req.userRole !== 'gestor' && brokerId !== req.userId) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const data = await negociosService.list(brokerId, query.month, query.year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = negocioSchema.parse(req.body);
      const data = await negociosService.create(req.userId!, body);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      await negociosService.delete(req.params.id, req.userId!);
      sendSuccess(res, { message: 'Registro excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const negociosController = new NegociosController();
