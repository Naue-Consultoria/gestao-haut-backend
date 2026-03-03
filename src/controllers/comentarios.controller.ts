import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { comentariosService } from '../services/comentarios.service';
import { comentarioSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';
import { getCurrentYear } from '../utils/helpers';

export class ComentariosController {
  async getByBroker(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await comentariosService.getByBroker(req.params.brokerId);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getByBrokerAndMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await comentariosService.getByBrokerAndMonth(req.params.brokerId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async upsert(req: AuthenticatedRequest, res: Response) {
    try {
      const body = comentarioSchema.parse(req.body);
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await comentariosService.upsert(req.params.brokerId, req.userId!, month, year, body.texto);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }
}

export const comentariosController = new ComentariosController();
