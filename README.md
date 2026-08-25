# Task Manager API

API REST em TypeScript para gerenciamento de tarefas (Task Manager). Cada usuário se registra,
autentica e passa a gerenciar apenas as próprias tarefas (CRUD completo), com todas as rotas de
negócio protegidas por autenticação JWT e autorização por dono do recurso. A persistência é em
memória (repositórios sobre `Map`), sem dependência de banco de dados externo.

## Stack

- Node.js + TypeScript (modo `strict`)
- Express 4
- `class-validator` / `class-transformer` para validação de DTOs
- `jsonwebtoken` + `bcryptjs` para autenticação
- `jest` + `ts-jest` + `supertest` para testes unitários e de integração
- `swagger-jsdoc` + `swagger-ui-express` para documentação interativa
- `eslint` + `prettier` para lint/formatação

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:3000
```

Documentação interativa (Swagger UI): `http://localhost:3000/api-docs`
Health check: `http://localhost:3000/health`

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run dev` | Sobe a API em modo desenvolvimento (reload automático) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a versão compilada (`dist/server.js`) |
| `npm test` | Executa a suíte de testes (unitários + integração) |
| `npm run test:coverage` | Executa os testes com relatório de cobertura |
| `npm run typecheck` | Checagem de tipos sem gerar arquivos |
| `npm run lint` | Lint do código-fonte e dos testes |

A suíte de testes (`npm test`) funciona como sensor de regressão do projeto: qualquer mudança
futura deve manter `typecheck`, `lint` e `test` passando antes de ser considerada concluída.

## Endpoints

### Autenticação (públicos)

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | Cria um usuário e retorna um token JWT |
| POST | `/api/auth/login` | Autentica e retorna um token JWT |

### Tarefas (protegidas — requer `Authorization: Bearer <token>`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/tasks` | Lista as tarefas do usuário autenticado (filtro opcional `?status=`) |
| GET | `/api/tasks/:id` | Busca uma tarefa por id (403 se não for o dono, 404 se não existir) |
| POST | `/api/tasks` | Cria uma tarefa |
| PUT | `/api/tasks/:id` | Atualiza uma tarefa |
| DELETE | `/api/tasks/:id` | Remove uma tarefa |

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
  -d '{"title":"Estudar TypeScript"}'
```

## Arquitetura

```
src/
  config/      # variáveis de ambiente
  domain/      # entidades de domínio (User, Task)
  dtos/        # DTOs validados com class-validator
  repositories/# interfaces + implementações em memória (persistência)
  services/    # regras de negócio, autenticação e logging
  controllers/ # tradução HTTP <-> serviços
  middlewares/ # auth, validação, tratamento de erros, logging, 404, rate limit
  routes/      # definição das rotas por recurso
  docs/        # geração da especificação OpenAPI/Swagger
  container.ts # composition root (injeção de dependência manual)
  app.ts       # montagem do Express app (sem listen — testável)
  server.ts    # ponto de entrada (listen)
tests/
  unit/        # testes de serviços e repositórios isolados
  integration/ # testes de rotas ponta a ponta com supertest
```

### Fluxo de uma requisição protegida

`routes` → `auth.middleware` (valida o JWT) → `validate.middleware` (valida o DTO) →
`controller` → `service` (regra de negócio + autorização por dono) → `repository` (persistência
em memória) → `error.middleware` (se algo falhar, converte em uma resposta HTTP padronizada)

### Princípios aplicados

- **SRP**: cada classe tem uma responsabilidade (controller = HTTP, service = regra de negócio,
  repository = persistência, middleware = uma preocupação transversal por arquivo).
- **DIP/OCP**: os serviços dependem das interfaces `IUserRepository` / `ITaskRepository`
  (`src/repositories/interfaces`), não das implementações em memória. Trocar a persistência por um
  banco real exigiria apenas uma nova implementação dessas interfaces e uma linha em
  `container.ts`.
- **DRY**: `asyncHandler` centraliza o tratamento de rejeições assíncronas, `validate.middleware`
  centraliza a validação de DTOs, e uma única hierarquia `AppError` alimenta um único
  `error.middleware`.
- **Injeção de dependência**: `container.ts` é o composition root — instancia repositórios,
  injeta-os nos serviços via construtor, injeta os serviços nos controllers, e monta o
  `authMiddleware` a partir do `authService`.

## Autenticação e autorização

- **Autenticação**: `AuthService` (o "cliente" do serviço de autenticação) faz hash de senha com
  bcrypt, emite e verifica tokens JWT.
- **Autorização**: `TaskService` garante que apenas o dono de uma tarefa possa lê-la, atualizá-la
  ou removê-la (403 `Forbidden` quando o token é válido mas o recurso pertence a outro usuário;
  401 `Unauthorized` quando não há token válido).
- **Rate limiting**: `POST /api/auth/register` e `POST /api/auth/login` são limitados a 10
  tentativas a cada 15 minutos por IP (`rate-limit.middleware.ts`), retornando 429 acima disso —
  mitigação de força bruta contra senhas.

Fora do escopo desta entrega (documentado como decisão consciente, não como pendência
esquecida): refresh token (há apenas um access token JWT com expiração fixa, sem rotação ou
revogação), `JWT_SECRET` teria que ser validado como obrigatório em produção em vez de usar um
fallback de desenvolvimento, e `helmet`/CORS restrito por origem não foram configurados por não
serem exigidos pelo escopo do exercício.

## Testes

35 testes cobrindo: registro/login (sucesso, e-mail duplicado, credenciais inválidas, DTO
inválido), CRUD completo de tarefas (sucesso, 401 sem token, 403 tarefa de outro usuário, 404 não
encontrada, DTO inválido) e os repositórios/serviços isoladamente.

```bash
npm test
```
