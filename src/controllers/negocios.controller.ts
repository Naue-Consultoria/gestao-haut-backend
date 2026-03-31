import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { negociosService } from '../services/negocios.service';
import { parceriasService } from '../services/parcerias.service';
import { negocioSchema, negocioUpdateSchema, monthYearQuery } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

async function getPartnerIds(userId: string): Promise<string[] | null> {
  const parceria = await parceriasService.getByBrokerId(userId);
  if (!parceria) return null;
  return (parceria.parceria_membros || []).map((m: any) => m.broker_id);
}

export class NegociosController {
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
        ? await negociosService.listMultiple(partnerIds, query.month, query.year)
        : await negociosService.list(brokerId, query.month, query.year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const body = negocioSchema.parse(req.body);
      const { broker_id, ...record } = body;
      const targetBrokerId = (req.userRole === 'gestor' && broker_id) ? broker_id : req.userId!;
      const data = await negociosService.create(targetBrokerId, record);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const record = negocioUpdateSchema.parse(req.body);
      let data;
      if (req.userRole === 'gestor') {
        data = await negociosService.update(req.params.id, record);
      } else {
        const partnerIds = await getPartnerIds(req.userId!);
        if (partnerIds) {
          data = await negociosService.updateByPartner(req.params.id, partnerIds, record);
        } else {
          data = await negociosService.updateByBroker(req.params.id, req.userId!, record);
        }
      }
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.userRole === 'gestor') {
        await negociosService.deleteById(req.params.id);
      } else {
        const partnerIds = await getPartnerIds(req.userId!);
        if (partnerIds) {
          await negociosService.deleteByPartner(req.params.id, partnerIds);
        } else {
          await negociosService.delete(req.params.id, req.userId!);
        }
      }
      sendSuccess(res, { message: 'Registro excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const negociosController = new NegociosController();
