import { Router } from 'express';
import { comentariosController } from '../controllers/comentarios.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const comentariosRouter = Router();

comentariosRouter.use(authMiddleware);
comentariosRouter.get('/:brokerId', (req, res) => comentariosController.getByBroker(req, res));
comentariosRouter.get('/:brokerId/:month', (req, res) => comentariosController.getByBrokerAndMonth(req, res));
comentariosRouter.put('/:brokerId/:month', requireGestor, (req, res) => comentariosController.upsert(req, res));
comentariosRouter.delete('/:id', requireGestor, (req, res) => comentariosController.delete(req, res));
