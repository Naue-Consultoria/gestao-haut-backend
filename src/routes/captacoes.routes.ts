import { Router } from 'express';
import { captacoesController } from '../controllers/captacoes.controller';
import { authMiddleware } from '../middleware/auth';

export const captacoesRouter = Router();

captacoesRouter.use(authMiddleware);
captacoesRouter.get('/', (req, res) => captacoesController.list(req, res));
captacoesRouter.post('/', (req, res) => captacoesController.create(req, res));
captacoesRouter.delete('/:id', (req, res) => captacoesController.delete(req, res));
