import { Router } from 'express';
import { investimentosController } from '../controllers/investimentos.controller';
import { authMiddleware } from '../middleware/auth';

export const investimentosRouter = Router();

investimentosRouter.use(authMiddleware);
investimentosRouter.get('/', (req, res) => investimentosController.list(req, res));
investimentosRouter.post('/', (req, res) => investimentosController.create(req, res));
investimentosRouter.delete('/:id', (req, res) => investimentosController.delete(req, res));
