import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'corretor' | 'gestor';
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
  role: 'corretor' | 'gestor';
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
