import { Router } from 'express';
import { mapaAmbicaoController } from '../controllers/mapa-ambicao.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const mapaAmbicaoRouter = Router();
mapaAmbicaoRouter.use(authMiddleware);
mapaAmbicaoRouter.get('/', (req, res) => mapaAmbicaoController.getMine(req, res));
mapaAmbicaoRouter.put('/', (req, res) => mapaAmbicaoController.upsertMine(req, res));

export const mapasAmbicaoRouter = Router();
mapasAmbicaoRouter.use(authMiddleware);
mapasAmbicaoRouter.use(requireGestor);
mapasAmbicaoRouter.get('/', (req, res) => mapaAmbicaoController.listForGestor(req, res));
mapasAmbicaoRouter.get('/:brokerId', (req, res) => mapaAmbicaoController.getOneForGestor(req, res));
