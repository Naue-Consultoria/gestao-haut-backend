-- Create custom enums
CREATE TYPE user_role AS ENUM ('corretor', 'gestor');
CREATE TYPE origem_type AS ENUM ('RELACIONAMENTO', 'PATROCINADO', 'CORRETOR_EXTERNO', 'CORRETOR_INTERNO', 'PORTAL');
CREATE TYPE investimento_type AS ENUM ('PORTAL', 'PATROCINADO', 'CURSO', 'NETWORKING', 'PRESENTE_CLIENTE', 'BRINDE', 'OUTRO');
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  team TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'corretor',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestor can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor')
    OR id = auth.uid()
  );

CREATE POLICY "Gestor can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor')
  );
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
CREATE TABLE positivacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  oportunidade TEXT NOT NULL,
  parceria TEXT NOT NULL DEFAULT 'NÃO',
  vgv NUMERIC(15,2) NOT NULL DEFAULT 0,
  comissao NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE positivacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or gestor reads all"
  ON positivacoes FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Users can insert own"
  ON positivacoes FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Users can delete own"
  ON positivacoes FOR DELETE TO authenticated
  USING (broker_id = auth.uid());
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
CREATE TABLE negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  oportunidade TEXT NOT NULL,
  origem origem_type NOT NULL DEFAULT 'RELACIONAMENTO',
  vgv NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or gestor reads all"
  ON negocios FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Users can insert own"
  ON negocios FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Users can delete own"
  ON negocios FOR DELETE TO authenticated
  USING (broker_id = auth.uid());
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
CREATE TABLE investimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2020),
  tipo investimento_type NOT NULL DEFAULT 'OUTRO',
  produto TEXT NOT NULL DEFAULT '',
  valor NUMERIC(15,2) NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE investimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own or gestor reads all"
  ON investimentos FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gestor'));

CREATE POLICY "Users can insert own"
  ON investimentos FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid());

CREATE POLICY "Users can delete own"
  ON investimentos FOR DELETE TO authenticated
  USING (broker_id = auth.uid());
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
-- Trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_metas
  BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_comentarios
  BEFORE UPDATE ON comentarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Auto-create profile when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, team, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'team', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'corretor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
