import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório'),
  team: z.string().min(1, 'Equipe é obrigatória'),
  role: z.enum(['corretor', 'gestor']).default('corretor'),
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  team: z.string().optional(),
  role: z.enum(['corretor', 'gestor']).optional(),
  active: z.boolean().optional(),
});

export const positivacaoSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020),
  oportunidade: z.string().min(1, 'Oportunidade é obrigatória'),
  parceria: z.string().default('NÃO'),
  vgv: z.number().min(0).default(0),
  comissao: z.number().min(0).default(0),
});

export const captacaoSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020),
  oportunidade: z.string().min(1, 'Oportunidade é obrigatória'),
  exclusivo: z.string().default('NÃO'),
  origem: z.enum(['RELACIONAMENTO', 'PATROCINADO', 'CORRETOR_EXTERNO', 'CORRETOR_INTERNO', 'PORTAL']).default('RELACIONAMENTO'),
  vgv: z.number().min(0).default(0),
});

export const negocioSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020),
  oportunidade: z.string().min(1, 'Oportunidade é obrigatória'),
  origem: z.enum(['RELACIONAMENTO', 'PATROCINADO', 'CORRETOR_EXTERNO', 'CORRETOR_INTERNO', 'PORTAL']).default('RELACIONAMENTO'),
  vgv: z.number().min(0).default(0),
});

export const treinamentoSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020),
  atividade: z.string().min(1, 'Atividade é obrigatória'),
  local: z.string().default(''),
  horas: z.number().min(0).default(0),
});

export const investimentoSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020),
  tipo: z.enum(['PORTAL', 'PATROCINADO', 'CURSO', 'NETWORKING', 'PRESENTE_CLIENTE', 'BRINDE', 'OUTRO']).default('OUTRO'),
  produto: z.string().default(''),
  valor: z.number().min(0).default(0),
  leads: z.number().int().min(0).default(0),
});

export const metaSchema = z.object({
  vgv_anual: z.number().min(0).default(0),
  vgv_mensal: z.number().min(0).default(0),
  captacoes: z.number().int().min(0).default(0),
  capt_exclusivas: z.number().int().min(0).default(0),
  negocios: z.number().min(0).default(0),
  treinamento: z.number().min(0).default(0),
  investimento: z.number().min(0).default(0),
  positivacao: z.number().min(0).default(0),
});

export const comentarioSchema = z.object({
  texto: z.string().min(1, 'Texto é obrigatório'),
});

export const planoAcaoSchema = z.object({
  texto: z.string().min(1, 'Texto é obrigatório'),
  prazo: z.string().default(''),
  status: z.enum(['PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO']).default('PLANEJADO'),
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2020),
});

export const monthYearQuery = z.object({
  month: z.coerce.number().int().min(0).max(11).optional(),
  year: z.coerce.number().int().min(2020).optional(),
  brokerId: z.string().uuid().optional(),
});
