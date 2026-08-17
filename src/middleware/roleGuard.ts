import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';

/**
 * Só o diretor. Usado no que é global por natureza: cadastro de usuários,
 * parcerias (que cruzam equipes) e qualquer coisa sem recorte de equipe.
 */
export function requireGestor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'gestor') {
    res.status(403).json({ success: false, error: 'Acesso restrito a gestores' });
    return;
  }
  next();
}

/**
 * Diretor ou gerente. Libera a rota; o recorte por equipe do gerente é aplicado
 * no controller via os helpers de `utils/scope`.
 */
export function requireGestao(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'gestor' && req.userRole !== 'gerente') {
    res.status(403).json({ success: false, error: 'Acesso restrito a gestores e gerentes' });
    return;
  }
  next();
}

/**
 * Dono do recurso ou diretor. Deliberadamente NÃO inclui o gerente: serve para
 * o que é pessoal (a própria foto), não para dados da equipe. Para escopo de
 * equipe use `requireGestao` + os helpers de `utils/scope`.
 */
export function requireOwnerOrGestor(brokerIdParam = 'brokerId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const brokerId = req.params[brokerIdParam] || req.body.broker_id || req.query.brokerId;
    if (req.userRole === 'gestor') {
      next();
      return;
    }
    if (brokerId && brokerId !== req.userId) {
      res.status(403).json({ success: false, error: 'Acesso negado' });
      return;
    }
    next();
  };
}
