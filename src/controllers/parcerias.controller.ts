import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { parceriasService } from '../services/parcerias.service';
import { metaSchema, comentarioSchema, planoAcaoSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError, getCurrentYear } from '../utils/helpers';
import { canManageBroker, managedBrokerIds } from '../utils/scope';
import { filterParceriasByScope } from '../middleware/parceriaScope';

export class ParceriasController {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const data = filterParceriasByScope(await parceriasService.getAll(), await managedBrokerIds(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getActive(req: AuthenticatedRequest, res: Response) {
    try {
      const data = filterParceriasByScope(await parceriasService.getActive(), await managedBrokerIds(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await parceriasService.getById(req.params.id);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getByBrokerId(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const data = await parceriasService.getByBrokerId(req.params.brokerId);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, brokerIds } = req.body;
      if (!nome || !brokerIds?.length || brokerIds.length < 2) {
        return sendError(res, 'Nome e pelo menos 2 corretores são obrigatórios', 400);
      }
      const data = await parceriasService.create(nome, brokerIds);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 400);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { nome, active } = req.body;
      const data = await parceriasService.update(req.params.id, nome, active);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async updateMembros(req: AuthenticatedRequest, res: Response) {
    try {
      const { brokerIds } = req.body;
      if (!brokerIds?.length || brokerIds.length < 2) {
        return sendError(res, 'Pelo menos 2 corretores são obrigatórios', 400);
      }
      const data = await parceriasService.updateMembros(req.params.id, brokerIds);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 400);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      await parceriasService.delete(req.params.id);
      sendSuccess(res, { deleted: true });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  // --- Metas ---

  async getMetas(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await parceriasService.getMetas(req.params.id);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getMetaByMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await parceriasService.getMetaByMonth(req.params.id, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async upsertMeta(req: AuthenticatedRequest, res: Response) {
    try {
      const metaData = metaSchema.parse(req.body);
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await parceriasService.upsertMeta(req.params.id, month, year, metaData);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async bulkUpsertVgv(req: AuthenticatedRequest, res: Response) {
    try {
      const { vgv_anual } = req.body;
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await parceriasService.bulkUpsertVgv(
        req.params.id, year, Number(vgv_anual) || 0
      );
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
  // --- Comentários ---

  async getComentarios(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await parceriasService.getComentarios(req.params.id);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getComentarioByMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await parceriasService.getComentarioByMonth(req.params.id, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async upsertComentario(req: AuthenticatedRequest, res: Response) {
    try {
      const body = comentarioSchema.parse(req.body);
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await parceriasService.upsertComentario(req.params.id, req.userId!, month, year, body.texto);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async deleteComentario(req: AuthenticatedRequest, res: Response) {
    try {
      await parceriasService.deleteComentario(req.params.id);
      sendSuccess(res, null);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  // --- Planos de Ação ---

  async getPlanosAcao(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await parceriasService.getPlanosAcao(req.params.id);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getPlanosAcaoByMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await parceriasService.getPlanosAcaoByMonth(req.params.id, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async createPlanoAcao(req: AuthenticatedRequest, res: Response) {
    try {
      const body = planoAcaoSchema.parse(req.body);
      const data = await parceriasService.createPlanoAcao(req.params.id, req.userId!, body);
      sendSuccess(res, data, 201);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }

  async updatePlanoAcao(req: AuthenticatedRequest, res: Response) {
    try {
      const { texto, prazo, status } = req.body;
      const data = await parceriasService.updatePlanoAcao(req.params.id, { texto, prazo, status });
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async deletePlanoAcao(req: AuthenticatedRequest, res: Response) {
    try {
      await parceriasService.deletePlanoAcao(req.params.id);
      sendSuccess(res, { message: 'Plano de ação excluído' });
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const parceriasController = new ParceriasController();
