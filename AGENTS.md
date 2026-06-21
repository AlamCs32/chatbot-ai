# Project Context

## Overview

- **Name:** chatbot_ai — AI chatbot with RAG document management, multi-provider AI support, session management
- **Stack:** TypeScript 6.0, Express 5.2, TypeORM 1.0 (PostgreSQL), LangChain.js, Pino logger
- **Runtime:** Node.js (ES2022), run via `tsx` in dev, compiled to `dist/` for prod
- **Package mgr:** Yarn 4.9 with `nodeLinker: node-modules`

## Commands

- `yarn dev` — dev server with hot reload (`tsx watch -r tsconfig-paths/register -r dotenv src/index.ts`)
- `yarn build` — compile to dist/ (`tsc`)
- `yarn start` — production start (`node -r dotenv -r tsconfig-paths/register dist/index.js`)
- `yarn type-check` — TypeScript type checking (`tsc --noEmit`)
- `yarn lint` / `yarn lint:fix` — ESLint
- `yarn format` / `yarn format:check` — Prettier
- `yarn test` — NOT SET (no test files exist)

## Project Structure

```
src/
├── index.ts                       # Entry: Express bootstrap, middleware stack, route mounting
├── configs/
│   ├── env.ts                     # SINGLE source of truth for all process.env access
│   ├── logger.ts                  # Pino logger with AsyncLocalStorage + rotating file streams
│   └── swagger.ts                 # OpenAPI 3.1 spec generation
├── ai/
│   ├── types.ts                   # Core types: ChatMessage, AIProvider, ToolDefinition, etc.
│   ├── config.ts                  # AI provider config (imports from env.ts)
│   ├── chat.service.ts            # Direct SDK chat (UNUSED by routes)
│   ├── langchain/
│   │   ├── models.ts              # LangChain model factory (createLangchainModel)
│   │   └── chat.service.ts        # LangChain chat with RAG context injection (USED by routes)
│   ├── models/
│   │   ├── registry.ts            # 16 registered models across 4 providers + fallback chains
│   │   └── router.ts              # Provider router with cross-provider fallback
│   ├── providers/
│   │   ├── openai.provider.ts     # OpenAIProvider (AIProvider interface)
│   │   ├── anthropic.provider.ts  # AnthropicProvider
│   │   ├── gemini.provider.ts     # GeminiProvider
│   │   └── openrouter.provider.ts # OpenRouterProvider (OpenAI-compatible)
│   └── tools/
│       ├── registry.ts            # registerTool / getTool / getAllTools
│       └── weather.tool.ts        # Mock weather tool
├── routes/
│   ├── chat.routes.ts             # POST /api/chat, GET /api/chat/:id, DELETE /api/chat/:id, GET /api/models
│   └── documents.routes.ts        # POST/GET/GET/:id/DELETE /api/documents
├── middlewares/
│   ├── correlationId.middleware.ts # x-request-id header + AsyncLocalStorage
│   ├── errorHandler.middleware.ts  # Global error handler (status classification by error type, dev stack traces)
│   └── requestLogger.middleware.ts # Request/response logging with timing
├── sessions/
│   ├── types.ts                   # Session / SessionStore interfaces
│   └── memory.store.ts            # In-memory Map-based session store
├── rag/
│   ├── chunker.ts                 # Text chunker (1000 chars, 100 overlap)
│   ├── embeddings.ts              # OpenAIEmbeddings (text-embedding-3-small)
│   ├── retriever.ts               # similaritySearch context retrieval
│   └── vector.store.ts            # PGVectorStore singleton (table: documents_vectors)
└── database/
    ├── adapter/
    │   ├── index.ts               # Exports active adapter (typeorm | supabase)
    │   ├── types.ts               # DatabaseAdapter interface + DocumentRecord types
    │   ├── typeorm.ts             # TypeORM adapter implementation (used currently)
    │   └── supabase.ts            # Supabase adapter skeleton (for future integration)
    ├── pool.ts                    # Raw pg.Pool from DATABASE_URL
    ├── migrate.ts                 # Startup migration (init adapter, create vector extension)
    └── entities/
        └── document.entity.ts     # Documents table: id(uuid), title, content, metadata(jsonb), createdAt, updatedAt
```

## API Routes

| Method | Path                   | Purpose             | Req Body                          | Success Response                     |
| ------ | ---------------------- | ------------------- | --------------------------------- | ------------------------------------ |
| GET    | `/health`              | Health check        | —                                 | `{ status: "ok" }`                   |
| GET    | `/api-docs`            | Swagger UI          | —                                 | HTML page                            |
| POST   | `/api/chat`            | Send message        | `{ message, sessionId?, model? }` | `{ reply, sessionId, modelUsed }`    |
| GET    | `/api/chat/:sessionId` | Get history         | —                                 | `{ id, model, messages, createdAt }` |
| DELETE | `/api/chat/:sessionId` | Clear session       | —                                 | `{ ok: boolean }`                    |
| GET    | `/api/models`          | List enabled models | —                                 | `ProviderModel[]`                    |
| POST   | `/api/documents`       | Upload document     | `{ title?, content }`             | `{ id, title, chunks }`              |
| GET    | `/api/documents`       | List documents      | —                                 | `[{ id, title, createdAt }]`         |
| GET    | `/api/documents/:id`   | Get document        | —                                 | Full DocumentRecord                  |
| DELETE | `/api/documents/:id`   | Delete document     | —                                 | `{ ok: true }`                       |

## Middleware Pipeline (order matters)

1. `helmet()` — security headers
2. `cors()` — CORS
3. `express.json({ limit: '10mb' })` — body parser
4. `correlationId` — request ID + AsyncLocalStorage
5. `requestLogger` — timing + status logging
6. _routes_
7. `errorHandler` — catch-all (returns `{ success: false, message }`, status classified by error type)

## AI Architecture

- **Interface:** `AIProvider { chat(req: ChatRequest): Promise<ChatResponse> }`
- **4 providers:** OpenAI, Anthropic, Gemini, OpenRouter
- **Two parallel implementations:** Direct SDK (unused) and LangChain (used by routes)
- **LangChain path** has RAG context injection, `findAvailableModel()` for fallback, 5-turn tool loop
- **Model registry** has 16 models with cross-provider fallback chains
- **Session storage:** In-memory only (Map-based)

## Env Vars (all in `src/configs/env.ts`)

`PORT`, `NODE_ENV`, `DATABASE_ADAPTER`, `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `DEFAULT_MODEL`, `AI_MAX_RETRIES`, `LOG_LEVEL`, `SERVICE_NAME`, `APP_URL`, `APP_NAME`

## Key Conventions

- **Imports:** `@/` path alias maps to `./src/`
- **Files:** kebab-case with `.middleware.ts`, `.provider.ts`, `.routes.ts`, `.entity.ts` suffixes
- **Classes:** PascalCase, **interfaces:** PascalCase, **functions/constants:** camelCase
- **Async:** always `async/await`, route handlers with try/catch
- **Error handling:** custom `RateLimitError`/`ProviderError` for AI, graceful degradation for RAG/DB, error handler classifies status by error type
- **TypeScript:** strict mode, `unknown` over `any`, `Record<string, unknown>` for arbitrary objects
- **No auth:** all endpoints public
- **No validation lib:** manual `typeof` checks
- **No tests** exist in the project
