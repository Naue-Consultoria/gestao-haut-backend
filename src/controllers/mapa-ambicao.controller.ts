import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/api';
import { mapaAmbicaoService } from '../services/mapa-ambicao.service';
import { mapaAmbicaoUpsertSchema } from '../utils/validation';
import { sendSuccess, sendError, handleValidationError } from '../utils/helpers';

export class MapaAmbicaoController {
  async getMine(req: AuthenticatedRequest, res: Response) {
    try {
      const brokerId = req.userId;
      if (!brokerId) {
        sendError(res, 'Usuário não autenticado', 401);
        return;
      }
      const mapa = await mapaAmbicaoService.getByBrokerId(brokerId);
      if (!mapa) {
        sendError(res, 'Mapa não encontrado', 404);
        return;
      }
      sendSuccess(res, mapa);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async upsertMine(req: AuthenticatedRequest, res: Response) {
    try {
      const brokerId = req.userId;
      if (!brokerId) {
        sendError(res, 'Usuário não autenticado', 401);
        return;
      }
      const body = mapaAmbicaoUpsertSchema.parse(req.body);
      const mapa = await mapaAmbicaoService.upsert(brokerId, body);
      sendSuccess(res, mapa);
    } catch (err: unknown) {
      try {
        handleValidationError(res, err);
      } catch {
        sendError(res, (err as Error).message, 500);
      }
    }
  }

  async listForGestor(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await mapaAmbicaoService.listAllWithProfiles();
      sendSuccess(res, data);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }

  async getOneForGestor(req: AuthenticatedRequest, res: Response) {
    try {
      const brokerIdParam = z.string().uuid('brokerId deve ser UUID válido').safeParse(req.params.brokerId);
      if (!brokerIdParam.success) {
        sendError(res, brokerIdParam.error.errors[0].message, 400);
        return;
      }
      const mapa = await mapaAmbicaoService.getAsGestor(brokerIdParam.data);
      if (!mapa) {
        sendError(res, 'Mapa não encontrado', 404);
        return;
      }
      sendSuccess(res, mapa);
    } catch (err: unknown) {
      sendError(res, (err as Error).message, 500);
    }
  }
}

export const mapaAmbicaoController = new MapaAmbicaoController();
