import { supabaseAdmin } from '../config/supabase';
import { parceriasService } from './parcerias.service';

// Helper: fetch and merge data from multiple broker IDs
async function fetchMultiple(table: string, brokerIds: string[], month: number, year: number, selectFields = '*') {
  const results = await Promise.all(
    brokerIds.map(id =>
      supabaseAdmin.from(table).select(selectFields).eq('broker_id', id).eq('month', month).eq('year', year)
    )
  );
  return results.flatMap(r => r.data || []);
}

async function fetchMultipleYear(table: string, brokerIds: string[], year: number, selectFields: string) {
  const results = await Promise.all(
    brokerIds.map(id =>
      supabaseAdmin.from(table).select(selectFields).eq('broker_id', id).eq('year', year)
    )
  );
  return results.flatMap(r => r.data || []);
}

function buildReport(
  brokerInfo: { name: string; team: string; avatar_url?: string | null },
  meta: any,
  positivacoes: any[],
  allPositivacoes: any[],
  captacoes: any[],
  negocios: any[],
  treinamentos: any[],
  investimentos: any[],
  comentario: any,
  planosAcao: any[],
  allMetas: any[],
) {
  const monthlyVgv = Array(12).fill(0);
  allPositivacoes.forEach(p => { monthlyVgv[p.month] += Number(p.vgv); });

  const monthlyMeta = Array(12).fill(0);
  allMetas.forEach(m => { monthlyMeta[m.month] = Number(m.vgv_mensal); });

  const vgvRealizado = positivacoes.reduce((s, p) => s + Number(p.vgv), 0);
  const comissaoTotal = positivacoes.reduce((s, p) => s + Number(p.comissao), 0);
  const negociosVgvTotal = negocios.reduce((s, n) => s + Number(n.vgv), 0);
  const treinamentoHoras = treinamentos.reduce((s, t) => s + Number(t.horas), 0);
  const investimentoTotal = investimentos.reduce((s, i) => s + Number(i.valor), 0);
  const investimentoLeads = investimentos.reduce((s, i) => s + Number(i.leads), 0);
  const captExclusivas = captacoes.filter(c => c.exclusivo === 'SIM').length;
  const vgvAcumuladoAno = allPositivacoes.reduce((s, p) => s + Number(p.vgv), 0);
  const taxaPositivacao = negociosVgvTotal > 0 ? (vgvRealizado / negociosVgvTotal) * 100 : 0;

  let gestorName = 'Gestor';
  if (comentario?.profiles) {
    const profiles = comentario.profiles as unknown as { name: string } | { name: string }[];
    gestorName = Array.isArray(profiles) ? profiles[0]?.name || 'Gestor' : profiles.name;
  }

  return {
    broker: { name: brokerInfo.name, team: brokerInfo.team, avatar_url: brokerInfo.avatar_url || null },
    meta: meta ? {
      vgv_anual: meta.vgv_anual || 0,
      vgv_mensal: meta.vgv_mensal || 0,
      captacoes: meta.captacoes || 0,
      capt_exclusivas: meta.capt_exclusivas || 0,
      negocios: meta.negocios || 0,
      treinamento: meta.treinamento || 0,
      investimento: meta.investimento || 0,
      positivacao: meta.positivacao || 0,
    } : null,
    totals: {
      vgvRealizado, comissaoTotal, negociosVgvTotal,
      negociosCount: negocios.length, treinamentoHoras,
      investimentoTotal, investimentoLeads,
      captacoesCount: captacoes.length, captExclusivas,
      vgvAcumuladoAno, taxaPositivacao,
    },
    positivacoes: positivacoes.map(p => ({ oportunidade: p.oportunidade, parceria: p.parceria, vgv: Number(p.vgv), comissao: Number(p.comissao) })),
    captacoes: captacoes.map(c => ({ oportunidade: c.oportunidade, exclusivo: c.exclusivo, origem: c.origem, vgv: Number(c.vgv) })),
    negocios: negocios.map(n => ({ oportunidade: n.oportunidade, origem: n.origem, vgv: Number(n.vgv) })),
    treinamentos: treinamentos.map(t => ({ atividade: t.atividade, local: t.local, horas: Number(t.horas) })),
    investimentos: investimentos.map(i => ({ tipo: i.tipo, produto: i.produto, valor: Number(i.valor), leads: Number(i.leads) })),
    comentario: comentario ? { texto: comentario.texto, gestorName } : null,
    planosAcao: planosAcao.map(p => ({ texto: p.texto, prazo: p.prazo, status: p.status })),
    monthlyVgv,
    monthlyMeta,
  };
}

export class ReportsService {
  async getBrokerReport(brokerId: string, month: number, year: number) {
    const { data: broker } = await supabaseAdmin
      .from('profiles')
      .select('id, name, team, role, avatar_url')
      .eq('id', brokerId)
      .single();

    if (!broker) throw new Error('Corretor não encontrado');

    const [
      metaResult, allMetasResult, positivacoesResult, allPositivacoesResult,
      captacoesResult, negociosResult, treinamentosResult, investimentosResult,
      comentarioResult, planosAcaoResult,
    ] = await Promise.all([
      supabaseAdmin.from('metas').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year).maybeSingle(),
      supabaseAdmin.from('metas').select('month, vgv_mensal').eq('broker_id', brokerId).eq('year', year),
      supabaseAdmin.from('positivacoes').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year),
      supabaseAdmin.from('positivacoes').select('month, vgv, comissao').eq('broker_id', brokerId).eq('year', year),
      supabaseAdmin.from('captacoes').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year),
      supabaseAdmin.from('negocios').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year),
      supabaseAdmin.from('treinamentos').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year),
      supabaseAdmin.from('investimentos').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year),
      supabaseAdmin.from('comentarios').select('texto, gestor_id, profiles!comentarios_gestor_id_fkey(name)').eq('broker_id', brokerId).eq('month', month).eq('year', year).maybeSingle(),
      supabaseAdmin.from('planos_acao').select('texto, prazo, status').eq('broker_id', brokerId).eq('month', month).eq('year', year),
    ]);

    return buildReport(
      { name: broker.name, team: broker.team, avatar_url: broker.avatar_url },
      metaResult.data,
      positivacoesResult.data || [],
      allPositivacoesResult.data || [],
      captacoesResult.data || [],
      negociosResult.data || [],
      treinamentosResult.data || [],
      investimentosResult.data || [],
      comentarioResult.data,
      planosAcaoResult.data || [],
      allMetasResult.data || [],
    );
  }

  async getParceriaReport(parceriaId: string, month: number, year: number) {
    const parceria = await parceriasService.getById(parceriaId);
    if (!parceria) throw new Error('Parceria não encontrada');

    const memberIds: string[] = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
    const memberNames: string[] = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

    // Fetch partnership meta
    const { data: meta } = await supabaseAdmin
      .from('metas_parceria')
      .select('*')
      .eq('parceria_id', parceriaId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    const { data: allMetas } = await supabaseAdmin
      .from('metas_parceria')
      .select('month, vgv_mensal')
      .eq('parceria_id', parceriaId)
      .eq('year', year);

    // Fetch activity data from all members
    const [positivacoes, allPositivacoes, captacoes, negocios, treinamentos, investimentos] = await Promise.all([
      fetchMultiple('positivacoes', memberIds, month, year),
      fetchMultipleYear('positivacoes', memberIds, year, 'month, vgv, comissao'),
      fetchMultiple('captacoes', memberIds, month, year),
      fetchMultiple('negocios', memberIds, month, year),
      fetchMultiple('treinamentos', memberIds, month, year),
      fetchMultiple('investimentos', memberIds, month, year),
    ]);

    // Fetch comments and action plans from any member
    const comentarios = await Promise.all(
      memberIds.map(id =>
        supabaseAdmin.from('comentarios').select('texto, gestor_id, profiles!comentarios_gestor_id_fkey(name)').eq('broker_id', id).eq('month', month).eq('year', year).maybeSingle()
      )
    );
    const comentario = comentarios.find(c => c.data)?.data || null;

    const planosResults = await Promise.all(
      memberIds.map(id =>
        supabaseAdmin.from('planos_acao').select('texto, prazo, status').eq('broker_id', id).eq('month', month).eq('year', year)
      )
    );
    const planosAcao = planosResults.flatMap(r => r.data || []);

    const memberAvatars: { name: string; avatar_url: string | null }[] = (parceria.parceria_membros || []).map((m: any) => ({
      name: m.broker?.name || '',
      avatar_url: m.broker?.avatar_url || null,
    }));

    const report = buildReport(
      { name: parceria.nome, team: memberNames.join(' + '), avatar_url: null },
      meta,
      positivacoes,
      allPositivacoes,
      captacoes,
      negocios,
      treinamentos,
      investimentos,
      comentario,
      planosAcao,
      allMetas || [],
    );

    return { ...report, isParceria: true, memberAvatars };
  }
}

export const reportsService = new ReportsService();
