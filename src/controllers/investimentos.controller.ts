import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { investimentosService } from '../services/investimentos.service';
import { investimentoSchema, investimentoUpdateSchema, monthYearQuery } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';
import { canManageBroker, canCreateForBroker, managedBrokerIds, scopedPartnerIds } from '../utils/scope';

export class InvestimentosController {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const query = monthYearQuery.parse(req.query);
      const brokerId = (query.brokerId || req.userId)!;
      if (!(await canManageBroker(req, brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const partnerIds = await scopedPartnerIds(req, brokerId);
      const data = partnerIds
        ? await investimentosService.listMultiple(partnerIds, query.month, query.year)
        : await investimentosService.list(brokerId, query.month, query.year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = investimentoSchema.parse(req.body);
      const { broker_id, ...record } = body;
      // Gestor e gerente podem lançar em nome de um corretor do seu escopo;
      // nos demais casos o registro fica no próprio usuário.
      const targetBrokerId = broker_id && (await canCreateForBroker(req, broker_id)) ? broker_id : req.userId!;
      const data = await investimentosService.create(targetBrokerId, record);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const record = investimentoUpdateSchema.parse(req.body);
      const scope = await managedBrokerIds(req);
      const data = scope === null
        ? await investimentosService.update(req.params.id, record)
        : await investimentosService.updateScoped(req.params.id, scope, record);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const scope = await managedBrokerIds(req);
      if (scope === null) {
        await investimentosService.deleteById(req.params.id);
      } else {
        await investimentosService.deleteScoped(req.params.id, scope);
      }
      sendSuccess(res, { message: 'Registro excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const investimentosController = new InvestimentosController();
