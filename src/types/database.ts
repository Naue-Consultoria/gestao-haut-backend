export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          team: string;
          role: 'corretor' | 'gestor';
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          team: string;
          role?: 'corretor' | 'gestor';
          active?: boolean;
        };
        Update: {
          name?: string;
          email?: string;
          team?: string;
          role?: 'corretor' | 'gestor';
          active?: boolean;
        };
      };
      metas: {
        Row: {
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
        };
      };
      positivacoes: {
        Row: {
          id: string;
          broker_id: string;
          month: number;
          year: number;
          oportunidade: string;
          parceria: string;
          vgv: number;
          comissao: number;
          created_at: string;
        };
      };
      captacoes: {
        Row: {
          id: string;
          broker_id: string;
          month: number;
          year: number;
          oportunidade: string;
          exclusivo: string;
          origem: string;
          vgv: number;
          created_at: string;
        };
      };
      negocios: {
        Row: {
          id: string;
          broker_id: string;
          month: number;
          year: number;
          oportunidade: string;
          origem: string;
          vgv: number;
          created_at: string;
        };
      };
      treinamentos: {
        Row: {
          id: string;
          broker_id: string;
          month: number;
          year: number;
          atividade: string;
          local: string;
          horas: number;
          created_at: string;
        };
      };
      investimentos: {
        Row: {
          id: string;
          broker_id: string;
          month: number;
          year: number;
          tipo: string;
          produto: string;
          valor: number;
          leads: number;
          created_at: string;
        };
      };
      comentarios: {
        Row: {
          id: string;
          broker_id: string;
          gestor_id: string;
          month: number;
          year: number;
          texto: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
