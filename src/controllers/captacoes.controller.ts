import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { captacoesService } from '../services/captacoes.service';
import { parceriasService } from '../services/parcerias.service';
import { captacaoSchema, monthYearQuery } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

async function getPartnerIds(userId: string): Promise<string[] | null> {
  const parceria = await parceriasService.getByBrokerId(userId);
  if (!parceria) return null;
  return (parceria.parceria_membros || []).map((m: any) => m.broker_id);
}

export class CaptacoesController {
  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const query = monthYearQuery.parse(req.query);
      const brokerId = (query.brokerId || req.userId)!;
      if (req.userRole !== 'gestor' && brokerId !== req.userId) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const partnerIds = await getPartnerIds(brokerId);
      const data = partnerIds
        ? await captacoesService.listMultiple(partnerIds, query.month, query.year)
        : await captacoesService.list(brokerId, query.month, query.year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = captacaoSchema.parse(req.body);
      const data = await captacoesService.create(req.userId!, body);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const partnerIds = await getPartnerIds(req.userId!);
      if (partnerIds) {
        await captacoesService.deleteByPartner(req.params.id, partnerIds);
      } else {
        await captacoesService.delete(req.params.id, req.userId!);
      }
      sendSuccess(res, { message: 'Registro excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const captacoesController = new CaptacoesController();
