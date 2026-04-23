import { supabaseAdmin } from '../config/supabase';
import { profilesService } from './profiles.service';
import { MapaAmbicao, MapaAmbicaoSummary } from '../types/api';

export class MapaAmbicaoService {
  async getByBrokerId(brokerId: string): Promise<MapaAmbicao | null> {
    const { data, error } = await supabaseAdmin
      .from('mapas_ambicao')
      .select('*')
      .eq('broker_id', brokerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as MapaAmbicao | null) ?? null;
  }

  async upsert(
    brokerId: string,
    payload: { dados?: Record<string, unknown>; status?: 'vazio' | 'parcial' | 'preenchido' }
  ): Promise<MapaAmbicao> {
    // Read existing row once to obtain fallback values for omitted fields.
    // The write below is an atomic DB-level upsert, so concurrent autosave
    // requests from the same corretor cannot both trigger a duplicate INSERT.
    const existing = await this.getByBrokerId(brokerId);

    const { data, error } = await supabaseAdmin
      .from('mapas_ambicao')
      .upsert(
        {
          broker_id: brokerId,
          dados: payload.dados !== undefined ? payload.dados : (existing?.dados ?? {}),
          status: payload.status !== undefined ? payload.status : (existing?.status ?? 'vazio'),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'broker_id', ignoreDuplicates: false }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as MapaAmbicao;
  }

  async listAllWithProfiles(): Promise<MapaAmbicaoSummary[]> {
    const brokers = await profilesService.getBrokers();

    const { data: mapas, error } = await supabaseAdmin
      .from('mapas_ambicao')
      .select('broker_id, status, updated_at');
    if (error) throw new Error(error.message);

    const mapaByBroker = new Map<string, { status: string; updated_at: string }>();
    for (const m of mapas || []) {
      mapaByBroker.set(m.broker_id, { status: m.status, updated_at: m.updated_at });
    }

    return brokers.map(b => {
      const mapa = mapaByBroker.get(b.id);
      return {
        broker_id: b.id,
        broker_name: b.name,
        status: (mapa?.status ?? 'vazio') as 'vazio' | 'parcial' | 'preenchido',
        updated_at: mapa?.updated_at ?? null,
        has_mapa: !!mapa,
      };
    });
  }

  async getAsGestor(brokerId: string): Promise<MapaAmbicao | null> {
    return this.getByBrokerId(brokerId);
  }
}

export const mapaAmbicaoService = new MapaAmbicaoService();
