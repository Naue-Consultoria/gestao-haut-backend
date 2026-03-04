import { supabaseAdmin } from '../config/supabase';

export class ReportsService {
  async getBrokerReport(brokerId: string, month: number, year: number) {
    // Fetch broker profile
    const { data: broker } = await supabaseAdmin
      .from('profiles')
      .select('id, name, team, role, avatar_url')
      .eq('id', brokerId)
      .single();

    if (!broker) throw new Error('Corretor não encontrado');

    // Fetch all data in parallel
    const [
      metaResult,
      allMetasResult,
      positivacoesResult,
      allPositivacoesResult,
      captacoesResult,
      negociosResult,
      treinamentosResult,
      investimentosResult,
      comentarioResult,
      planosAcaoResult,
    ] = await Promise.all([
      // Meta for the selected month
      supabaseAdmin
        .from('metas')
        .select('*')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle(),
      // All metas for the year (for monthly meta chart)
      supabaseAdmin
        .from('metas')
        .select('month, vgv_mensal')
        .eq('broker_id', brokerId)
        .eq('year', year),
      // Positivacoes for the selected month
      supabaseAdmin
        .from('positivacoes')
        .select('*')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year),
      // All positivacoes for the year (for accumulated chart)
      supabaseAdmin
        .from('positivacoes')
        .select('month, vgv, comissao')
        .eq('broker_id', brokerId)
        .eq('year', year),
      // Captacoes for the selected month
      supabaseAdmin
        .from('captacoes')
        .select('*')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year),
      // Negocios for the selected month
      supabaseAdmin
        .from('negocios')
        .select('*')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year),
      // Treinamentos for the selected month
      supabaseAdmin
        .from('treinamentos')
        .select('*')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year),
      // Investimentos for the selected month
      supabaseAdmin
        .from('investimentos')
        .select('*')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year),
      // Comentario for the selected month
      supabaseAdmin
        .from('comentarios')
        .select('texto, gestor_id, profiles!comentarios_gestor_id_fkey(name)')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle(),
      // Planos de acao for the selected month
      supabaseAdmin
        .from('planos_acao')
        .select('texto, prazo, status')
        .eq('broker_id', brokerId)
        .eq('month', month)
        .eq('year', year),
    ]);

    const meta = metaResult.data;
    const positivacoes = positivacoesResult.data || [];
    const allPositivacoes = allPositivacoesResult.data || [];
    const captacoes = captacoesResult.data || [];
    const negocios = negociosResult.data || [];
    const treinamentos = treinamentosResult.data || [];
    const investimentos = investimentosResult.data || [];
    const comentario = comentarioResult.data;
    const planosAcao = planosAcaoResult.data || [];

    // Build monthly VGV arrays (12 months)
    const monthlyVgv = Array(12).fill(0);
    allPositivacoes.forEach(p => {
      monthlyVgv[p.month] += Number(p.vgv);
    });

    const monthlyMeta = Array(12).fill(0);
    (allMetasResult.data || []).forEach(m => {
      monthlyMeta[m.month] = Number(m.vgv_mensal);
    });

    // Calculate totals
    const vgvRealizado = positivacoes.reduce((s, p) => s + Number(p.vgv), 0);
    const comissaoTotal = positivacoes.reduce((s, p) => s + Number(p.comissao), 0);
    const negociosVgvTotal = negocios.reduce((s, n) => s + Number(n.vgv), 0);
    const treinamentoHoras = treinamentos.reduce((s, t) => s + Number(t.horas), 0);
    const investimentoTotal = investimentos.reduce((s, i) => s + Number(i.valor), 0);
    const investimentoLeads = investimentos.reduce((s, i) => s + Number(i.leads), 0);
    const captExclusivas = captacoes.filter(c => c.exclusivo === 'SIM').length;
    const vgvAcumuladoAno = allPositivacoes.reduce((s, p) => s + Number(p.vgv), 0);

    // Positivacao rate
    const taxaPositivacao = negociosVgvTotal > 0 ? (vgvRealizado / negociosVgvTotal) * 100 : 0;

    // Get gestor name from comentario
    let gestorName = 'Gestor';
    if (comentario?.profiles) {
      const profiles = comentario.profiles as unknown as { name: string } | { name: string }[];
      gestorName = Array.isArray(profiles) ? profiles[0]?.name || 'Gestor' : profiles.name;
    }

    return {
      broker: { name: broker.name, team: broker.team, avatar_url: broker.avatar_url || null },
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
        vgvRealizado,
        comissaoTotal,
        negociosVgvTotal,
        negociosCount: negocios.length,
        treinamentoHoras,
        investimentoTotal,
        investimentoLeads,
        captacoesCount: captacoes.length,
        captExclusivas,
        vgvAcumuladoAno,
        taxaPositivacao,
      },
      positivacoes: positivacoes.map(p => ({
        oportunidade: p.oportunidade,
        parceria: p.parceria,
        vgv: Number(p.vgv),
        comissao: Number(p.comissao),
      })),
      captacoes: captacoes.map(c => ({
        oportunidade: c.oportunidade,
        exclusivo: c.exclusivo,
        origem: c.origem,
        vgv: Number(c.vgv),
      })),
      negocios: negocios.map(n => ({
        oportunidade: n.oportunidade,
        origem: n.origem,
        vgv: Number(n.vgv),
      })),
      treinamentos: treinamentos.map(t => ({
        atividade: t.atividade,
        local: t.local,
        horas: Number(t.horas),
      })),
      investimentos: investimentos.map(i => ({
        tipo: i.tipo,
        produto: i.produto,
        valor: Number(i.valor),
        leads: Number(i.leads),
      })),
      comentario: comentario ? { texto: comentario.texto, gestorName } : null,
      planosAcao: planosAcao.map(p => ({
        texto: p.texto,
        prazo: p.prazo,
        status: p.status,
      })),
      monthlyVgv,
      monthlyMeta,
    };
  }
}

export const reportsService = new ReportsService();
