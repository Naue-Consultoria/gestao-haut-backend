import { Router } from 'express';
import { parceriasController } from '../controllers/parcerias.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';
import { requireParceriaScope } from '../middleware/parceriaScope';

export const parceriasRouter = Router();

parceriasRouter.use(authMiddleware);

// CRUD parcerias (gestor only)
parceriasRouter.get('/', (req, res) => parceriasController.getAll(req, res));
parceriasRouter.get('/active', (req, res) => parceriasController.getActive(req, res));
parceriasRouter.get('/broker/:brokerId', (req, res) => parceriasController.getByBrokerId(req, res));
parceriasRouter.get('/:id', requireParceriaScope(), (req, res) => parceriasController.getById(req, res));
parceriasRouter.post('/', requireGestor, (req, res) => parceriasController.create(req, res));
parceriasRouter.put('/:id', requireGestor, (req, res) => parceriasController.update(req, res));
parceriasRouter.put('/:id/membros', requireGestor, (req, res) => parceriasController.updateMembros(req, res));
parceriasRouter.delete('/comentarios/:id', requireGestor, (req, res) => parceriasController.deleteComentario(req, res));
parceriasRouter.delete('/planos-acao/:id', requireGestor, (req, res) => parceriasController.deletePlanoAcao(req, res));
parceriasRouter.put('/planos-acao/:id', requireGestor, (req, res) => parceriasController.updatePlanoAcao(req, res));
parceriasRouter.delete('/:id', requireGestor, (req, res) => parceriasController.delete(req, res));

// Metas da parceria (gestor only para escrita)
parceriasRouter.get('/:id/metas', requireParceriaScope(), (req, res) => parceriasController.getMetas(req, res));
parceriasRouter.get('/:id/metas/:month', requireParceriaScope(), (req, res) => parceriasController.getMetaByMonth(req, res));
parceriasRouter.put('/:id/metas/bulk-vgv', requireGestor, (req, res) => parceriasController.bulkUpsertVgv(req, res));
parceriasRouter.put('/:id/metas/:month', requireGestor, (req, res) => parceriasController.upsertMeta(req, res));

// Comentários da parceria (gestor only para escrita)
parceriasRouter.get('/:id/comentarios', requireParceriaScope(), (req, res) => parceriasController.getComentarios(req, res));
parceriasRouter.get('/:id/comentarios/:month', requireParceriaScope(), (req, res) => parceriasController.getComentarioByMonth(req, res));
parceriasRouter.put('/:id/comentarios/:month', requireGestor, (req, res) => parceriasController.upsertComentario(req, res));

// Planos de Ação da parceria (gestor only para escrita)
parceriasRouter.get('/:id/planos-acao', requireParceriaScope(), (req, res) => parceriasController.getPlanosAcao(req, res));
parceriasRouter.get('/:id/planos-acao/:month', requireParceriaScope(), (req, res) => parceriasController.getPlanosAcaoByMonth(req, res));
parceriasRouter.post('/:id/planos-acao', requireGestor, (req, res) => parceriasController.createPlanoAcao(req, res));
