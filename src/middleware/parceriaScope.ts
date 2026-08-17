import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api';
import { parceriasService } from '../services/parcerias.service';
import { managedBrokerIds } from '../utils/scope';

/**
 * Libera a parceria apenas se TODOS os membros estiverem no escopo do usuário.
 * Uma parceria com um pé em outra equipe é invisível para o gerente — senão ela
 * viraria um atalho para os números de quem ele não deveria enxergar.
 */
export function requireParceriaScope(paramName = 'id') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const scope = await managedBrokerIds(req);
      if (scope === null) {
        next();
        return;
      }
      const memberIds = await parceriasService.getMemberIds(req.params[paramName]);
      if (memberIds.length > 0 && memberIds.every(id => scope.includes(id))) {
        next();
        return;
      }
      res.status(403).json({ success: false, error: 'Acesso negado' });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  };
}

/** Mantém apenas as parcerias inteiramente contidas no escopo. */
export function filterParceriasByScope(parcerias: any[], scope: string[] | null): any[] {
  if (scope === null) return parcerias;
  return parcerias.filter(p => {
    const membros = p.parceria_membros || [];
    return membros.length > 0 && membros.every((m: any) => scope.includes(m.broker_id));
  });
}
