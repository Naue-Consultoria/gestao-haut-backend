CREATE TABLE treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  atividade TEXT NOT NULL,
  local TEXT NOT NULL DEFAULT '',
  horas NUMERIC(6,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE treinamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or gestor reads all"
  ON treinamentos FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Users can insert own"
  ON treinamentos FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Users can delete own"
  ON treinamentos FOR DELETE TO authenticated
  USING (broker_id = auth.uid());
