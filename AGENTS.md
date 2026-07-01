# AGENTS.md

Guidance for AI agents working in this repo.

## Language
- **English only.** All code, comments, identifiers, commit messages, docs, and UI copy must be in English.

## Architecture
- **Frontend** (`frontend/`): Next.js 14 (App Router) + React + Tailwind. Pure UI — no server-side DB or auth logic. Talks to the backend over HTTP/WebSocket.
- **Backend** (`backend/`): FastAPI + SQLAlchemy (SQLite `app.db`). Owns all data, auth (bcrypt + PyJWT), and stateful features (uploads, PDFs, real-time chat).
- Auth: backend issues a JWT; the frontend stores it and sends it as `Authorization: Bearer <token>`.

## Dependencies
- Keep the set **minimal**. Don't add a dependency without a clear, in-use reason.
- Frontend is UI-only: no Prisma, no NextAuth, no server frameworks.
- Backend owns persistence and business logic; use FastAPI's native `WebSocket` for real-time (no extra dep).

## Commands
- Frontend: `cd frontend && npm run dev` (build: `npm run build`)
- Backend: `cd backend && uvicorn main:app --reload`
- Both: `./start.sh` / `./stop.sh`

## Reference docs
- `ARCHITECTURE.md` — system diagram
- `STRUCTURE.md` — file organization
- `DECISIONS.md` — implementation choices
