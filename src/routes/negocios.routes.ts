import { Router } from 'express';
import { negociosController } from '../controllers/negocios.controller';
import { authMiddleware } from '../middleware/auth';

export const negociosRouter = Router();

negociosRouter.use(authMiddleware);
negociosRouter.get('/', (req, res) => negociosController.list(req, res));
negociosRouter.post('/', (req, res) => negociosController.create(req, res));
negociosRouter.delete('/:id', (req, res) => negociosController.delete(req, res));
