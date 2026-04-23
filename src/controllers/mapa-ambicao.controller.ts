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
      // Return null data instead of 404 so frontend treats absence as blank mapa
      sendSuccess(res, mapa);
    } catch (err: unknown) {
      console.error('[MapaAmbicao] getMine error:', (err as Error).message);
      sendError(res, 'Erro interno ao processar mapa de ambição', 500);
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
        console.error('[MapaAmbicao] upsertMine error:', (err as Error).message);
        sendError(res, 'Erro interno ao processar mapa de ambição', 500);
      }
    }
  }

  async listForGestor(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await mapaAmbicaoService.listAllWithProfiles();
      sendSuccess(res, data);
    } catch (err: unknown) {
      console.error('[MapaAmbicao] listForGestor error:', (err as Error).message);
      sendError(res, 'Erro interno ao processar mapa de ambição', 500);
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
      console.error('[MapaAmbicao] getOneForGestor error:', (err as Error).message);
      sendError(res, 'Erro interno ao processar mapa de ambição', 500);
    }
  }
}

export const mapaAmbicaoController = new MapaAmbicaoController();
