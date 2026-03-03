import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', (req, res) => authController.login(req, res));
authRouter.post('/register', (req, res) => authController.register(req, res));
authRouter.post('/logout', authMiddleware, (req, res) => authController.logout(req, res));
authRouter.get('/me', authMiddleware, (req, res) => authController.me(req, res));
authRouter.post('/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));
