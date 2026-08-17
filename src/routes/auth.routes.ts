import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';
import { requireGestor } from '../middleware/roleGuard';

export const authRouter = Router();

authRouter.post('/login', (req, res) => authController.login(req, res));

// O corpo aceita `role`, então sem guarda qualquer um se cadastrava como gestor
// (ou, agora, gerente). Nenhuma tela usa esta rota — o cadastro real é
// POST /profiles, que ainda marca `must_change_password`. Mantida só para não
// quebrar algum consumidor externo, mas agora restrita ao gestor.
authRouter.post('/register', authMiddleware, requireGestor, (req, res) => authController.register(req, res));
authRouter.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
authRouter.get('/me', authMiddleware, (req, res) => authController.me(req, res));
authRouter.post('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));
