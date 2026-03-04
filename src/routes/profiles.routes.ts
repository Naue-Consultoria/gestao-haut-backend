import { Router } from 'express';
import { profilesController } from '../controllers/profiles.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const profilesRouter = Router();

profilesRouter.use(authMiddleware);
profilesRouter.get('/', (req, res) => profilesController.getAll(req, res));
profilesRouter.get('/brokers', (req, res) => profilesController.getBrokers(req, res));
profilesRouter.post('/', requireGestor, (req, res) => profilesController.create(req, res));
profilesRouter.put('/:id', requireGestor, (req, res) => profilesController.update(req, res));
profilesRouter.delete('/:id', requireGestor, (req, res) => profilesController.delete(req, res));
profilesRouter.post('/:id/reset-password', requireGestor, (req, res) => profilesController.resetPassword(req, res));
