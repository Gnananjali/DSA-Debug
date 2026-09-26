# DSADebug

An AI-powered coding-interview practice platform: solve DSA problems in a Monaco
editor, run your code against test cases through a queued execution engine, and
get Claude-generated complexity analysis and suggestions on every submission.

## Architecture

```
frontend/  React + Vite + Tailwind + Monaco Editor + Socket.IO client
backend/   Express API  ──▶  MongoDB Atlas (users, problems, submissions)
            │                Redis (BullMQ queue + Socket.IO adapter)
            └─▶ execution worker (separate process) ──▶ sandboxed
                 child-process runner (Node / Python) ──▶ Anthropic API
                 for post-run code analysis
```

The API and the execution worker are two separate processes that only talk
through MongoDB and Redis. This means a slow or crashing user submission never
blocks a login request — and you can scale them independently.

## Local setup

### 1. Backend
```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, REDIS_URL, JWT_SECRET, ANTHROPIC_API_KEY
npm install
npm run seed            # loads 3 sample problems
npm run dev              # API on :4000
```
In a second terminal, start the execution worker (it needs the same `.env`):
```bash
cd backend
npm run worker
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

You'll need a free MongoDB Atlas cluster and a free Redis Cloud instance (or
local Redis via `redis://127.0.0.1:6379`) for local dev.

## Deploying

| Piece            | Where        | Notes |
|-------------------|--------------|-------|
| Frontend           | Vercel       | Set `VITE_API_URL` / `VITE_SOCKET_URL` to your Render API URL. |
| API                | Render (Web Service) | Start command `npm start`. Set all backend `.env` vars in Render's dashboard. |
| Execution worker    | Render (Background Worker) | Same repo/env vars, start command `npm run worker`. **This is the piece the original deploy was missing** — without it, submissions sit at "queued" forever. |
| Database            | MongoDB Atlas | Whitelist Render's outbound IPs (or `0.0.0.0/0` for simplicity). |
| Redis              | Redis Cloud  | Free tier is enough for a demo. |

Run `npm run seed` once (locally, pointed at your production `MONGO_URI`) to
load the sample problems into your production database.

## Security notes on code execution

Submitted code runs in a short-lived child process with a hard timeout, a
minimal environment, and no access to server secrets. That's a reasonable
baseline for a portfolio project. If this were to handle real public traffic,
harden it further: run each submission in a locked-down container (Docker/
gVisor with `--network none`, memory + pids limits, a non-root user, and a
read-only filesystem), or delegate to a hardened judge service instead of
executing directly on the API host.

## What's included vs. left for you to extend

**Included and working end-to-end:** JWT auth, problem CRUD + listing/filtering,
Monaco-based code editor, queued execution for JavaScript and Python, real-time
submission status over Socket.IO (Redis-backed so it works across multiple
API instances), AI complexity/suggestion analysis via Claude, per-user stats
and a profile dashboard, rate limiting on the expensive submission route.

**Left as good next steps:** an admin UI for adding problems (the API route
exists, gate it behind a real role check), a global leaderboard, C++/Java
support in `executionService.js`, and Docker-based sandboxing for the
execution worker if this ever needs to handle untrusted public traffic.
