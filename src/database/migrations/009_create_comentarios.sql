CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gestor_id UUID NOT NULL REFERENCES profiles(id),
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  texto TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(broker_id, month, year)
);

ALTER TABLE comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comentarios"
  ON comentarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Gestor can insert comentarios"
  ON comentarios FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Gestor can update comentarios"
  ON comentarios FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Gestor can delete comentarios"
  ON comentarios FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));
