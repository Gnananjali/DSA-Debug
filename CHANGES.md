# What changed (and what you need to do)

## Round 2: C++, no Docker needed, new UI

### Do this now (Windows, no Docker)
1. In `backend/.env` set:
   ```env
   EXEC_MODE=judge0
   JUDGE0_URL=https://ce.judge0.com
   ```
   That is all. No Docker and no compiler install: JavaScript, Python **and C++** are run by Judge0.
2. Copy the files over your repo, then `cd backend && npm install && npm test`, and `cd frontend && npm install && npm run build`.
3. **Re-run `npm run seed`** (in `backend`). This adds the C++ starter code and parameter types to all 13 problems. C++ is only offered on problems that have them.
4. On Render, set the same two variables (`EXEC_MODE=judge0`, `JUDGE0_URL`) plus the Round 1 items listed further down (rotate secrets, 32+ char `JWT_SECRET`, `CLIENT_ORIGINS`, `npm run start:all`). Because the code now runs on Judge0, your live demo is **no longer on the unsafe local fallback**.

### New: C++ support
- A third language across the whole stack (editor, API, queue, worker, seed, tests).
- C++ has no `eval`, so each problem declares its parameter types (`cppSignature`, e.g. `["vector<int>", "int"]`). `services/execution/harness.js` generates a C++ program that parses the JSON test input into exactly those types, calls your `solve(...)`, and serializes the result. It supports `int`, `long long`, `double`, `bool`, `char`, `string` and nested `vector`s, plus in-place (`void`) solutions like Move Zeroes.
- New **Compilation Error** status. Compiler output is shown with *your* line numbers (`#line` directives), and a missing or mis-typed `solve` gives a friendly message instead of internal harness errors. AI analysis is skipped when the code doesn't compile.
- Crashes get readable hints (segmentation fault, division by zero, abort).
- The harness is written to compile under C++14, matching Judge0's GCC 9.2, and is verified with `-std=c++14 -Wall`.
- Signatures are validated against an allowlist, so a problem author can't inject code into the generated harness.

### New: Judge0 execution mode (`services/execution/judge0.js`)
- Sends the program to a Judge0 instance over HTTP (base64, token, polling). All test cases go in one request. Defaults match Judge0 CE: Node 12.14 (63), Python 3.8 (71), C++ GCC 9.2 (54); override with `JUDGE0_LANG_*`.
- Works with the public instance, a self-hosted one (`JUDGE0_AUTH_TOKEN`), or RapidAPI (`JUDGE0_RAPIDAPI_KEY`).
- Judge0 outages and internal errors throw, so the queue retries them. Problems in the user's code come back as normal verdicts.
- Docker mode also supports C++ now (the sandbox image includes g++; it compiles in one container and runs in another with tighter limits).

### New: UI redesign
- Landing page, redesigned navbar (sticky, active-link indicator, avatar), two-column login/sign-up, 404 page.
- Problems page: progress bar, solved ticks, difficulty filters with counts, loading skeletons.
- Workspace: language tabs, custom Monaco theme, **saved code drafts per problem and language**, Reset, **Ctrl/Cmd+Enter** to submit, status stepper (Queued, Running, Verdict), per-test progress bar, failing-case display, compiler output block, AI analysis card, inline `code` in problem text, mobile layout.
- Profile: stat cards, donut chart with center total, acceptance rate, per-submission language, time and status. Stats refresh after an accepted submission (before, they stayed stale until a page reload).
- Fixes: the old `font-800`/`font-700` classes don't exist in Tailwind, so headings were never bold. A design-token system and shared components replaced them.

### Bugs found and fixed along the way
- Output without a trailing newline (`printf("x")`, `process.stdout.write`) could swallow a result record. Records now always start on a fresh line.
- Error line numbers were off by one in Python and JavaScript; they now match the editor.
- Compile errors no longer show a "0/3 tests" bar.

### Tests (95, all passing)
- Reference solutions for **all 13 problems in all 3 languages** run through the real executor against the seed's tests.
- C++ scenarios: accepted, wrong answer, compile error, missing/wrong `solve`, segfault, exception, timeout, hidden-test redaction, injection attempt.
- The Judge0 adapter against a mock Judge0 that speaks the real API (and really executes the code), including retries on outages.

### Verified in a real browser
I ran the built frontend in headless Chromium against a mocked API and drove it end to end: language switch to C++, submit, queued/running, accepted, AI analysis, wrong answer, hidden-test failure, compile error, draft/language persistence, and the Ctrl+Enter shortcut.

### Not verified (please check on your side)
- **The real Judge0 service.** The adapter follows the official Judge0 CE API and language ids, and passes against a faithful mock, but I couldn't reach `ce.judge0.com` from my environment. Try one submission in each language. I also couldn't confirm the current rate limits or availability of the free public instance. If it's unreliable, use the RapidAPI-hosted version or self-host. Remember it sends submitted code to that host.
- The Docker path (no Docker daemon here).
- MongoDB, Redis and the full queue-to-worker-to-socket flow (not available here); the API, executor and UI layers are covered by tests.
- The Monaco editor itself and Google Fonts (their CDNs are blocked in my sandbox, so screenshots show a loading placeholder and fallback fonts).

---

## Round 1 checklist (still applies)

1. **Rotate your secrets.** Your `backend/.env` was inside the zip you shared. Even though it is gitignored, treat the MongoDB password, Redis password and JWT secret as exposed:
   - MongoDB Atlas: Database Access -> edit user -> new password
   - Redis Cloud: regenerate the database password
   - New JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
2. **Check git history for committed secrets:** `git log -p --all -- backend/.env frontend/.env`. If anything shows up, rotating (step 1) is mandatory and you may want to rewrite history.
3. **Update your host env vars** (Render): `NODE_ENV=production`, `CLIENT_ORIGINS=https://dsa-debug-nxmf.vercel.app`, the new `JWT_SECRET` (the server now refuses to start in production with fewer than 32 characters), and `GROQ_API_KEY`.
4. **Render start command:** use `npm run start:all` (runs the API and the worker, same as your old `start.js`).
5. Copy these files over your repo, `cd backend && npm install`, run `npm test`, commit and push.
6. Promote yourself: `cd backend && npm run make-admin -- your@email.com`. Re-run `npm run seed` once so Two Sum picks up `compareMode: "unordered"`.

## Fixes

### Security
- **Sandbox** (`services/executionService.js`, `sandbox/Dockerfile`): submissions can run in Docker (no network, memory/CPU/pid caps, read-only filesystem, all capabilities dropped, non-root user) or on a hosted Judge0 sandbox (see Round 2). `EXEC_MODE=auto` picks Docker, then Judge0 if configured, and otherwise falls back to local mode with a loud warning. Local mode is documented as development-only, and the old misleading "no secrets leak" comment is gone.
- Output is size-capped, the whole process tree is killed on timeout, and results are read only from nonce-prefixed lines, so `console.log`/`print` no longer breaks grading and fake result lines are ignored.
- Hidden tests: failures and runtime errors on them are redacted (no input, expected output or error text). Previously a wrong answer on a hidden case returned its input and expected output.
- Admin role (`User.role`, `requireAdmin`, `npm run make-admin`): `POST /api/problems` is no longer open to every logged-in user, and its body is validated and whitelisted.
- Input validation: type checks on every field (blocks NoSQL operator injection such as `{"email": {"$ne": null}}`), username/email rules, password 8-72 characters, code length cap, query-string filters sanitized.
- Rate limits: failed-login limiter, register limiter, **per-user** submission limiter (was per-IP), and a cap of 3 pending submissions per user.
- JWT pinned to HS256 for REST and sockets, 32+ character secret enforced in production, login timing equalized, 500-level error messages hidden in production, `CLIENT_ORIGINS` handled safely.

### Correctness and reliability
- Queue: 2 attempts with exponential backoff for infrastructure failures; the worker rethrows so BullMQ can retry, and only shows an error after the last attempt.
- A reaper fails submissions stuck on `queued`/`running` for more than 5 minutes (worker crash or deploy).
- User stats are updated atomically (no double counting under concurrency).
- The AI client is created lazily. Before, a missing `GROQ_API_KEY` crashed the worker at startup. The AI response is parsed defensively, validated and length-capped; the prompt marks user code as untrusted.
- Two Sum accepts either index order (`compareMode: "unordered"`); output comparison is a proper deep equality instead of key-order-sensitive `JSON.stringify`.
- In-place solutions that return nothing (for example Move Zeroes) are graded on the mutated argument.
- All test cases run in one process, not one per test. Fewer container starts, so judging is much faster.
- Importing the queue module no longer opens a Redis connection.
- Graceful shutdown for API and worker.

### Cleanup
- Removed the half-built C++ executor, the never-updated `attempted` stat, the unused `@anthropic-ai/sdk` dependency, and the debug `console.log`s (including logging of user code output and socket payloads). A leveled logger (`LOG_LEVEL`) replaces them.
- README now matches the code (Groq, 13 problems, worker modes, what the sandbox does and does not cover) and includes an architecture diagram. Added `.env.example` files and a stricter `.gitignore`.

### Frontend
- Socket first; polling is only a slow fallback (previously it polled every second as well).
- Submit and load errors are shown instead of leaving the button stuck on "Running...".
- Hidden-test failures show a helpful message, and the password minimum matches the server.
- Heavy pages (Monaco, charts) are lazy-loaded: the initial JS dropped from 645 kB to 266 kB.

### Tests and CI
- 95 tests (`cd backend && npm test`) and a GitHub Actions workflow running the tests plus the frontend build.

