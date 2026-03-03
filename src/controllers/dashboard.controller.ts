import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError, getCurrentMonth, getCurrentYear } from '../utils/helpers';

export class DashboardController {
  async consolidated(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getConsolidated(month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async individual(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getIndividual(req.params.brokerId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async ranking(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getRanking(month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const dashboardController = new DashboardController();
