import { Router } from 'express';
import multer from 'multer';
import { profilesController } from '../controllers/profiles.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

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
profilesRouter.get('/', (req, res) => profilesController.getAll(req, res));
profilesRouter.get('/brokers', (req, res) => profilesController.getBrokers(req, res));
profilesRouter.post('/', requireGestor, (req, res) => profilesController.create(req, res));
profilesRouter.put('/:id', requireGestor, (req, res) => profilesController.update(req, res));
profilesRouter.delete('/:id', requireGestor, (req, res) => profilesController.delete(req, res));
profilesRouter.post('/:id/reset-password', requireGestor, (req, res) => profilesController.resetPassword(req, res));
profilesRouter.post('/:id/avatar', upload.single('avatar'), (req, res) => profilesController.uploadAvatar(req, res));
profilesRouter.delete('/:id/avatar', (req, res) => profilesController.removeAvatar(req, res));
