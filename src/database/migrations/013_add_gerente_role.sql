-- 013 — Adiciona o papel `gerente` (líder de equipe).
--
-- O gerente enxerga e gerencia apenas os corretores que têm o mesmo valor em
-- `profiles.team` que ele. O recorte é aplicado na API (src/utils/scope.ts).
--
-- IMPORTANTE: `ALTER TYPE ... ADD VALUE` não pode rodar junto com comandos que
-- já usem o valor novo na mesma transação. Execute este arquivo SOZINHO no
-- Supabase SQL Editor, antes de qualquer UPDATE que atribua o papel.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'gerente';

-- Se `profiles.role` for TEXT com CHECK em vez do enum `user_role`, use isto:
--
--   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
--   ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--     CHECK (role IN ('corretor', 'gestor', 'gerente'));

-- Depois, em uma execução separada, promova os gerentes e confira a equipe deles.
-- A equipe precisa bater exatamente com a dos corretores (inclusive maiúsculas
-- e acentos) — é a chave da segmentação.
--
--   UPDATE profiles SET role = 'gerente', team = 'Summit'
--   WHERE email IN ('gerente1@haut.com', 'gerente2@haut.com');
--
--   SELECT team, role, count(*) FROM profiles WHERE active GROUP BY team, role ORDER BY team;
