export type UserRole = 'corretor' | 'gestor';
export type OrigemType = 'RELACIONAMENTO' | 'PATROCINADO' | 'CORRETOR_EXTERNO' | 'CORRETOR_INTERNO' | 'PORTAL';
export type InvestimentoType = 'PORTAL' | 'PATROCINADO' | 'CURSO' | 'NETWORKING' | 'PRESENTE_CLIENTE' | 'BRINDE' | 'OUTRO';

export interface Profile {
  id: string;
  name: string;
  email: string;
  team: string;
  role: UserRole;
  active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface Meta {
  id: string;
  broker_id: string;
  month: number;
  year: number;
  vgv_anual: number;
  vgv_mensal: number;
  captacoes: number;
  capt_exclusivas: number;
  negocios: number;
  treinamento: number;
  investimento: number;
  positivacao: number;
  created_at: string;
  updated_at: string;
}

export interface Positivacao {
  id: string;
  broker_id: string;
  month: number;
  year: number;
  oportunidade: string;
  parceria: string;
  vgv: number;
  comissao: number;
  created_at: string;
}

export interface Captacao {
  id: string;
  broker_id: string;
  month: number;
  year: number;
  oportunidade: string;
  exclusivo: string;
  origem: OrigemType;
  vgv: number;
  created_at: string;
}

export interface Negocio {
  id: string;
  broker_id: string;
  month: number;
  year: number;
  oportunidade: string;
  origem: OrigemType;
  vgv: number;
  created_at: string;
}

export interface Treinamento {
  id: string;
  broker_id: string;
  month: number;
  year: number;
  atividade: string;
  local: string;
  horas: number;
  created_at: string;
}

export interface Investimento {
  id: string;
  broker_id: string;
  month: number;
  year: number;
  tipo: InvestimentoType;
  produto: string;
  valor: number;
  leads: number;
  created_at: string;
}

export interface Comentario {
  id: string;
  broker_id: string;
  gestor_id: string;
  month: number;
  year: number;
  texto: string;
  created_at: string;
  updated_at: string;
}
