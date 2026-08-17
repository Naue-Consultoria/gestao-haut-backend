import { Router } from 'express';
import multer from 'multer';
import { profilesController } from '../controllers/profiles.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor, requireOwnerOrGestor } from '../middleware/roleGuard';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas'));
  },
});

export const profilesRouter = Router();

profilesRouter.use(authMiddleware);
profilesRouter.get('/', requireGestor, (req, res) => profilesController.getAll(req, res));
profilesRouter.get('/brokers', (req, res) => profilesController.getBrokers(req, res));
profilesRouter.post('/', requireGestor, (req, res) => profilesController.create(req, res));
profilesRouter.put('/:id', requireGestor, (req, res) => profilesController.update(req, res));
profilesRouter.delete('/:id', requireGestor, (req, res) => profilesController.delete(req, res));
profilesRouter.post('/:id/reset-password', requireGestor, (req, res) => profilesController.resetPassword(req, res));
// Cada um mexe na própria foto; o gestor mexe na de qualquer um pela tela de
// Usuários. Sem isso, qualquer usuário logado trocava a foto de outro só
// passando o id na URL. A guarda vem antes do multer para recusar o upload
// antes de receber os 5MB.
profilesRouter.post('/:id/avatar', requireOwnerOrGestor('id'), upload.single('avatar'), (req, res) => profilesController.uploadAvatar(req, res));
profilesRouter.delete('/:id/avatar', requireOwnerOrGestor('id'), (req, res) => profilesController.removeAvatar(req, res));
