import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { planosAcaoService } from '../services/planosAcao.service';
import { planoAcaoSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';
import { getCurrentYear } from '../utils/helpers';
import { canManageBroker, managedBrokerIds } from '../utils/scope';

export class PlanosAcaoController {
  async getByBroker(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const data = await planosAcaoService.getByBroker(req.params.brokerId);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getByBrokerAndMonth(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
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
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
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
      const scope = await managedBrokerIds(req);
      const data = scope === null
        ? await planosAcaoService.update(req.params.id, { texto, prazo, status })
        : await planosAcaoService.updateScoped(req.params.id, scope, { texto, prazo, status });
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const scope = await managedBrokerIds(req);
      if (scope === null) {
        await planosAcaoService.delete(req.params.id);
      } else {
        await planosAcaoService.deleteScoped(req.params.id, scope);
      }
      sendSuccess(res, { message: 'Plano de ação excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const planosAcaoController = new PlanosAcaoController();
