CREATE TABLE captacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  oportunidade TEXT NOT NULL,
  exclusivo TEXT NOT NULL DEFAULT 'NÃO',
  origem origem_type NOT NULL DEFAULT 'RELACIONAMENTO',
  vgv NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE captacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or gestor reads all"
  ON captacoes FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Users can insert own"
  ON captacoes FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Users can delete own"
  ON captacoes FOR DELETE TO authenticated
  USING (broker_id = auth.uid());
