import { supabaseAdmin } from '../config/supabase';
import { profilesService } from './profiles.service';

export class DashboardService {
  async getConsolidated(month: number, year: number) {
    const brokers = await profilesService.getBrokers();

    let totalVGV = 0;
    let totalCaptacoes = 0;
    let totalNegocios = 0;
    let totalTreinamentoHoras = 0;
    let totalInvestimento = 0;
    let totalPositivacoes = 0;
    let totalComissoes = 0;
    let metaVGV = 0;

    const brokerSummaries = await Promise.all(
      brokers.map(async (broker) => {
        // Get meta for this broker
        const { data: meta } = await supabaseAdmin
          .from('metas')
          .select('*')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year)
          .maybeSingle();

        // Accumulated VGV for the year up to this month
        const { data: positivacoes } = await supabaseAdmin
          .from('positivacoes')
          .select('vgv, comissao')
          .eq('broker_id', broker.id)
          .eq('year', year)
          .lte('month', month);

        const realizado = (positivacoes || []).reduce((sum, p) => sum + Number(p.vgv), 0);
        const comissoes = (positivacoes || []).reduce((sum, p) => sum + Number(p.comissao), 0);

        // Monthly data
        const { count: captCount } = await supabaseAdmin
          .from('captacoes')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { count: negCount } = await supabaseAdmin
          .from('negocios')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { data: treinamentos } = await supabaseAdmin
          .from('treinamentos')
          .select('horas')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { data: investimentos } = await supabaseAdmin
          .from('investimentos')
          .select('valor')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const treiHoras = (treinamentos || []).reduce((sum, t) => sum + Number(t.horas), 0);
        const invTotal = (investimentos || []).reduce((sum, i) => sum + Number(i.valor), 0);
        const metaAnual = meta?.vgv_anual || 0;
        const percentual = metaAnual > 0 ? realizado / metaAnual : 0;

        totalVGV += realizado;
        totalCaptacoes += (captCount || 0);
        totalNegocios += (negCount || 0);
        totalTreinamentoHoras += treiHoras;
        totalInvestimento += invTotal;
        totalPositivacoes += (positivacoes || []).length;
        totalComissoes += comissoes;
        metaVGV += metaAnual;

        return {
          id: broker.id,
          name: broker.name,
          team: broker.team,
          metaAnual,
          realizado,
          percentual,
          desvio: metaAnual - realizado,
        };
      })
    );

    return {
      totalVGV,
      totalCaptacoes,
      totalNegocios,
      totalTreinamentoHoras,
      totalInvestimento,
      totalPositivacoes,
      totalComissoes,
      metaVGV,
      brokers: brokerSummaries,
    };
  }

  async getIndividual(brokerId: string, month: number, year: number) {
    const { data: broker } = await supabaseAdmin
      .from('profiles')
      .select('id, name, team')
      .eq('id', brokerId)
      .single();

    if (!broker) throw new Error('Corretor não encontrado');

    const { data: meta } = await supabaseAdmin
      .from('metas')
      .select('*')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    const { data: positivacoes } = await supabaseAdmin
      .from('positivacoes')
      .select('vgv, comissao')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year);

    const { data: captacoes } = await supabaseAdmin
      .from('captacoes')
      .select('exclusivo')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year);

    const { data: negocios } = await supabaseAdmin
      .from('negocios')
      .select('vgv')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year);

    const { data: treinamentos } = await supabaseAdmin
      .from('treinamentos')
      .select('horas')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year);

    const { data: investimentos } = await supabaseAdmin
      .from('investimentos')
      .select('valor')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year);

    const { data: comentario } = await supabaseAdmin
      .from('comentarios')
      .select('texto')
      .eq('broker_id', brokerId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    const vgvRealizado = (positivacoes || []).reduce((s, p) => s + Number(p.vgv), 0);
    const comissaoTotal = (positivacoes || []).reduce((s, p) => s + Number(p.comissao), 0);
    const captExclusivas = (captacoes || []).filter(c => c.exclusivo === 'SIM').length;
    const negociosVGV = (negocios || []).reduce((s, n) => s + Number(n.vgv), 0);
    const treinamentoHoras = (treinamentos || []).reduce((s, t) => s + Number(t.horas), 0);
    const investimentoValor = (investimentos || []).reduce((s, i) => s + Number(i.valor), 0);

    return {
      broker,
      vgvRealizado,
      metaVGVMensal: meta?.vgv_mensal || 0,
      captacoes: (captacoes || []).length,
      metaCaptacoes: meta?.captacoes || 0,
      captExclusivas,
      metaCaptExclusivas: meta?.capt_exclusivas || 0,
      negociosVGV,
      metaNegocios: meta?.negocios || 0,
      treinamentoHoras,
      metaTreinamento: meta?.treinamento || 0,
      investimentoValor,
      metaInvestimento: meta?.investimento || 0,
      positivacoes: (positivacoes || []).length,
      metaPositivacao: meta?.positivacao || 0,
      comissaoTotal,
      comentario: comentario?.texto,
    };
  }

  async getRanking(month: number, year: number) {
    const brokers = await profilesService.getBrokers();

    const rankings = await Promise.all(
      brokers.map(async (broker) => {
        const { data: positivacoes } = await supabaseAdmin
          .from('positivacoes')
          .select('vgv')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { count: captCount } = await supabaseAdmin
          .from('captacoes')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { count: negCount } = await supabaseAdmin
          .from('negocios')
          .select('*', { count: 'exact', head: true })
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { data: treinamentos } = await supabaseAdmin
          .from('treinamentos')
          .select('horas')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const { data: investimentos } = await supabaseAdmin
          .from('investimentos')
          .select('valor')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year);

        const vgvRealizado = (positivacoes || []).reduce((s, p) => s + Number(p.vgv), 0);
        const treinamentoHoras = (treinamentos || []).reduce((s, t) => s + Number(t.horas), 0);
        const investimento = (investimentos || []).reduce((s, i) => s + Number(i.valor), 0);

        return {
          brokerId: broker.id,
          name: broker.name,
          team: broker.team,
          vgvRealizado,
          captacoes: captCount || 0,
          negocios: negCount || 0,
          treinamentoHoras,
          investimento,
          positivacoes: (positivacoes || []).length,
        };
      })
    );

    // Sort by VGV descending
    rankings.sort((a, b) => b.vgvRealizado - a.vgvRealizado);

    return rankings.map((r, i) => ({ ...r, position: i + 1 }));
  }
}

export const dashboardService = new DashboardService();
