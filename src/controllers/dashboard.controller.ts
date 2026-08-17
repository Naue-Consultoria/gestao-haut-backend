import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess, sendError, getCurrentMonth, getCurrentYear, handleValidationError } from '../utils/helpers';
import { roiMonthlyQuery, roiYearlyQuery } from '../utils/validation';
import { gestaoScope, canManageBroker, managedBrokerIds } from '../utils/scope';

export class DashboardController {
  async consolidated(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getConsolidated(month, year, await gestaoScope(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async individual(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getIndividual(req.params.brokerId, month, year, await managedBrokerIds(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async consolidatedEvolution(req: AuthenticatedRequest, res: Response) {
    try {
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getConsolidatedEvolution(year, await gestaoScope(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async yearlyEvolution(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getYearlyEvolution(req.params.brokerId, year, await managedBrokerIds(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async individualYearly(req: AuthenticatedRequest, res: Response) {
    try {
      if (!(await canManageBroker(req, req.params.brokerId))) {
        sendError(res, 'Acesso negado', 403);
        return;
      }
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getIndividualYearly(req.params.brokerId, year, await managedBrokerIds(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async consolidatedYearly(req: AuthenticatedRequest, res: Response) {
    try {
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getConsolidatedYearly(year, await gestaoScope(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async ranking(req: AuthenticatedRequest, res: Response) {
    try {
      const month = parseInt(req.query.month as string) ?? getCurrentMonth();
      const year = parseInt(req.query.year as string) || getCurrentYear();
      const data = await dashboardService.getRanking(month, year, await gestaoScope(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async roi(req: AuthenticatedRequest, res: Response) {
    try {
      const { month, year } = roiMonthlyQuery.parse(req.query);
      const data = await dashboardService.getRoi(month, year, await gestaoScope(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      try {
        handleValidationError(res, err);
      } catch {
        sendError(res, (err as Error).message, 500);
      }
    }
  }

  async roiYearly(req: AuthenticatedRequest, res: Response) {
    try {
      const { year } = roiYearlyQuery.parse(req.query);
      const data = await dashboardService.getRoiYearly(year, await gestaoScope(req));
      sendSuccess(res, data);
    } catch (err: unknown) {
      try {
        handleValidationError(res, err);
      } catch {
        sendError(res, (err as Error).message, 500);
      }
    }
  }
}

export const dashboardController = new DashboardController();
