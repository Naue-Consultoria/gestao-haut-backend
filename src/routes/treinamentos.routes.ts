import { Router } from 'express';
import { treinamentosController } from '../controllers/treinamentos.controller';
import { authMiddleware } from '../middleware/auth';

export const treinamentosRouter = Router();

treinamentosRouter.use(authMiddleware);
treinamentosRouter.get('/', (req, res) => treinamentosController.list(req, res));
treinamentosRouter.post('/', (req, res) => treinamentosController.create(req, res));
treinamentosRouter.delete('/:id', (req, res) => treinamentosController.delete(req, res));
