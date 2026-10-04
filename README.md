# DSADebug

A coding-interview practice platform. Solve DSA problems in **JavaScript, Python or C++** in a Monaco editor, run your code against hidden test cases in a **sandboxed, queued execution engine**, and get **LLM-generated complexity analysis** on every submission, with results streamed to the browser in real time.

<!-- Add after deploying:
**Live demo:** https://your-app.vercel.app
![Problem workspace](docs/workspace.png)
-->

## Features

- JWT authentication, bcrypt password hashing, role-based access (user / admin)
- 13 seeded problems (Easy/Medium) with visible samples and **hidden test cases**
- Monaco editor with **JavaScript, Python and C++** (C++ is compiled for you; compile errors show your own line numbers)
- Polished responsive UI: landing page, progress tracking, solved ticks, saved code drafts, Ctrl/Cmd+Enter to submit
- Asynchronous judging: submissions go through a Redis-backed queue to a worker
- Real-time verdicts over Socket.IO (Redis adapter), with a polling safety net
- AI analysis (time/space complexity, summary, suggestions) via Groq, after the verdict
- Profile dashboard with solved stats and a difficulty breakdown chart
- 95 automated tests (including reference solutions for every problem in every language) and CI (GitHub Actions)

## Architecture

```mermaid
flowchart LR
    B[React + Vite<br/>Monaco · Socket.IO client] -- REST --> API[Express API]
    B <-- WebSocket --> API
    API --> M[(MongoDB Atlas)]
    API -- enqueue --> R[(Redis · BullMQ)]
    R -- job --> W[Execution worker]
    W --> S[[Sandbox: Judge0 (hosted) or Docker<br/>no network · capped CPU/RAM/pids]]
    W -- verdict --> M
    W -- AI analysis --> G[Groq API]
    W -- Socket.IO Emitter --> R
    R -- adapter --> API
```

**Submission lifecycle**

1. `POST /api/submissions` validates input, enforces per-user limits, stores the submission as `queued`, enqueues a job and returns `202 Accepted` immediately.
2. A worker picks it up, marks it `running`, and runs **all test cases in a single sandboxed process**.
3. The verdict is saved and pushed to that user's private Socket.IO room via the Redis emitter, so it works even when API and worker are separate processes or the API is scaled out.
4. AI analysis runs *after* the verdict, so it never delays correctness feedback.
5. If a worker dies mid-job, a reaper marks stuck submissions as failed; infrastructure errors are retried with exponential backoff.

## Security model

| Concern | Mitigation |
|---|---|
| Untrusted code execution | **Judge0 mode:** code runs on a Judge0 sandbox, never on your server. **Docker mode:** `--network none`, `--memory`/`--cpus`/`--pids-limit`, `--read-only`, `--cap-drop ALL`, `no-new-privileges`, non-root user, secrets never forwarded. Timeouts kill the whole container; output is size-capped. |
| Verdict spoofing | Results are read only from lines carrying a random per-run nonce, so a program printing fake results is ignored. |
| Hidden test leakage | Hidden tests never appear in the problem API, and failures/errors on them are redacted (no input or expected output, no error text). |
| NoSQL injection | All body/query fields are type-checked (`{"$ne": null}` is rejected). |
| Brute force | Failed-login limiter per IP; registration limiter; per-**user** submission limiter; cap on pending submissions per user. |
| Auth | JWT pinned to HS256 for REST and sockets, 32+ char secret enforced in production, constant-time-ish login (dummy hash) to avoid user enumeration, role checked in the DB on every admin call. |
| Mass assignment | Admin problem creation whitelists and validates every field. |
| Headers / errors | `helmet`, strict CORS from `CLIENT_ORIGINS`, internal error messages hidden in production. |

> **Local mode is not a security boundary.** `EXEC_MODE=local` runs submissions as plain child processes that can read the host filesystem and the parent process environment. It exists for development only. For anything public use `EXEC_MODE=judge0` or `docker`.

Known limitations: JWTs are stored in `localStorage` (XSS-exposed; httpOnly cookies would be stronger), there is no email verification or password reset, and only JavaScript, Python and C++ are supported.

## Local setup

Requires Node 20+, a MongoDB Atlas (or local) database and Redis (Redis Cloud or `redis://127.0.0.1:6379`).

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGO_URI, REDIS_URL, JWT_SECRET (and optionally GROQ_API_KEY)
npm install
npm run seed                # loads the 13 problems
npm run dev                 # API on :4000
npm run worker              # second terminal: the execution worker
# or run both in one process:  npm run start:all

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Running code: pick an execution mode (`EXEC_MODE` in `backend/.env`)

| Mode | Needs installing | Isolation | Best for |
|---|---|---|---|
| `judge0` (recommended) | **Nothing.** Just internet access | Hosted sandbox, code never runs on your machine | Low disk space, Windows, and PaaS deployments (Render) |
| `docker` | Docker + `npm run sandbox:build` (~400 MB image) | Container: no network, capped CPU/RAM, read-only, non-root | Self-hosting on a VPS |
| `local` | Node and Python (and **g++** for C++) | **None** | Quick local development only |
| `auto` | | docker if the image exists, else judge0 if `JUDGE0_URL` is set, else local | |

**No Docker, little disk space? Use Judge0.** In `backend/.env`:

```env
EXEC_MODE=judge0
JUDGE0_URL=https://ce.judge0.com
```

That's the whole setup, and JavaScript, Python and C++ all work, because Judge0 compiles and runs them remotely. All of a submission's test cases are sent in a single Judge0 request. For heavier use, point `JUDGE0_URL` at your own instance (`JUDGE0_AUTH_TOKEN`) or the RapidAPI-hosted one (`JUDGE0_RAPIDAPI_KEY`). Your submitted source code is sent to whichever host you configure.

`local` mode on Windows needs MinGW-w64 (`g++` on PATH) for C++; JavaScript and Python only need Node and Python.

**Make yourself an admin** (needed for `POST /api/problems`):

```bash
cd backend && npm run make-admin -- you@example.com
```

## Tests

```bash
cd backend && npm test
```

95 tests using Node's built-in runner (no extra dependencies):

- the executor for all three languages: accepted / wrong answer / runtime error / compile error / timeout / output flood / verdict spoofing / hidden-test redaction / in-place solutions / C++ segfaults and signature mistakes
- **reference solutions for all 13 problems in JavaScript, Python and C++** run against the seed's test cases (catches bad test data and harness bugs)
- the Judge0 adapter against a mock Judge0 server that speaks the real API (base64, tokens, polling, status codes, retries)
- output comparison, AI response parsing, input validation, NoSQL-injection rejection, JWT checks and admin authorization

They run in `local`/mock mode, so no Docker or internet is needed. C++ tests are skipped automatically if `g++` isn't installed. CI runs them plus the frontend build on every push.

## API

| Method | Route | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | – | rate limited |
| POST | `/api/auth/login` | – | failed attempts rate limited |
| GET | `/api/auth/me` | user | |
| GET | `/api/problems` | – | `?difficulty=Easy&tag=array` |
| GET | `/api/problems/:slug` | – | hidden tests omitted |
| POST | `/api/problems` | **admin** | validated + whitelisted |
| POST | `/api/submissions` | user | `202`, per-user rate limit |
| GET | `/api/submissions` | user | last 50, without source code |
| GET | `/api/submissions/:id` | owner | |
| GET | `/api/health` | – | |

Socket.IO event `submission:update` is delivered to the owning user only.

## Deployment

| Piece | Where | Notes |
|---|---|---|
| Frontend | Vercel | Set `VITE_API_URL` and `VITE_SOCKET_URL` to your API URL. |
| API (+ worker) | Render / any Node host | Start command `npm run start:all` runs API and worker together; or deploy `npm start` and `npm run worker` as two services. Set `NODE_ENV=production`, `CLIENT_ORIGINS=https://your-app.vercel.app`, a 32+ char `JWT_SECRET`. |
| Database | MongoDB Atlas | |
| Redis | Redis Cloud | Free tier is enough. |

**Sandbox on PaaS:** Render and similar platforms can't give you a Docker daemon, so deploy with `EXEC_MODE=judge0`. Untrusted code then runs on Judge0's sandbox and never on your server, and C++ works with no compiler on your host. (If you'd rather self-host the runner, run the worker on a VPS with Docker and `EXEC_MODE=docker`.) Free-tier hosts may cold-start, so the first request can take a few seconds.

## Design decisions worth discussing

- **Queue + separate worker** so a slow or crashing submission never blocks the API, and the two can scale independently.
- **One sandbox run per submission, not per test** (one container, or one Judge0 request) to keep latency practical; results stream out per test so a timeout still reports partial progress.
- **A type-driven C++ harness**: C++ has no `eval`, so each problem declares its parameter types and the harness parses the JSON test input into exactly those types before calling the user's `solve(...)`.
- **Sentinel protocol with a nonce** instead of trusting raw stdout, so debug prints don't break grading and can't forge results.
- **Socket first, polling as a safety net**: the worker can finish before the browser knows the submission id, and sockets can drop, so a slow poll closes the gap without hammering the API.
- **Atomic stat updates** (`$ne` guard + `$inc`) so concurrent accepts can't double-count a solve.

## Roadmap

Java support, an admin UI for authoring problems, a leaderboard, httpOnly-cookie auth, and email verification.
