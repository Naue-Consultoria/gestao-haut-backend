import { Router } from 'express';
import { parceriasController } from '../controllers/parcerias.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const parceriasRouter = Router();

parceriasRouter.use(authMiddleware);

// CRUD parcerias (gestor only)
parceriasRouter.get('/', (req, res) => parceriasController.getAll(req, res));
parceriasRouter.get('/active', (req, res) => parceriasController.getActive(req, res));
parceriasRouter.get('/broker/:brokerId', (req, res) => parceriasController.getByBrokerId(req, res));
parceriasRouter.get('/:id', (req, res) => parceriasController.getById(req, res));
parceriasRouter.post('/', requireGestor, (req, res) => parceriasController.create(req, res));
parceriasRouter.put('/:id', requireGestor, (req, res) => parceriasController.update(req, res));
parceriasRouter.put('/:id/membros', requireGestor, (req, res) => parceriasController.updateMembros(req, res));
parceriasRouter.delete('/:id', requireGestor, (req, res) => parceriasController.delete(req, res));

// Metas da parceria (gestor only para escrita)
parceriasRouter.get('/:id/metas', (req, res) => parceriasController.getMetas(req, res));
parceriasRouter.get('/:id/metas/:month', (req, res) => parceriasController.getMetaByMonth(req, res));
parceriasRouter.put('/:id/metas/bulk-vgv', requireGestor, (req, res) => parceriasController.bulkUpsertVgv(req, res));
parceriasRouter.put('/:id/metas/:month', requireGestor, (req, res) => parceriasController.upsertMeta(req, res));
