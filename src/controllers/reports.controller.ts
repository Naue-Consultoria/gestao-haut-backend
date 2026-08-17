import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { reportsService } from '../services/reports.service';
import { sendSuccess, sendError, getCurrentMonth, getCurrentYear } from '../utils/helpers';
import { canManageBroker, managedBrokerIds } from '../utils/scope';
import { parceriasService } from '../services/parcerias.service';

export class ReportsController {
  async brokerReport(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await reportsService.getBrokerReport(req.params.brokerId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async parceriaReport(req: AuthenticatedRequest, res: Response) {
    try {
      // Relatório de parceria só sai se TODOS os membros estiverem no escopo —
      // uma parceria entre equipes não pode virar um atalho para os números da outra.
      const scope = await managedBrokerIds(req);
      if (scope !== null) {
        const memberIds = await parceriasService.getMemberIds(req.params.parceriaId);
        if (memberIds.length === 0 || !memberIds.every(id => scope.includes(id))) {
          sendError(res, 'Acesso negado', 403);
          return;
        }
      }
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await reportsService.getParceriaReport(req.params.parceriaId, month, year);
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const reportsController = new ReportsController();
