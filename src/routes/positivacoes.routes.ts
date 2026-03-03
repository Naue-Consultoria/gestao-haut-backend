import { Router } from 'express';
import { positivacoesController } from '../controllers/positivacoes.controller';
import { authMiddleware } from '../middleware/auth';

export const positivacoesRouter = Router();

positivacoesRouter.use(authMiddleware);
positivacoesRouter.get('/', (req, res) => positivacoesController.list(req, res));
positivacoesRouter.post('/', (req, res) => positivacoesController.create(req, res));
positivacoesRouter.delete('/:id', (req, res) => positivacoesController.delete(req, res));
