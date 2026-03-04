import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { planosAcaoService } from '../services/planosAcao.service';
import { planoAcaoSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';
import { getCurrentYear } from '../utils/helpers';

export class PlanosAcaoController {
  async getByBroker(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await planosAcaoService.getByBroker(req.params.brokerId);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getByBrokerAndMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await planosAcaoService.getByBrokerAndMonth(req.params.brokerId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = planoAcaoSchema.parse(req.body);
      const data = await planosAcaoService.create(req.params.brokerId, req.userId!, body);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { texto, prazo, status } = req.body;
      const data = await planosAcaoService.update(req.params.id, { texto, prazo, status });
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      await planosAcaoService.delete(req.params.id);
      sendSuccess(res, { message: 'Plano de ação excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const planosAcaoController = new PlanosAcaoController();
