import { supabaseAdmin } from '../config/supabase';
import { parceriasService } from '../services/parcerias.service';
import { AuthenticatedRequest } from '../types/api';

/**
 * Escopo de visibilidade por papel.
 *
 * A convenção em todo o backend é: `null` significa "sem restrição" (o diretor
 * enxerga a empresa inteira) e um array significa "somente estes broker_ids".
 * Um array vazio é um escopo válido e legítimo — um gerente sem corretores na
 * equipe não enxerga ninguém, e é isso que queremos.
 */

/**
 * IDs de quem produz na equipe: corretores e gerentes ativos com aquele `team`.
 * O próprio gerente entra na lista — ele vende também, então precisa enxergar e
 * lançar os próprios dados. Equipe em branco não casa com ninguém.
 */
export async function teamBrokerIds(team?: string): Promise<string[]> {
  if (!team) return [];
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .in('role', ['corretor', 'gerente'])
    .eq('active', true)
    .eq('team', team);
  if (error) throw new Error(error.message);
  return (data || []).map(r => r.id);
}

/**
 * Corretores cujos dados o usuário pode ler e alterar.
 * - gestor (diretor): `null` — todos.
 * - gerente: a própria equipe, ele mesmo incluído (ele também vende).
 * - corretor: ele mesmo e, se estiver em parceria ativa, os demais membros
 *   (a parceria já compartilha lançamentos hoje).
 */
export async function managedBrokerIds(req: AuthenticatedRequest): Promise<string[] | null> {
  if (req.userRole === 'gestor') return null;
  if (req.userRole === 'gerente') return teamBrokerIds(req.userTeam);
  const parceria = await parceriasService.getByBrokerId(req.userId!);
  if (parceria) return (parceria.parceria_membros || []).map((m: any) => m.broker_id);
  return [req.userId!];
}

/** true se o usuário pode ler ou alterar os dados desse corretor. */
export async function canManageBroker(req: AuthenticatedRequest, brokerId: string): Promise<boolean> {
  const ids = await managedBrokerIds(req);
  return ids === null || ids.includes(brokerId);
}

/**
 * true se o usuário pode criar um lançamento NO NOME desse corretor.
 * Mais restrito que `canManageBroker`: um corretor em parceria enxerga e edita
 * os registros da parceria, mas não abre registros novos no nome do parceiro.
 */
export async function canCreateForBroker(req: AuthenticatedRequest, brokerId: string): Promise<boolean> {
  if (req.userRole === 'gestor') return true;
  if (req.userRole === 'gerente') return (await teamBrokerIds(req.userTeam)).includes(brokerId);
  return brokerId === req.userId;
}

/**
 * Escopo das telas de gestão (Painel Geral, Ranking, ROI, Relatórios, Mapas).
 * Corretor recebe escopo vazio: essas rotas são barradas antes por
 * `requireGestao`, e um escopo vazio garante que nada vaze se alguma escapar.
 */
export async function gestaoScope(req: AuthenticatedRequest): Promise<string[] | null> {
  if (req.userRole === 'gestor') return null;
  if (req.userRole === 'gerente') return teamBrokerIds(req.userTeam);
  return [];
}

/**
 * Membros da parceria ativa do corretor, ou `null` se ele não estiver em uma
 * parceria visível neste escopo.
 *
 * Uma parceria que atravessa a fronteira do escopo (um membro de outra equipe)
 * é tratada como inexistente: o corretor passa a ser agregado sozinho. Sem isso
 * o gerente veria o VGV somado de alguém que não é da equipe dele.
 */
export async function scopedPartnerIds(req: AuthenticatedRequest, brokerId: string): Promise<string[] | null> {
  const parceria = await parceriasService.getByBrokerId(brokerId);
  if (!parceria) return null;
  const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
  const scope = await managedBrokerIds(req);
  if (scope === null) return memberIds;
  return memberIds.every((id: string) => scope.includes(id)) ? memberIds : null;
}

/** Aplica o escopo a uma lista já carregada de corretores. */
export function filterByScope<T extends { id: string }>(items: T[], scope: string[] | null): T[] {
  if (scope === null) return items;
  const allowed = new Set(scope);
  return items.filter(i => allowed.has(i.id));
}
