import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { positivacoesService } from '../services/positivacoes.service';
import { parceriasService } from '../services/parcerias.service';
import { positivacaoSchema, monthYearQuery } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

async function getPartnerIds(userId: string): Promise<string[] | null> {
  const parceria = await parceriasService.getByBrokerId(userId);
  if (!parceria) return null;
  return (parceria.parceria_membros || []).map((m: any) => m.broker_id);
}

export class PositivacoesController {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const query = monthYearQuery.parse(req.query);
      const brokerId = (query.brokerId || req.userId)!;
      if (req.userRole !== 'gestor' && brokerId !== req.userId) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      // Check if broker is in a partnership
      const partnerIds = await getPartnerIds(brokerId);
      const data = partnerIds
        ? await positivacoesService.listMultiple(partnerIds, query.month, query.year)
        : await positivacoesService.list(brokerId, query.month, query.year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = positivacaoSchema.parse(req.body);
      const { broker_id, ...record } = body;
      const targetBrokerId = (req.userRole === 'gestor' && broker_id) ? broker_id : req.userId!;
      const data = await positivacoesService.create(targetBrokerId, record);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.userRole === 'gestor') {
        await positivacoesService.deleteById(req.params.id);
      } else {
        const partnerIds = await getPartnerIds(req.userId!);
        if (partnerIds) {
          await positivacoesService.deleteByPartner(req.params.id, partnerIds);
        } else {
          await positivacoesService.delete(req.params.id, req.userId!);
        }
      }
      sendSuccess(res, { message: 'Registro excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const positivacoesController = new PositivacoesController();
