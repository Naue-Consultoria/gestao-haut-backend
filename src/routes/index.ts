import { Router } from 'express';
import { authRouter } from './auth.routes';
import { profilesRouter } from './profiles.routes';
import { metasRouter } from './metas.routes';
import { positivacoesRouter } from './positivacoes.routes';
import { captacoesRouter } from './captacoes.routes';
import { negociosRouter } from './negocios.routes';
import { treinamentosRouter } from './treinamentos.routes';
import { investimentosRouter } from './investimentos.routes';
import { comentariosRouter } from './comentarios.routes';
import { dashboardRouter } from './dashboard.routes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/profiles', profilesRouter);
router.use('/metas', metasRouter);
router.use('/positivacoes', positivacoesRouter);
router.use('/captacoes', captacoesRouter);
router.use('/negocios', negociosRouter);
router.use('/treinamentos', treinamentosRouter);
router.use('/investimentos', investimentosRouter);
router.use('/comentarios', comentariosRouter);
router.use('/dashboard', dashboardRouter);
