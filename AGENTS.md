# AGENTS.md

TalentVue — mock-interview practice app. Two independent npm packages, no root package.json: run all npm commands from `client/` or `server/`, never from the repo root.

## Scope — UPDATED 2026-11-23

Work is limited to **frontend (React + Vite + Tailwind CSS) and backend (Node.js + Express + MongoDB)**. Hosted-LLM integration is approved for the Chatbot UI, resume review, AI-generated interview questions, audio transcription and AI interview report scoring (`POST /api/ai/chat`, `POST /api/resume/analyze`, `POST /api/interviews/generate-questions`, `POST /api/interviews/generate-followup`, `POST /api/interviews/transcribe`, `POST /api/interviews/generate-report`; `GROQ_API_KEY` free by default, `OPENAI_API_KEY` optional fallback); do NOT:

1. Implement or train local AI models.
2. Add LLM calls from the browser or expose provider keys to client code.
3. Create Python AI services.
4. Generate fake AI analysis or fake AI responses.
5. Replace/remove existing AI-related UI (Chatbot etc.).

You MAY create backend APIs and MongoDB structures designed as contracts for the future Python AI service (e.g. endpoints that accept/return analysis payloads), but never fill them with simulated AI output — leave placeholders/responses honest. Preserve existing functionality; work step by step.

## Commands

```bash
cd server && npm run dev      # Express + MongoDB (nodemon), port from server/.env PORT, default 5000
cd client && npm run dev      # Vite dev server
cd client && npm run lint     # oxlint (NOT eslint) — only lint available
cd client && npm run build
```

- No tests, no CI, no typecheck anywhere in the repo. `oxlint` is the only verification besides a dev-server smoke test.
- From the repo root, `npm` commands will fail — there is no root manifest.

## Server

- `server/.env` requires `PORT`, `MONGO_URI`, `JWT_SECRET` plus `INTERNAL_API_KEY` (shared secret for the future Python AI service; used by `middleware/serviceAuth.js` — without it, service endpoints return 503, wrong key → 401). `config/db.js` calls `process.exit(1)` on DB connect failure, so the server won't start without MongoDB.
- **Do not `git add server/` wholesale.** Verify `git status` first; `.gitignore` files exist (root + `server/`, ignoring `.env`, `node_modules/`, `uploads/`).
- Code is CommonJS (`require`) — server/package.json has no `"type": "module"`. Don't add ESM imports.
- Multer saves uploads with path `"uploads/"` (relative to CWD) — the server must be started from `server/` or uploads land in the wrong directory. Files are served at `/uploads`.
- Auth: Bearer JWT (`middleware/authMiddleware.js`), payload `{ id, email }`, 7-day expiry, accessed as `req.user.id`. CORS is wide open (`app.use(cors())`).
- API prefixes: `/api/auth` (register, login — rate-limited 10 req/15 min), `/api/user/profile`, `/api/resume` (upload = multipart field `resume`, max 5MB, PDF/DOC/DOCX only; `/analysis` = stored analyses; `/analyze` = JWT, real AI resume review from uploaded file), `/api/projects`, `/api/interviews` (`/generate-questions` = JWT, real AI question generation from setup + server-side resume/project evidence; `/generate-followup` = JWT, real AI adaptive follow-up from the current answer; `/transcribe` = JWT, multipart field `audio`, max 5MB; `/generate-report` = JWT, real AI scoring of answer text; `/:id/score` = AI-service contract), `/api/ai/chat` (JWT, Groq/OpenAI-backed Chatbot replies).
- Deployed frontend: `https://talent-vue-zeta.vercel.app/`; deployed API: `https://talentvue-tivn.onrender.com`. `server/.env` CORS already allows the Vercel origin.

## AI-service contract (built, awaiting the Python service)

- `middleware/serviceAuth.js`: requires `x-internal-key` header == `INTERNAL_API_KEY`. No JWT, fail-closed (env unset → 503).

- `POST /api/resume/analysis` (serviceAuth): `{ userId, analysis: <object, shape defined by the Python service> }` → 201, stored in `ResumeAnalysis` (Mixed payload). `GET /api/resume/analysis` (user JWT) returns own analyses, newest first.
- `POST /api/interviews/:id/score` (serviceAuth): `{ score: <number or rubric object> }` → 200, writes `aiScore` (Mixed) + `aiScoredAt` on the InterviewSession; owner sees it via normal interview GETs.
- No simulated AI output anywhere; contract endpoints only persist what the Python service sends, while approved hosted-LLM endpoints call the server-side provider.

## Build status

1. Shared API client `client/src/utils/api.js` + Login/Register/Dashboard/ResumeUpload/ProjectUpload/InterviewRoom/History/Report wired. 2. Backend hygiene (upload path, rate limit, helmet, no error leaks). 3. Projects CRUD API + ProjectUpload sync. 4. Interview Sessions API + InterviewRoom POST, History backend-first sync/migration, Report fallback. 5. AI-service contract endpoints (above). 6. Shared Groq/OpenAI AI service, chat endpoint + Chatbot UI, and real AI resume review endpoint + ResumeUpload UI. 7. Real AI interview question generation endpoint + InterviewRoom UI, replacing the fixed question bank. 8. Real audio transcription + AI interview report scoring; no-speech and skipped answers score zero. Real adaptive AI follow-ups are inserted mid-interview (max 2 per run); reports include AI recommendations; no fake AI analysis is seeded. Nothing staged/committed — commit only on explicit request.

## Client

- React 19 + Vite 8 + Tailwind CSS v4. Tailwind is configured only via the `@tailwindcss/vite` plugin and `@import "tailwindcss"` in `src/index.css` — there is no tailwind.config file; custom theme values go in CSS via `@theme`.
- AUTH IS DONE: every server request sends `Authorization: Bearer <token>`. On 401, clear `talentVueToken` + `talentVueCurrentUser` and `navigate("/login")` (see `Dashboard.jsx` `verifyToken()` for the canonical pattern).
- Use the shared client `src/utils/api.js` (`apiFetch`) for all server calls — it auto-attaches the token, handles JSON/FormData, base URL via `VITE_API_URL` (default `http://localhost:5000`), and clears auth state on 401. Requests that send a body MUST pass `method` (`apiFetch` defaults to GET, and a GET with a body throws client-side).
- Auth state lives in localStorage: `talentVueToken`, `talentVueCurrentUser`. `ProtectedRoute` only checks token presence, not expiry.
- localStorage keys are per-user (`talentVue*_<userId>`) and managed in `src/utils/storage.js` (`getStorageKeys`); never hardcode a key. Projects and interview history are now **backend-first with a localStorage cache** (server load → dedupe/migrate → rewrite cache); Dashboard demo stats still come from localStorage/`seedDemoData()`, but interview scores come from saved `aiScore` reports. Frontend heuristic scoring is removed.
- Demo/mock data used by the dashboard: `src/data/mockData.js` and `seedDemoData()` in storage.js.
- Routes are defined in `src/App.jsx`. Only `/`, `/login`, `/register`, `/dashboard` are wired so far; many pages exist (`InterviewSetup`, `InterviewRoom`, `History`, `Report`, etc.) but are not yet routed.

## Git

- Git hygiene is fixed: root `.gitignore` and `server/.gitignore` exist. `node_modules/`, `.env`, and `uploads/` are ignored — but verify with `git status` before staging `server/`.
