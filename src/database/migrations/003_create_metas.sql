CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  vgv_anual NUMERIC(15,2) NOT NULL DEFAULT 0,
  vgv_mensal NUMERIC(15,2) NOT NULL DEFAULT 0,
  captacoes INTEGER NOT NULL DEFAULT 0,
  capt_exclusivas INTEGER NOT NULL DEFAULT 0,
  negocios NUMERIC(15,2) NOT NULL DEFAULT 0,
  treinamento NUMERIC(8,1) NOT NULL DEFAULT 0,
  investimento NUMERIC(15,2) NOT NULL DEFAULT 0,
  positivacao NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broker_id, month, year)
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read metas"
  ON metas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestor can insert metas"
  ON metas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Gestor can update metas"
  ON metas FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));
