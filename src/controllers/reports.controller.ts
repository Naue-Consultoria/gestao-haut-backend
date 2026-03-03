import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { reportsService } from '../services/reports.service';
import { sendSuccess, sendError, getCurrentMonth, getCurrentYear } from '../utils/helpers';

export class ReportsController {
  async brokerReport(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await reportsService.getBrokerReport(req.params.brokerId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const reportsController = new ReportsController();
