# Task Manager API

API REST em TypeScript para gerenciamento de tarefas (Task Manager). Cada usuário se registra,
autentica e passa a gerenciar apenas as próprias tarefas (CRUD completo), com todas as rotas de
negócio protegidas por autenticação JWT e autorização por dono do recurso. A persistência é em
**MongoDB, acessado via Mongoose**, com a modelagem em documentos descrita em
[docs/modelagem.md](docs/modelagem.md).

## Stack

- Node.js + TypeScript (modo `strict`)
- Express 4
- MongoDB + Mongoose (ODM)
- `class-validator` / `class-transformer` para validação de DTOs
- `jsonwebtoken` + `bcryptjs` para autenticação
- `jest` + `ts-jest` + `supertest` para testes unitários e de integração
- `mongodb-memory-server` para rodar os testes sem Mongo externo
- `swagger-jsdoc` + `swagger-ui-express` para documentação interativa
- `eslint` + `prettier` para lint/formatação

## Pré-requisitos

- Node.js 18 ou superior
- Docker e Docker Compose (para subir o MongoDB local). Alternativamente, um MongoDB já instalado
  e acessível via `MONGO_URI`.

## Como rodar

```bash
npm install
cp .env.example .env
docker compose up -d   # sobe o MongoDB em localhost:27017
npm run seed           # opcional: popula a base com dados de exemplo
npm run dev            # http://localhost:3000
```

Documentação interativa (Swagger UI): `http://localhost:3000/api-docs`
Health check: `http://localhost:3000/health`

Os testes **não** precisam do Docker: `npm test` sobe um MongoDB em memória
(`mongodb-memory-server`) automaticamente.

### Variáveis de ambiente

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `PORT` | `3000` | Porta HTTP da API |
| `JWT_SECRET` | `dev-only-secret` | Segredo de assinatura do JWT (troque em produção) |
| `JWT_EXPIRES_IN` | `1h` | Validade do access token |
| `NODE_ENV` | `development` | Ambiente de execução |
| `MONGO_URI` | `mongodb://localhost:27017` | String de conexão do MongoDB |
| `MONGO_DB_NAME` | `task_manager` | Nome do banco usado pela aplicação |

O `npm run seed` cria dois usuários (`maria@example.com` e `joao@example.com`, senha `senha123`) e
algumas tarefas com tags, checklist e prazos — inclusive uma atrasada, para o `/api/tasks/stats`
ter o que mostrar. O script limpa as coleções antes de popular, então é seguro rodar de novo.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Sobe a API em modo desenvolvimento (reload automático) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a versão compilada (`dist/server.js`) |
| `npm run seed` | Popula o MongoDB com dados de exemplo |
| `npm test` | Executa a suíte de testes (unitários + integração), com Mongo em memória |
| `npm run test:coverage` | Executa os testes com relatório de cobertura |
| `npm run typecheck` | Checagem de tipos sem gerar arquivos |
| `npm run lint` | Lint do código-fonte, dos testes e dos scripts |

A suíte de testes (`npm test`) funciona como sensor de regressão do projeto: qualquer mudança
futura deve manter `typecheck`, `lint` e `test` passando antes de ser considerada concluída.

## Endpoints

### Autenticação (públicos)

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | Cria um usuário e retorna um token JWT (409 se o e-mail já existe) |
| POST | `/api/auth/login` | Autentica e retorna um token JWT |

### Tarefas (protegidas — requer `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/tasks` | Lista as tarefas do usuário (filtros `?status=`, `?tag=`, `?dueBefore=`) |
| GET | `/api/tasks/stats` | Resumo: total, atrasadas, contagem por status e tags mais usadas |
| GET | `/api/tasks/:id` | Busca uma tarefa por id (403 se não for o dono, 404 se não existir) |
| POST | `/api/tasks` | Cria uma tarefa |
| PUT | `/api/tasks/:id` | Atualiza uma tarefa (atualização parcial) |
| DELETE | `/api/tasks/:id` | Remove uma tarefa |

`GET /api/tasks/stats` é registrado **antes** de `/:id` no router, para que `stats` não seja
interpretado como o id de uma tarefa.

### Corpo de uma tarefa

```jsonc
{
  "title": "Entregar o trabalho",          // obrigatório, mínimo 3 caracteres
  "description": "Migrar para MongoDB",    // opcional
  "status": "IN_PROGRESS",                 // PENDING | IN_PROGRESS | DONE (padrão PENDING)
  "priority": "HIGH",                      // LOW | MEDIUM | HIGH (padrão MEDIUM)
  "dueDate": "2026-10-15T23:59:00.000Z",   // opcional, ISO 8601
  "tags": ["faculdade", "backend"],        // embutido, até 10 itens
  "checklist": [                           // embutido, até 50 itens
    { "title": "Modelar os documentos", "done": true },
    { "title": "Escrever os testes" }
  ]
}
```

### Exemplo de uso (curl)

```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Maria","email":"maria@example.com","password":"senha123"}'

# Criar tarefa (substitua $TOKEN pelo token retornado acima)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Estudar TypeScript","tags":["estudo"],"priority":"HIGH"}'

# Listar as pendentes com a tag "estudo"
curl "http://localhost:3000/api/tasks?status=PENDING&tag=estudo" \
  -H "Authorization: Bearer $TOKEN"

# Estatísticas do usuário
curl http://localhost:3000/api/tasks/stats -H "Authorization: Bearer $TOKEN"
```

## Arquitetura

```
src/
  config/          # variáveis de ambiente tipadas
  domain/          # entidades de domínio puras (User, Task) — sem Mongoose
  dtos/            # DTOs validados com class-validator
  repositories/
    interfaces/    # ITaskRepository, IUserRepository (o contrato)
    in-memory/     # implementação sobre Map (usada nos testes de serviço)
    mongoose/      # implementação sobre MongoDB + mappers documento <-> domínio
  infra/database/  # conexão com o Mongo e models/schemas tipados
  services/        # regras de negócio, autenticação e logging
  controllers/     # tradução HTTP <-> serviços
  middlewares/     # auth, validação, tratamento de erros, logging, 404, rate limit
  routes/          # definição das rotas por recurso
  docs/            # geração da especificação OpenAPI/Swagger
  container.ts     # composition root (injeção de dependência manual)
  app.ts           # montagem do Express app (sem listen e sem I/O — testável)
  server.ts        # ponto de entrada (conecta ao Mongo, listen, graceful shutdown)
scripts/seed.ts    # popula a base com dados de exemplo
tests/
  unit/            # testes de serviços e repositórios isolados
  integration/     # testes de rotas ponta a ponta com supertest
  helpers/         # app de teste e MongoDB em memória
```

### Fluxo de uma requisição

```
rota → controller → service → interface de repositório → repositório Mongoose → model → MongoDB
```

Em detalhe, para uma rota protegida: `routes` → `auth.middleware` (valida o JWT) →
`validate.middleware` (valida o DTO) → `controller` (traduz HTTP) → `service` (regra de negócio +
autorização por dono) → `ITaskRepository` → `MongooseTaskRepository` → `TaskModel` → MongoDB. Se
algo falhar, o `error.middleware` converte em uma resposta HTTP padronizada.

### Por que a dependência aponta para dentro

O service não importa `MongooseTaskRepository`; ele recebe um `ITaskRepository` pelo construtor. A
seta de dependência vai da infraestrutura para o domínio, nunca o contrário — quem conhece o
Mongoose é o repositório concreto, e quem escolhe qual repositório usar é o `container.ts`. Três
consequências práticas:

1. **O domínio não conhece o banco.** `src/domain/entities/` são interfaces TypeScript puras: sem
   `Document`, sem `ObjectId`, sem decorator. O `id` do domínio é `string`; a conversão de
   `_id: ObjectId` acontece nos mappers, na fronteira do repositório.
2. **Erros do Mongo não vazam.** `CastError`, `E11000 duplicate key` e `ValidationError` param no
   repositório e viram `NotFoundError` (404), `ConflictError` (409) e `ValidationAppError` (400).
   Um id malformado devolve 404 em português, não 500.
3. **A implementação é substituível.** Os repositórios in-memory continuam no projeto e são a
   prova disso: `createApp({ userRepository, taskRepository })` sobe a mesma API sem banco nenhum —
   é exatamente o que `tests/integration/repository-swap.test.ts` verifica.

### Princípios aplicados

- **SRP**: cada classe tem uma responsabilidade (controller = HTTP, service = regra de negócio,
  repository = persistência, mapper = conversão, middleware = uma preocupação transversal).
- **DIP/OCP**: os serviços dependem das interfaces `IUserRepository` / `ITaskRepository`, não das
  implementações. Trocar MongoDB por outro store exige uma nova implementação da interface e uma
  linha em `container.ts`.
- **DRY**: `asyncHandler` centraliza o tratamento de rejeições assíncronas, `validate.middleware`
  centraliza a validação de DTOs, e uma única hierarquia `AppError` alimenta um único
  `error.middleware`.
- **Injeção de dependência**: `container.ts` é o composition root — instancia repositórios,
  injeta-os nos serviços via construtor, injeta os serviços nos controllers, e monta o
  `authMiddleware` a partir do `authService`. Aceita `overrides` para injetar outra implementação.

## Persistência

A modelagem completa (embedding vs. referência, perguntas do negócio, índices e diagrama) está em
[docs/modelagem.md](docs/modelagem.md). Em resumo:

- `users`: `name`, `email` (índice único), `passwordHash`, `createdAt`.
- `tasks`: escalares (`title`, `description`, `status`, `priority`, `dueDate`), `tags` e
  `checklist` **embutidos**, e `ownerId` como **referência** (`ObjectId`, `ref: 'User'`), com
  `timestamps: true`.
- Índices: `{ ownerId: 1, status: 1 }`, `{ ownerId: 1, dueDate: 1 }`, `{ tags: 1 }` e `email` único.
- `GET /api/tasks/stats` usa um **aggregation pipeline** (`$match`, `$group`, `$unwind`, `$sort`,
  `$limit` dentro de um `$facet`) para responder às três perguntas do resumo em uma única ida ao
  banco.

## Autenticação e autorização

- **Autenticação**: `AuthService` faz hash de senha com bcrypt, emite e verifica tokens JWT.
- **Autorização**: `TaskService` garante que apenas o dono de uma tarefa possa lê-la, atualizá-la
  ou removê-la (403 `Forbidden` quando o token é válido mas o recurso pertence a outro usuário;
  401 `Unauthorized` quando não há token válido).
- **Rate limiting**: `POST /api/auth/register` e `POST /api/auth/login` são limitados a 10
  tentativas a cada 15 minutos por IP (`rate-limit.middleware.ts`), retornando 429 acima disso —
  mitigação de força bruta contra senhas.

Fora do escopo desta entrega (documentado como decisão consciente, não como pendência
esquecida): refresh token (há apenas um access token JWT com expiração fixa, sem rotação ou
revogação), `JWT_SECRET` teria que ser validado como obrigatório em produção em vez de usar um
fallback de desenvolvimento, `helmet`/CORS restrito por origem não foram configurados, e o MongoDB
do `docker-compose.yml` sobe sem autenticação por ser ambiente local de desenvolvimento.

## Testes

Cobrindo: registro/login (sucesso, e-mail duplicado com 409, credenciais inválidas, DTO inválido,
rate limit), CRUD completo de tarefas ponta a ponta (sucesso, 401 sem token, 403 tarefa de outro
usuário, 404 para id inexistente e para id malformado, DTO inválido), os campos embutidos (`tags` e
`checklist`), o endpoint `/api/tasks/stats`, o `MongooseTaskRepository` contra um Mongo real em
memória (create, findById, cada filtro de `findByOwner`, update parcial, delete, id inválido e a
aggregation), o `MongooseUserRepository` (e-mail duplicado, normalização), os serviços contra os
repositórios in-memory e a troca de implementação no composition root.

```bash
npm test
```
