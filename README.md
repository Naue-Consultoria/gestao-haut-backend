# HAUT Diário de Bordo — Backend API

API REST para o sistema de gestão **HAUT Diário de Bordo**, uma plataforma de acompanhamento de desempenho de corretores imobiliários. Permite o registro de metas, captações, negócios, treinamentos, investimentos e positivações, além de dashboards consolidados e geração de relatórios.

---

## Tech Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Node.js | 18+ | Runtime |
| Express | 4.18 | Framework HTTP |
| TypeScript | 5.3 | Tipagem estática |
| Supabase | 2.39 | Banco de dados (PostgreSQL) e autenticação |
| Zod | 3.22 | Validação de schemas |

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9+ (ou equivalente)
- Conta no **Supabase** com projeto configurado

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: 3000) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (admin) do Supabase |

---

## Instalação e Scripts

```bash
# Instalar dependências
npm install

# Desenvolvimento (hot reload)
npm run dev

# Build para produção
npm run build

# Iniciar servidor compilado
npm start
```

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `tsx watch src/server.ts` | Servidor com hot reload |
| `build` | `tsc` | Compila TypeScript para `dist/` |
| `start` | `node dist/server.js` | Inicia o build compilado |

---

## Estrutura de Pastas

```
src/
├── server.ts                 # Entry point do servidor
├── app.ts                    # Configuração do Express
├── config/
│   ├── env.ts                # Validação de variáveis de ambiente (Zod)
│   └── supabase.ts           # Cliente Supabase
├── controllers/              # Handlers das requisições
│   ├── auth.controller.ts
│   ├── captacoes.controller.ts
│   ├── comentarios.controller.ts
│   ├── dashboard.controller.ts
│   ├── investimentos.controller.ts
│   ├── metas.controller.ts
│   ├── negocios.controller.ts
│   ├── positivacoes.controller.ts
│   ├── profiles.controller.ts
│   ├── reports.controller.ts
│   └── treinamentos.controller.ts
├── routes/                   # Definição de rotas
│   ├── index.ts              # Agregador de rotas
│   ├── auth.routes.ts
│   ├── captacoes.routes.ts
│   ├── comentarios.routes.ts
│   ├── dashboard.routes.ts
│   ├── investimentos.routes.ts
│   ├── metas.routes.ts
│   ├── negocios.routes.ts
│   ├── positivacoes.routes.ts
│   ├── profiles.routes.ts
│   ├── reports.routes.ts
│   └── treinamentos.routes.ts
├── services/                 # Lógica de negócio
│   ├── auth.service.ts
│   ├── captacoes.service.ts
│   ├── comentarios.service.ts
│   ├── dashboard.service.ts
│   ├── investimentos.service.ts
│   ├── metas.service.ts
│   ├── negocios.service.ts
│   ├── positivacoes.service.ts
│   ├── profiles.service.ts
│   ├── reports.service.ts
│   └── treinamentos.service.ts
├── middleware/
│   ├── auth.ts               # Validação de JWT via Supabase
│   ├── roleGuard.ts          # Controle de acesso por role
│   └── errorHandler.ts       # Tratamento global de erros
├── types/
│   ├── api.ts                # Tipos de request/response
│   ├── database.ts           # Tipos do schema do banco
│   └── index.ts              # Tipos das entidades
├── database/
│   ├── migrations/           # SQL migrations (001–012)
│   ├── all_migrations.sql    # Migrations consolidadas
│   └── seed.sql              # Dados de seed
└── utils/
    ├── helpers.ts             # Helpers de resposta
    └── validation.ts          # Schemas Zod de validação
```

---

## Endpoints da API

Base URL: `/api/v1`

### Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Verifica se o servidor está rodando |

### Auth (`/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | — | Login do usuário |
| POST | `/auth/register` | — | Registro de novo usuário |
| POST | `/auth/logout` | Token | Logout do usuário |
| GET | `/auth/me` | Token | Retorna perfil do usuário logado |
| POST | `/auth/change-password` | Token | Alterar senha |

### Profiles (`/profiles`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/profiles/` | Token | Listar todos os perfis |
| GET | `/profiles/brokers` | Token | Listar todos os corretores |
| POST | `/profiles/` | Gestor | Criar novo perfil |
| PUT | `/profiles/:id` | Gestor | Atualizar perfil |

### Metas (`/metas`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/metas/:brokerId` | Token | Metas de um corretor |
| GET | `/metas/:brokerId/:month` | Token | Metas de um corretor em um mês |
| PUT | `/metas/:brokerId/:month` | Gestor | Criar/atualizar metas |

### Positivações (`/positivacoes`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/positivacoes/` | Token | Listar positivações |
| POST | `/positivacoes/` | Token | Criar positivação |
| DELETE | `/positivacoes/:id` | Token | Deletar positivação |

### Captações (`/captacoes`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/captacoes/` | Token | Listar captações |
| POST | `/captacoes/` | Token | Criar captação |
| DELETE | `/captacoes/:id` | Token | Deletar captação |

### Negócios (`/negocios`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/negocios/` | Token | Listar negócios |
| POST | `/negocios/` | Token | Criar negócio |
| DELETE | `/negocios/:id` | Token | Deletar negócio |

### Treinamentos (`/treinamentos`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/treinamentos/` | Token | Listar treinamentos |
| POST | `/treinamentos/` | Token | Criar treinamento |
| DELETE | `/treinamentos/:id` | Token | Deletar treinamento |

### Investimentos (`/investimentos`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/investimentos/` | Token | Listar investimentos |
| POST | `/investimentos/` | Token | Criar investimento |
| DELETE | `/investimentos/:id` | Token | Deletar investimento |

### Comentários (`/comentarios`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/comentarios/:brokerId` | Token | Comentários de um corretor |
| GET | `/comentarios/:brokerId/:month` | Token | Comentários de um mês |
| PUT | `/comentarios/:brokerId/:month` | Gestor | Criar/atualizar comentário |

### Dashboard (`/dashboard`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/dashboard/consolidated` | Token | Dashboard consolidado (todos os corretores) |
| GET | `/dashboard/individual/:brokerId` | Token | Dashboard individual do corretor |
| GET | `/dashboard/ranking` | Gestor | Ranking de corretores |

### Reports (`/reports`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/reports/broker/:brokerId` | Gestor | Relatório completo de um corretor |

---

## Middlewares

| Middleware | Descrição |
|------------|-----------|
| `authMiddleware` | Valida o token JWT (Bearer) via Supabase. Anexa `userId`, `userRole` e `accessToken` à request. Bloqueia acesso se `must_change_password` for `true` (exceto endpoints de auth). |
| `requireGestor` | Restringe o endpoint apenas para usuários com role `gestor`. Retorna 403 se não autorizado. |
| `requireOwnerOrGestor` | Permite acesso se o usuário for `gestor` ou o dono do recurso (broker_id === userId). |
| `errorHandler` | Tratamento global de erros. Retorna resposta padronizada com status 500. |

---

## Roles (Papéis)

| Role | Descrição | Permissões |
|------|-----------|------------|
| `corretor` | Corretor de imóveis (role padrão) | Visualizar e editar seus próprios dados, ver dashboard individual |
| `gestor` | Gestor da equipe | Tudo que o corretor pode + definir metas, ver ranking, gerenciar usuários, ver relatórios, adicionar comentários |

---

## Formato de Resposta

Todas as respostas seguem o padrão:

```json
// Sucesso
{
  "success": true,
  "data": { ... }
}

// Erro
{
  "success": false,
  "error": "Mensagem de erro"
}
```

---

## Migrations

As migrations ficam em `src/database/migrations/` e devem ser executadas no **Supabase SQL Editor** em ordem numérica:

| # | Arquivo | Descrição |
|---|---------|-----------|
| 001 | `create_enums.sql` | Enums: `user_role`, `origem_type`, `investimento_type` |
| 002 | `create_profiles.sql` | Tabela `profiles` com RLS |
| 003 | `create_metas.sql` | Tabela `metas` (metas mensais) |
| 004 | `create_positivacoes.sql` | Tabela `positivacoes` |
| 005 | `create_captacoes.sql` | Tabela `captacoes` |
| 006 | `create_negocios.sql` | Tabela `negocios` |
| 007 | `create_treinamentos.sql` | Tabela `treinamentos` |
| 008 | `create_investimentos.sql` | Tabela `investimentos` |
| 009 | `create_comentarios.sql` | Tabela `comentarios` |
| 010 | `updated_at_trigger.sql` | Trigger para atualizar `updated_at` |
| 011 | `create_profile_trigger.sql` | Trigger para criar perfil ao registrar usuário |
| 012 | `add_must_change_password.sql` | Coluna `must_change_password` em profiles |

Alternativamente, execute `all_migrations.sql` para rodar todas de uma vez.

```sql
-- No Supabase SQL Editor, cole e execute cada arquivo em ordem
-- ou execute all_migrations.sql para todas de uma vez
```
