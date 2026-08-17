import { Request } from 'express';
import { UserRole } from './index';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  /** Equipe do usuário — base do escopo do gerente. */
  userTeam?: string;
  accessToken?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  team: string;
  role: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total?: number;
}

export interface DashboardConsolidated {
  totalVGV: number;
  totalCaptacoes: number;
  totalNegocios: number;
  totalTreinamentoHoras: number;
  totalInvestimento: number;
  totalPositivacoes: number;
  totalComissoes: number;
  metaVGV: number;
  brokers: BrokerSummary[];
}

export interface BrokerSummary {
  id: string;
  name: string;
  team: string;
  metaAnual: number;
  realizado: number;
  percentual: number;
  desvio: number;
}

export interface DashboardIndividual {
  broker: { id: string; name: string; team: string };
  vgvRealizado: number;
  metaVGVMensal: number;
  captacoes: number;
  metaCaptacoes: number;
  captExclusivas: number;
  metaCaptExclusivas: number;
  negociosVGV: number;
  metaNegocios: number;
  treinamentoHoras: number;
  metaTreinamento: number;
  investimentoValor: number;
  metaInvestimento: number;
  positivacoes: number;
  metaPositivacao: number;
  comissaoTotal: number;
  comentario?: string;
}

export interface RankingItem {
  position: number;
  brokerId: string;
  name: string;
  team: string;
  vgvRealizado: number;
  captacoes: number;
  negocios: number;
  treinamentoHoras: number;
  investimento: number;
  positivacoes: number;
}

export type RoiEntry = {
  brokerId: string;
  brokerName: string;
  /** Comissão do corretor no período — não o VGV da venda. */
  receita: number;
  investimento: number;
  roi: number | null;
};

export interface MapaAmbicao {
  id: string;
  broker_id: string;
  dados: Record<string, unknown>;
  status: 'vazio' | 'parcial' | 'preenchido';
  created_at: string;
  updated_at: string;
}

// Item de listagem pro gestor — inclui corretores sem mapa (has_mapa=false).
export interface MapaAmbicaoSummary {
  broker_id: string;
  broker_name: string;
  status: 'vazio' | 'parcial' | 'preenchido';
  updated_at: string | null;
  has_mapa: boolean;
}
