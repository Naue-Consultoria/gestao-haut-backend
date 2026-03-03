import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { metasService } from '../services/metas.service';
import { metaSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';
import { getCurrentYear } from '../utils/helpers';

export class MetasController {
  async getByBroker(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await metasService.getByBroker(req.params.brokerId);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getByBrokerAndMonth(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await metasService.getByBrokerAndMonth(req.params.brokerId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async upsert(req: AuthenticatedRequest, res: Response) {
    try {
      const metaData = metaSchema.parse(req.body);
      const month = parseInt(req.params.month, 10);
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await metasService.upsert(req.params.brokerId, month, year, metaData);
      sendSuccess(res, data);
    } catch (err: unknown) {
      try { handleValidationError(res, err); } catch { sendError(res, (err as Error).message, 500); }
    }
  }
}

export const metasController = new MetasController();
