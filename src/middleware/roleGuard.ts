import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';

export function requireGestor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'gestor') {
    res.status(403).json({ success: false, error: 'Acesso restrito a gestores' });
    return;
  }
  next();
}

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
