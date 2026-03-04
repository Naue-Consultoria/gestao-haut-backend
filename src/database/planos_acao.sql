CREATE TYPE plano_status AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO');

CREATE TABLE planos_acao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gestor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month >= 0 AND month <= 11),
  year INT NOT NULL CHECK (year >= 2020),
  texto TEXT NOT NULL,
  prazo TEXT NOT NULL DEFAULT '',
  status plano_status NOT NULL DEFAULT 'PLANEJADO',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_planos_acao_broker ON planos_acao(broker_id, month, year);

ALTER TABLE planos_acao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planos_acao_select" ON planos_acao FOR SELECT USING (true);
CREATE POLICY "planos_acao_insert" ON planos_acao FOR INSERT WITH CHECK (true);
CREATE POLICY "planos_acao_update" ON planos_acao FOR UPDATE USING (true);
CREATE POLICY "planos_acao_delete" ON planos_acao FOR DELETE USING (true);
