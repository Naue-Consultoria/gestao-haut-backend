import { supabaseAdmin } from '../config/supabase';
import { profilesService } from './profiles.service';
import { parceriasService } from './parcerias.service';

// Helper: aggregate activity data for multiple broker IDs (optimized: 5 queries total using .in())
async function aggregateBrokerData(brokerIds: string[], month: number, year: number) {
  const [positivacoes, captacoes, negocios, treinamentos, investimentos] = await Promise.all([
    supabaseAdmin.from('positivacoes').select('vgv, comissao').in('broker_id', brokerIds).eq('month', month).eq('year', year),
    supabaseAdmin.from('captacoes').select('exclusivo').in('broker_id', brokerIds).eq('month', month).eq('year', year),
    supabaseAdmin.from('negocios').select('vgv').in('broker_id', brokerIds).eq('month', month).eq('year', year),
    supabaseAdmin.from('treinamentos').select('horas').in('broker_id', brokerIds).eq('month', month).eq('year', year),
    supabaseAdmin.from('investimentos').select('valor').in('broker_id', brokerIds).eq('month', month).eq('year', year),
  ]);

  const p = positivacoes.data || [];
  const c = captacoes.data || [];
  const n = negocios.data || [];
  const t = treinamentos.data || [];
  const inv = investimentos.data || [];

  return {
    vgvRealizado: p.reduce((s, r) => s + Number(r.vgv), 0),
    comissaoTotal: p.reduce((s, r) => s + Number(r.comissao), 0),
    positivacoesCount: p.length,
    captacoesCount: c.length,
    captExclusivas: c.filter(r => r.exclusivo === 'SIM').length,
    negociosCount: n.length,
    negociosVGV: n.reduce((s, r) => s + Number(r.vgv), 0),
    treinamentoHoras: t.reduce((s, r) => s + Number(r.horas), 0),
    investimentoValor: inv.reduce((s, r) => s + Number(r.valor), 0),
  };
}

// Helper: aggregate activity data for multiple broker IDs across all months of a year (optimized: 5 queries total)
async function aggregateBrokerDataYearly(brokerIds: string[], year: number) {
  const [positivacoes, captacoes, negocios, treinamentos, investimentos] = await Promise.all([
    supabaseAdmin.from('positivacoes').select('vgv, comissao').in('broker_id', brokerIds).eq('year', year),
    supabaseAdmin.from('captacoes').select('exclusivo').in('broker_id', brokerIds).eq('year', year),
    supabaseAdmin.from('negocios').select('vgv').in('broker_id', brokerIds).eq('year', year),
    supabaseAdmin.from('treinamentos').select('horas').in('broker_id', brokerIds).eq('year', year),
    supabaseAdmin.from('investimentos').select('valor').in('broker_id', brokerIds).eq('year', year),
  ]);

  const p = positivacoes.data || [];
  const c = captacoes.data || [];
  const n = negocios.data || [];
  const t = treinamentos.data || [];
  const inv = investimentos.data || [];

  return {
    vgvRealizado: p.reduce((s, r) => s + Number(r.vgv), 0),
    comissaoTotal: p.reduce((s, r) => s + Number(r.comissao), 0),
    positivacoesCount: p.length,
    captacoesCount: c.length,
    captExclusivas: c.filter(r => r.exclusivo === 'SIM').length,
    negociosCount: n.length,
    negociosVGV: n.reduce((s, r) => s + Number(r.vgv), 0),
    treinamentoHoras: t.reduce((s, r) => s + Number(r.horas), 0),
    investimentoValor: inv.reduce((s, r) => s + Number(r.valor), 0),
  };
}

// Helper: aggregate yearly positivacoes for multiple broker IDs
async function aggregateYearlyVGV(brokerIds: string[], year: number, upToMonth: number) {
  let totalRealizado = 0;
  let totalComissoes = 0;
  let totalCount = 0;
  for (const brokerId of brokerIds) {
    const { data } = await supabaseAdmin
      .from('positivacoes')
      .select('vgv, comissao')
      .eq('broker_id', brokerId)
      .eq('year', year)
      .lte('month', upToMonth);
    totalRealizado += (data || []).reduce((s, p) => s + Number(p.vgv), 0);
    totalComissoes += (data || []).reduce((s, p) => s + Number(p.comissao), 0);
    totalCount += (data || []).length;
  }
  return { totalRealizado, totalComissoes, totalCount };
}

export class DashboardService {
  // Build a map: brokerId -> parceriaId (for active parcerias only)
  private async buildParceriaMap(): Promise<{ parceriaMap: Map<string, string>; parcerias: any[] }> {
    const rawParcerias = await parceriasService.getActive();
    const parcerias: any[] = rawParcerias as any[];
    const parceriaMap = new Map<string, string>();
    for (const p of parcerias) {
      for (const m of (p.parceria_membros || [])) {
        parceriaMap.set(m.broker_id, p.id);
      }
    }
    return { parceriaMap, parcerias };
  }

  async getConsolidated(month: number, year: number) {
    const brokers = await profilesService.getBrokers();
    const { parceriaMap, parcerias } = await this.buildParceriaMap();

    let totalVGV = 0;
    let totalCaptacoes = 0;
    let totalNegocios = 0;
    let totalTreinamentoHoras = 0;
    let totalInvestimento = 0;
    let totalPositivacoes = 0;
    let totalComissoes = 0;
    let metaVGV = 0;

    const processedParcerias = new Set<string>();
    const brokerSummaries: any[] = [];

    for (const broker of brokers) {
      const parceriaId = parceriaMap.get(broker.id);

      if (parceriaId) {
        // Skip if we already processed this partnership
        if (processedParcerias.has(parceriaId)) continue;
        processedParcerias.add(parceriaId);

        const parceria = parcerias.find(p => p.id === parceriaId);
        const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
        const memberNames = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

        // Partnership meta
        const { data: meta } = await supabaseAdmin
          .from('metas_parceria')
          .select('*')
          .eq('parceria_id', parceriaId)
          .eq('month', month)
          .eq('year', year)
          .maybeSingle();

        const { totalRealizado: realizado, totalComissoes: comissoes, totalCount } = await aggregateYearlyVGV(memberIds, year, month);
        const activity = await aggregateBrokerData(memberIds, month, year);

        const metaAnual = meta?.vgv_anual || 0;
        const percentual = metaAnual > 0 ? realizado / metaAnual : 0;

        totalVGV += realizado;
        totalCaptacoes += activity.captacoesCount;
        totalNegocios += activity.negociosCount;
        totalTreinamentoHoras += activity.treinamentoHoras;
        totalInvestimento += activity.investimentoValor;
        totalPositivacoes += totalCount;
        totalComissoes += comissoes;
        metaVGV += metaAnual;

        brokerSummaries.push({
          id: parceriaId,
          name: parceria.nome,
          team: memberNames.join(' + '),
          metaAnual,
          realizado,
          percentual,
          desvio: metaAnual - realizado,
          isParceria: true,
        });
      } else {
        // Solo broker - original logic
        const { data: meta } = await supabaseAdmin
          .from('metas')
          .select('*')
          .eq('broker_id', broker.id)
          .eq('month', month)
          .eq('year', year)
          .maybeSingle();

        const { data: positivacoes } = await supabaseAdmin
          .from('positivacoes')
          .select('vgv, comissao')
          .eq('broker_id', broker.id)
          .eq('year', year)
          .lte('month', month);

        const realizado = (positivacoes || []).reduce((sum, p) => sum + Number(p.vgv), 0);
        const comissoes = (positivacoes || []).reduce((sum, p) => sum + Number(p.comissao), 0);

        const activity = await aggregateBrokerData([broker.id], month, year);

        const metaAnual = meta?.vgv_anual || 0;
        const percentual = metaAnual > 0 ? realizado / metaAnual : 0;

        totalVGV += realizado;
        totalCaptacoes += activity.captacoesCount;
        totalNegocios += activity.negociosCount;
        totalTreinamentoHoras += activity.treinamentoHoras;
        totalInvestimento += activity.investimentoValor;
        totalPositivacoes += (positivacoes || []).length;
        totalComissoes += comissoes;
        metaVGV += metaAnual;

        brokerSummaries.push({
          id: broker.id,
          name: broker.name,
          team: broker.team,
          metaAnual,
          realizado,
          percentual,
          desvio: metaAnual - realizado,
          isParceria: false,
        });
      }
    }

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
    // Check if broker is in a partnership
    const parceria = await parceriasService.getByBrokerId(brokerId);

    if (parceria) {
      // Partnership mode: aggregate all members - optimized: parallel queries
      const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
      const memberNames = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

      const [metaResult, activity, comentariosResult] = await Promise.all([
        supabaseAdmin.from('metas_parceria').select('*').eq('parceria_id', parceria.id).eq('month', month).eq('year', year).maybeSingle(),
        aggregateBrokerData(memberIds, month, year),
        supabaseAdmin.from('comentarios').select('texto').in('broker_id', memberIds).eq('month', month).eq('year', year),
      ]);

      const meta = metaResult.data;
      const comentario = comentariosResult.data && comentariosResult.data.length > 0 ? comentariosResult.data[0].texto : undefined;

      return {
        broker: {
          id: parceria.id,
          name: parceria.nome,
          team: memberNames.join(' + '),
        },
        isParceria: true,
        parceriaId: parceria.id,
        vgvRealizado: activity.vgvRealizado,
        metaVGVMensal: meta?.vgv_mensal || 0,
        captacoes: activity.captacoesCount,
        metaCaptacoes: meta?.captacoes || 0,
        captExclusivas: activity.captExclusivas,
        metaCaptExclusivas: meta?.capt_exclusivas || 0,
        negociosVGV: activity.negociosVGV,
        metaNegocios: meta?.negocios || 0,
        treinamentoHoras: activity.treinamentoHoras,
        metaTreinamento: meta?.treinamento || 0,
        investimentoValor: activity.investimentoValor,
        metaInvestimento: meta?.investimento || 0,
        positivacoes: activity.positivacoesCount,
        metaPositivacao: meta?.positivacao || 0,
        comissaoTotal: activity.comissaoTotal,
        comentario,
      };
    }

    // Solo broker - optimized: parallel queries
    const [brokerResult, metaResult, activity, comentarioResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, name, team').eq('id', brokerId).single(),
      supabaseAdmin.from('metas').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year).maybeSingle(),
      aggregateBrokerData([brokerId], month, year),
      supabaseAdmin.from('comentarios').select('texto').eq('broker_id', brokerId).eq('month', month).eq('year', year).maybeSingle(),
    ]);

    const broker = brokerResult.data;
    if (!broker) throw new Error('Corretor não encontrado');
    const meta = metaResult.data;
    const comentario = comentarioResult.data;

    return {
      broker,
      isParceria: false,
      vgvRealizado: activity.vgvRealizado,
      metaVGVMensal: meta?.vgv_mensal || 0,
      captacoes: activity.captacoesCount,
      metaCaptacoes: meta?.captacoes || 0,
      captExclusivas: activity.captExclusivas,
      metaCaptExclusivas: meta?.capt_exclusivas || 0,
      negociosVGV: activity.negociosVGV,
      metaNegocios: meta?.negocios || 0,
      treinamentoHoras: activity.treinamentoHoras,
      metaTreinamento: meta?.treinamento || 0,
      investimentoValor: activity.investimentoValor,
      metaInvestimento: meta?.investimento || 0,
      positivacoes: activity.positivacoesCount,
      metaPositivacao: meta?.positivacao || 0,
      comissaoTotal: activity.comissaoTotal,
      comentario: comentario?.texto,
    };
  }

  async getConsolidatedEvolution(year: number) {
    const { data: metas } = await supabaseAdmin
      .from('metas')
      .select('month, vgv_mensal')
      .eq('year', year);

    const { data: metasParceria } = await supabaseAdmin
      .from('metas_parceria')
      .select('month, vgv_mensal')
      .eq('year', year);

    const { data: positivacoes } = await supabaseAdmin
      .from('positivacoes')
      .select('month, vgv')
      .eq('year', year);

    // We need to exclude individual metas for brokers who are in partnerships
    const { parceriaMap } = await this.buildParceriaMap();

    const metaMap = new Map<number, number>();

    // Add partnership metas
    for (const m of metasParceria || []) {
      metaMap.set(m.month, (metaMap.get(m.month) || 0) + (Number(m.vgv_mensal) || 0));
    }

    // Add solo broker metas (skip those in partnerships)
    // We need broker_id to filter - fetch with broker_id
    const { data: metasWithBroker } = await supabaseAdmin
      .from('metas')
      .select('month, vgv_mensal, broker_id')
      .eq('year', year);

    for (const m of metasWithBroker || []) {
      if (!parceriaMap.has(m.broker_id)) {
        metaMap.set(m.month, (metaMap.get(m.month) || 0) + (Number(m.vgv_mensal) || 0));
      }
    }

    const realizadoMap = new Map<number, number>();
    for (const p of positivacoes || []) {
      realizadoMap.set(p.month, (realizadoMap.get(p.month) || 0) + Number(p.vgv));
    }

    return Array.from({ length: 12 }, (_, i) => ({
      month: i,
      meta: metaMap.get(i) || 0,
      realizado: realizadoMap.get(i) || 0,
    }));
  }

  async getYearlyEvolution(brokerId: string, year: number) {
    // Check if broker is in a partnership
    const parceria = await parceriasService.getByBrokerId(brokerId);

    if (parceria) {
      const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);

      // Partnership metas
      const { data: metas } = await supabaseAdmin
        .from('metas_parceria')
        .select('month, vgv_mensal')
        .eq('parceria_id', parceria.id)
        .eq('year', year);

      const metaMap = new Map<number, number>();
      for (const m of metas || []) {
        metaMap.set(m.month, Number(m.vgv_mensal) || 0);
      }

      // Aggregate positivacoes from all members
      const realizadoMap = new Map<number, number>();
      for (const memberId of memberIds) {
        const { data: positivacoes } = await supabaseAdmin
          .from('positivacoes')
          .select('month, vgv')
          .eq('broker_id', memberId)
          .eq('year', year);
        for (const p of positivacoes || []) {
          realizadoMap.set(p.month, (realizadoMap.get(p.month) || 0) + Number(p.vgv));
        }
      }

      return Array.from({ length: 12 }, (_, i) => ({
        month: i,
        meta: metaMap.get(i) || 0,
        realizado: realizadoMap.get(i) || 0,
      }));
    }

    // Solo broker - original logic
    const { data: metas } = await supabaseAdmin
      .from('metas')
      .select('month, vgv_mensal')
      .eq('broker_id', brokerId)
      .eq('year', year);

    const { data: positivacoes } = await supabaseAdmin
      .from('positivacoes')
      .select('month, vgv')
      .eq('broker_id', brokerId)
      .eq('year', year);

    const metaMap = new Map<number, number>();
    for (const m of metas || []) {
      metaMap.set(m.month, Number(m.vgv_mensal) || 0);
    }

    const realizadoMap = new Map<number, number>();
    for (const p of positivacoes || []) {
      realizadoMap.set(p.month, (realizadoMap.get(p.month) || 0) + Number(p.vgv));
    }

    return Array.from({ length: 12 }, (_, i) => ({
      month: i,
      meta: metaMap.get(i) || 0,
      realizado: realizadoMap.get(i) || 0,
    }));
  }

  async getRanking(month: number, year: number) {
    const brokers = await profilesService.getBrokers();
    const { parceriaMap, parcerias } = await this.buildParceriaMap();

    const processedParcerias = new Set<string>();
    const rankings: any[] = [];

    for (const broker of brokers) {
      const parceriaId = parceriaMap.get(broker.id);

      if (parceriaId) {
        if (processedParcerias.has(parceriaId)) continue;
        processedParcerias.add(parceriaId);

        const parceria = parcerias.find(p => p.id === parceriaId);
        const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
        const memberNames = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

        const activity = await aggregateBrokerData(memberIds, month, year);

        rankings.push({
          brokerId: parceriaId,
          name: parceria.nome,
          team: memberNames.join(' + '),
          vgvRealizado: activity.vgvRealizado,
          captacoes: activity.captacoesCount,
          negocios: activity.negociosCount,
          treinamentoHoras: activity.treinamentoHoras,
          investimento: activity.investimentoValor,
          positivacoes: activity.positivacoesCount,
          isParceria: true,
        });
      } else {
        const activity = await aggregateBrokerData([broker.id], month, year);

        rankings.push({
          brokerId: broker.id,
          name: broker.name,
          team: broker.team,
          vgvRealizado: activity.vgvRealizado,
          captacoes: activity.captacoesCount,
          negocios: activity.negociosCount,
          treinamentoHoras: activity.treinamentoHoras,
          investimento: activity.investimentoValor,
          positivacoes: activity.positivacoesCount,
          isParceria: false,
        });
      }
    }

    rankings.sort((a, b) => b.vgvRealizado - a.vgvRealizado);
    return rankings.map((r, i) => ({ ...r, position: i + 1 }));
  }

  async getIndividualYearly(brokerId: string, year: number) {
    const parceria = await parceriasService.getByBrokerId(brokerId);

    const reduceMetaTotals = (metas: any[]) => metas.reduce((acc, m) => ({
      vgv_mensal: acc.vgv_mensal + (Number(m.vgv_mensal) || 0),
      captacoes: acc.captacoes + (Number(m.captacoes) || 0),
      capt_exclusivas: acc.capt_exclusivas + (Number(m.capt_exclusivas) || 0),
      negocios: acc.negocios + (Number(m.negocios) || 0),
      treinamento: acc.treinamento + (Number(m.treinamento) || 0),
      investimento: acc.investimento + (Number(m.investimento) || 0),
      positivacao: acc.positivacao + (Number(m.positivacao) || 0),
    }), { vgv_mensal: 0, captacoes: 0, capt_exclusivas: 0, negocios: 0, treinamento: 0, investimento: 0, positivacao: 0 });

    if (parceria) {
      const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
      const memberNames = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

      const [metasResult, activity] = await Promise.all([
        supabaseAdmin.from('metas_parceria').select('*').eq('parceria_id', parceria.id).eq('year', year),
        aggregateBrokerDataYearly(memberIds, year),
      ]);

      const metaTotals = reduceMetaTotals(metasResult.data || []);

      return {
        broker: { id: parceria.id, name: parceria.nome, team: memberNames.join(' + ') },
        isParceria: true,
        vgvRealizado: activity.vgvRealizado,
        metaVGVAnual: metaTotals.vgv_mensal,
        captacoes: activity.captacoesCount,
        metaCaptacoes: metaTotals.captacoes,
        captExclusivas: activity.captExclusivas,
        metaCaptExclusivas: metaTotals.capt_exclusivas,
        negociosVGV: activity.negociosVGV,
        metaNegocios: metaTotals.negocios,
        treinamentoHoras: activity.treinamentoHoras,
        metaTreinamento: metaTotals.treinamento,
        investimentoValor: activity.investimentoValor,
        metaInvestimento: metaTotals.investimento,
        positivacoes: activity.positivacoesCount,
        metaPositivacao: metaTotals.positivacao,
        comissaoTotal: activity.comissaoTotal,
      };
    }

    // Solo broker - optimized: parallel queries
    const [brokerResult, metasResult, activity] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, name, team').eq('id', brokerId).single(),
      supabaseAdmin.from('metas').select('*').eq('broker_id', brokerId).eq('year', year),
      aggregateBrokerDataYearly([brokerId], year),
    ]);

    const broker = brokerResult.data;
    if (!broker) throw new Error('Corretor não encontrado');
    const metaTotals = reduceMetaTotals(metasResult.data || []);

    return {
      broker,
      isParceria: false,
      vgvRealizado: activity.vgvRealizado,
      metaVGVAnual: metaTotals.vgv_mensal,
      captacoes: activity.captacoesCount,
      metaCaptacoes: metaTotals.captacoes,
      captExclusivas: activity.captExclusivas,
      metaCaptExclusivas: metaTotals.capt_exclusivas,
      negociosVGV: activity.negociosVGV,
      metaNegocios: metaTotals.negocios,
      treinamentoHoras: activity.treinamentoHoras,
      metaTreinamento: metaTotals.treinamento,
      investimentoValor: activity.investimentoValor,
      metaInvestimento: metaTotals.investimento,
      positivacoes: activity.positivacoesCount,
      metaPositivacao: metaTotals.positivacao,
      comissaoTotal: activity.comissaoTotal,
    };
  }
}

export const dashboardService = new DashboardService();
