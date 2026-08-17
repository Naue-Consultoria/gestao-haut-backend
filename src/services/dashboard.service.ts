import { supabaseAdmin } from '../config/supabase';
import { profilesService } from './profiles.service';
import { parceriasService } from './parcerias.service';
import { filterByScope } from '../utils/scope';
import { RoiEntry } from '../types/api';

// Convenção de escopo em todos os métodos abaixo: `scope === null` = sem
// restrição (diretor); um array = somente estes broker_ids (gerente da equipe).

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
  private async buildParceriaMap(scope: string[] | null = null): Promise<{ parceriaMap: Map<string, string>; parcerias: any[] }> {
    const rawParcerias = await parceriasService.getActive();
    // Parceria que cruza a fronteira do escopo (algum membro de outra equipe) é
    // descartada: seus membros entram como corretores solo, senão o gerente veria
    // o VGV agregado de alguém de fora da equipe dele.
    const parcerias: any[] = (rawParcerias as any[]).filter(p => {
      if (scope === null) return true;
      const membros = p.parceria_membros || [];
      return membros.length > 0 && membros.every((m: any) => scope.includes(m.broker_id));
    });
    const parceriaMap = new Map<string, string>();
    for (const p of parcerias) {
      for (const m of (p.parceria_membros || [])) {
        parceriaMap.set(m.broker_id, p.id);
      }
    }
    return { parceriaMap, parcerias };
  }

  async getConsolidated(month: number, year: number, scope: string[] | null = null) {
    const brokers = filterByScope(await profilesService.getBrokers(), scope);
    const { parceriaMap, parcerias } = await this.buildParceriaMap(scope);

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

  /**
   * Parceria ativa do corretor, ou null se ela atravessar a fronteira do escopo.
   * Nesse caso o corretor é agregado sozinho, para não expor os números de um
   * parceiro de outra equipe.
   */
  private async scopedParceria(brokerId: string, scope: string[] | null): Promise<any | null> {
    const parceria = await parceriasService.getByBrokerId(brokerId);
    if (!parceria || scope === null) return parceria;
    const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
    return memberIds.every((id: string) => scope.includes(id)) ? parceria : null;
  }

  async getIndividual(brokerId: string, month: number, year: number, scope: string[] | null = null) {
    // Check if broker is in a partnership
    const parceria = await this.scopedParceria(brokerId, scope);

    if (parceria) {
      // Partnership mode: aggregate all members - optimized: parallel queries
      const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
      const memberNames = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

      const [metaResult, activity, comentariosResult, allMetasResult, prevPositivacoesResults] = await Promise.all([
        supabaseAdmin.from('metas_parceria').select('*').eq('parceria_id', parceria.id).eq('month', month).eq('year', year).maybeSingle(),
        aggregateBrokerData(memberIds, month, year),
        supabaseAdmin.from('comentarios').select('texto').in('broker_id', memberIds).eq('month', month).eq('year', year),
        supabaseAdmin.from('metas_parceria').select('vgv_mensal').eq('parceria_id', parceria.id).eq('year', year).lte('month', month),
        month > 0
          ? supabaseAdmin.from('positivacoes').select('vgv').in('broker_id', memberIds).eq('year', year).lt('month', month)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const meta = metaResult.data;
      const comentario = comentariosResult.data && comentariosResult.data.length > 0 ? comentariosResult.data[0].texto : undefined;

      // Cumulative meta: sum of all monthly targets up to this month minus what was already realized in previous months
      const metasCumulativas = (allMetasResult.data || []).reduce((s: number, m: any) => s + Number(m.vgv_mensal), 0);
      const realizadoAnterior = (prevPositivacoesResults.data || []).reduce((s: number, p: any) => s + Number(p.vgv), 0);
      const metaVGVMensalAcumulada = Math.round(metasCumulativas - realizadoAnterior);

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
        metaVGVMensalAcumulada,
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
    const [brokerResult, metaResult, activity, comentarioResult, allMetasResult, prevPositivacoesResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, name, team').eq('id', brokerId).single(),
      supabaseAdmin.from('metas').select('*').eq('broker_id', brokerId).eq('month', month).eq('year', year).maybeSingle(),
      aggregateBrokerData([brokerId], month, year),
      supabaseAdmin.from('comentarios').select('texto').eq('broker_id', brokerId).eq('month', month).eq('year', year).maybeSingle(),
      supabaseAdmin.from('metas').select('vgv_mensal').eq('broker_id', brokerId).eq('year', year).lte('month', month),
      month > 0
        ? supabaseAdmin.from('positivacoes').select('vgv').eq('broker_id', brokerId).eq('year', year).lt('month', month)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const broker = brokerResult.data;
    if (!broker) throw new Error('Corretor não encontrado');
    const meta = metaResult.data;
    const comentario = comentarioResult.data;

    // Cumulative meta: sum of all monthly targets up to this month minus what was already realized in previous months
    const metasCumulativas = (allMetasResult.data || []).reduce((s: number, m: any) => s + Number(m.vgv_mensal), 0);
    const realizadoAnterior = (prevPositivacoesResult.data || []).reduce((s: number, p: any) => s + Number(p.vgv), 0);
    const metaVGVMensalAcumulada = metasCumulativas - realizadoAnterior;

    return {
      broker,
      isParceria: false,
      vgvRealizado: activity.vgvRealizado,
      metaVGVMensal: meta?.vgv_mensal || 0,
      metaVGVMensalAcumulada,
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

  async getConsolidatedEvolution(year: number, scope: string[] | null = null) {
    // Escopo vazio (gerente cuja equipe não casa com ninguém) não vira consulta:
    // `.in('broker_id', [])` geraria `broker_id=in.()`, que o PostgREST pode
    // recusar. O resultado correto aqui é o gráfico zerado, não um erro.
    if (scope !== null && scope.length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({ month: i, meta: 0, realizado: 0 }));
    }

    // Metas individuais de quem está em parceria são ignoradas: a parceria tem meta própria.
    const { parceriaMap } = await this.buildParceriaMap(scope);

    let metasQ = supabaseAdmin
      .from('metas')
      .select('month, vgv_mensal, broker_id')
      .eq('year', year);
    let positivacoesQ = supabaseAdmin
      .from('positivacoes')
      .select('month, vgv')
      .eq('year', year);

    if (scope !== null) {
      metasQ = metasQ.in('broker_id', scope);
      positivacoesQ = positivacoesQ.in('broker_id', scope);
    }

    // Fora do escopo restrito, as metas de parceria entram todas (comportamento
    // histórico do painel do diretor). No escopo do gerente, só as parcerias
    // que ficaram inteiras dentro da equipe.
    const parceriaIds = Array.from(new Set(parceriaMap.values()));
    const metasParceriaQ = scope === null
      ? supabaseAdmin.from('metas_parceria').select('month, vgv_mensal').eq('year', year)
      : parceriaIds.length > 0
        ? supabaseAdmin.from('metas_parceria').select('month, vgv_mensal').eq('year', year).in('parceria_id', parceriaIds)
        : Promise.resolve({ data: [] as { month: number; vgv_mensal: number }[] });

    const [metasResult, positivacoesResult, metasParceriaResult] = await Promise.all([
      metasQ,
      positivacoesQ,
      metasParceriaQ,
    ]);

    const metaMap = new Map<number, number>();

    for (const m of metasParceriaResult.data || []) {
      metaMap.set(m.month, (metaMap.get(m.month) || 0) + (Number(m.vgv_mensal) || 0));
    }

    for (const m of metasResult.data || []) {
      if (!parceriaMap.has(m.broker_id)) {
        metaMap.set(m.month, (metaMap.get(m.month) || 0) + (Number(m.vgv_mensal) || 0));
      }
    }

    const realizadoMap = new Map<number, number>();
    for (const p of positivacoesResult.data || []) {
      realizadoMap.set(p.month, (realizadoMap.get(p.month) || 0) + Number(p.vgv));
    }

    return Array.from({ length: 12 }, (_, i) => ({
      month: i,
      meta: metaMap.get(i) || 0,
      realizado: realizadoMap.get(i) || 0,
    }));
  }

  async getYearlyEvolution(brokerId: string, year: number, scope: string[] | null = null) {
    // Check if broker is in a partnership
    const parceria = await this.scopedParceria(brokerId, scope);

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

      const months = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        meta: metaMap.get(i) || 0,
        realizado: realizadoMap.get(i) || 0,
        metaAcumulada: 0,
      }));

      // Calculate cumulative meta: deficit/surplus carries to next month
      let cumulativeMeta = 0;
      let cumulativeRealizado = 0;
      for (let i = 0; i < 12; i++) {
        cumulativeMeta += months[i].meta;
        months[i].metaAcumulada = Math.round(cumulativeMeta - cumulativeRealizado);
        cumulativeRealizado += months[i].realizado;
      }

      return months;
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

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      meta: metaMap.get(i) || 0,
      realizado: realizadoMap.get(i) || 0,
      metaAcumulada: 0,
    }));

    // Calculate cumulative meta: deficit/surplus carries to next month
    let cumulativeMeta = 0;
    let cumulativeRealizado = 0;
    for (let i = 0; i < 12; i++) {
      cumulativeMeta += months[i].meta;
      months[i].metaAcumulada = cumulativeMeta - cumulativeRealizado;
      cumulativeRealizado += months[i].realizado;
    }

    return months;
  }

  async getRanking(month: number, year: number, scope: string[] | null = null) {
    const brokers = filterByScope(await profilesService.getBrokers(), scope);
    const { parceriaMap, parcerias } = await this.buildParceriaMap(scope);

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

  async getIndividualYearly(brokerId: string, year: number, scope: string[] | null = null) {
    const parceria = await this.scopedParceria(brokerId, scope);

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
  async getConsolidatedYearly(year: number, scope: string[] | null = null) {
    const brokers = filterByScope(await profilesService.getBrokers(), scope);
    const { parceriaMap, parcerias } = await this.buildParceriaMap(scope);

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
        if (processedParcerias.has(parceriaId)) continue;
        processedParcerias.add(parceriaId);

        const parceria = parcerias.find(p => p.id === parceriaId);
        const memberIds = (parceria.parceria_membros || []).map((m: any) => m.broker_id);
        const memberNames = (parceria.parceria_membros || []).map((m: any) => m.broker?.name).filter(Boolean);

        const [metasResult, activity] = await Promise.all([
          supabaseAdmin.from('metas_parceria').select('vgv_mensal').eq('parceria_id', parceriaId).eq('year', year),
          aggregateBrokerDataYearly(memberIds, year),
        ]);

        const metaAnual = (metasResult.data || []).reduce((s: number, m: any) => s + (Number(m.vgv_mensal) || 0), 0);
        const realizado = activity.vgvRealizado;
        const percentual = metaAnual > 0 ? realizado / metaAnual : 0;

        totalVGV += realizado;
        totalCaptacoes += activity.captacoesCount;
        totalNegocios += activity.negociosCount;
        totalTreinamentoHoras += activity.treinamentoHoras;
        totalInvestimento += activity.investimentoValor;
        totalPositivacoes += activity.positivacoesCount;
        totalComissoes += activity.comissaoTotal;
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
        const [metasResult, activity] = await Promise.all([
          supabaseAdmin.from('metas').select('vgv_mensal').eq('broker_id', broker.id).eq('year', year),
          aggregateBrokerDataYearly([broker.id], year),
        ]);

        const metaAnual = (metasResult.data || []).reduce((s: number, m: any) => s + (Number(m.vgv_mensal) || 0), 0);
        const realizado = activity.vgvRealizado;
        const percentual = metaAnual > 0 ? realizado / metaAnual : 0;

        totalVGV += realizado;
        totalCaptacoes += activity.captacoesCount;
        totalNegocios += activity.negociosCount;
        totalTreinamentoHoras += activity.treinamentoHoras;
        totalInvestimento += activity.investimentoValor;
        totalPositivacoes += activity.positivacoesCount;
        totalComissoes += activity.comissaoTotal;
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

  // Shared helper for both monthly and yearly ROI ranking.
  // Pass month to restrict to a single month; omit for full-year aggregation.
  // Monetary values are accumulated as integer centavos to avoid IEEE 754
  // floating-point drift on BRL sums, then divided back to decimal at the
  // return boundary (HR-02).
  private async getRoiEntries(year: number, month?: number, scope: string[] | null = null): Promise<RoiEntry[]> {
    // 3 queries in parallel — getBrokers no longer blocks positivacoes/investimentos.
    // Filtering by valid broker IDs happens in memory after the await.
    // Receita = comissão do corretor, não o VGV da venda.
    let positivacoesQ = supabaseAdmin
      .from('positivacoes')
      .select('broker_id, comissao')
      .eq('year', year);
    let investimentosQ = supabaseAdmin
      .from('investimentos')
      .select('broker_id, valor')
      .eq('year', year)
      .gt('valor', 0);

    if (month !== undefined) {
      positivacoesQ  = positivacoesQ.eq('month', month);
      investimentosQ = investimentosQ.eq('month', month);
    }

    const [allBrokers, positivacoesResult, investimentosResult] = await Promise.all([
      profilesService.getBrokers(), // corretores e gerentes ativos (quem produz)
      positivacoesQ,
      investimentosQ,
    ]);

    const brokers = filterByScope(allBrokers, scope);
    if (brokers.length === 0) return [];
    if (positivacoesResult.error) throw new Error(positivacoesResult.error.message);
    if (investimentosResult.error) throw new Error(investimentosResult.error.message);

    const validBrokerIds = new Set(brokers.map(b => b.id));

    // Accumulate in integer centavos to avoid IEEE 754 drift on BRL sums.
    // Only rows belonging to active corretores are counted.
    const receitaCentsByBroker = new Map<string, number>();
    for (const p of positivacoesResult.data || []) {
      if (!validBrokerIds.has(p.broker_id)) continue;
      receitaCentsByBroker.set(
        p.broker_id,
        (receitaCentsByBroker.get(p.broker_id) ?? 0) + Math.round(Number(p.comissao ?? 0) * 100),
      );
    }

    const investCentsByBroker = new Map<string, number>();
    for (const i of investimentosResult.data || []) {
      if (!validBrokerIds.has(i.broker_id)) continue;
      investCentsByBroker.set(
        i.broker_id,
        (investCentsByBroker.get(i.broker_id) ?? 0) + Math.round(Number(i.valor ?? 0) * 100),
      );
    }

    const entries: RoiEntry[] = [];
    for (const b of brokers) {
      // Convert centavos back to decimal BRL at the return boundary.
      const receita     = (receitaCentsByBroker.get(b.id) ?? 0) / 100;
      const investimento = (investCentsByBroker.get(b.id) ?? 0) / 100;

      // Filter: skip brokers with no activity at all in the period.
      if (receita === 0 && investimento === 0) continue;

      // Zero-investment handling — explicit null, never Infinity/NaN.
      const roi = investimento === 0 ? null : (receita - investimento) / investimento;

      entries.push({
        brokerId: b.id,
        brokerName: b.name,
        receita,
        investimento,
        roi,
      });
    }

    // Sort desc by roi, nulls last.
    entries.sort((a, b) => {
      if (a.roi === null && b.roi === null) return 0;
      if (a.roi === null) return 1;
      if (b.roi === null) return -1;
      return b.roi - a.roi;
    });

    return entries;
  }

  async getRoi(month: number, year: number, scope: string[] | null = null): Promise<RoiEntry[]> {
    return this.getRoiEntries(year, month, scope);
  }

  async getRoiYearly(year: number, scope: string[] | null = null): Promise<RoiEntry[]> {
    return this.getRoiEntries(year, undefined, scope);
  }
}

export const dashboardService = new DashboardService();
