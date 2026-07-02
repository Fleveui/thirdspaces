# Project Structure

Complete file and folder organization for the Community Space Sharing Platform.

```
thirdspaces/
├── backend/                         — FastAPI server (Python)
│   ├── main.py                     — entry point, starts the server, registers routes
│   ├── config.py                   — all configuration (ports, paths, keys)
│   ├── models.py                   — database schema (users, spaces, bookings, chat, ratings)
│   ├── database.py                 — SQLite connection, schema migration on startup
│   ├── dependencies.py             — shared auth: get_current_user, get_optional_user
│   ├── import_excel.py             — script to import data from database edt.xlsx
│   ├── seed_data.py                — demo seed (Milan + Bolzano spaces, bookings, demoowner)
│   ├── routes/
│   │   ├── auth.py                 — API endpoints: /api/auth/* (register, login, me, logout)
│   │   ├── spaces.py               — API endpoints: /api/spaces/* (create, search, mine, photos)
│   │   ├── bookings.py             — API endpoints: /api/bookings/* (create, mine, approve, sign, rate)
│   │   └── chat.py                 — API endpoints: /api/chat/* + WebSocket per booking
│   ├── services/
│   │   ├── auth.py                 — business logic (password hashing, token generation)
│   │   ├── spaces.py               — business logic (create_space, search_spaces, list_by_owner)
│   │   └── bookings.py             — business logic (create, approve/reject, contracts, ratings)
│   ├── uploads/                    — uploaded space photos (served at /uploads/)
│   ├── tests/
│   │   ├── conftest.py             — pytest fixtures (in-memory DB, test client, auth tokens)
│   │   ├── test_health.py          — health endpoint tests
│   │   ├── test_auth_service.py    — unit tests for auth service
│   │   ├── test_auth_routes.py     — API tests for auth routes
│   │   ├── test_spaces_service.py  — unit tests for spaces service
│   │   ├── test_spaces_routes.py   — API tests for spaces routes (incl. exclude-own)
│   │   ├── test_bookings_service.py — unit tests for bookings service
│   │   └── test_bookings_routes.py — API tests for bookings routes
│   ├── pytest.ini                  — pytest configuration
│   ├── requirements.txt            — Python dependencies (FastAPI, SQLAlchemy, pandas, etc.)
│   ├── requirements-dev.txt        — dev dependencies (pytest, httpx)
│   ├── Dockerfile                  — container image for backend
│   ├── README.md                   — backend-specific setup notes
│   └── app.db                      — SQLite database (created at runtime)
│
├── frontend/                        — Next.js web app (TypeScript/React)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           — root layout, IBM Plex Sans, AuthProvider
│   │   │   ├── page.tsx             — landing splash (login / join us)
│   │   │   ├── login/
│   │   │   │   └── page.tsx         — login form (Match for Space design)
│   │   │   ├── register/
│   │   │   │   ├── page.tsx         — registration form (terms/privacy)
│   │   │   │   └── verified/
│   │   │   │       └── page.tsx     — post-registration confirmation
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         — home hub (Find a space / My spaces cards)
│   │   │   ├── find/
│   │   │   │   └── page.tsx         — Find mode: search, filters, my booking requests
│   │   │   ├── host/
│   │   │   │   └── page.tsx         — Host mode: listings, incoming requests, add space
│   │   │   ├── messages/
│   │   │   │   └── page.tsx         — chat conversations (WebSocket)
│   │   │   ├── bookings/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     — booking detail (approve, sign, rate)
│   │   │   ├── spaces/
│   │   │   │   ├── page.tsx         — redirects to /find
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     — space detail + Book Now
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     — list-a-space form
│   │   │   └── globals.css          — global styles (Tailwind, .btn, .input, .card)
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   — wrapper for authenticated pages
│   │   │   ├── AppShell.tsx         — page shell with header and back links
│   │   │   ├── ModeNav.tsx          — Find | My spaces header toggle
│   │   │   ├── BookingGroups.tsx    — three-column booking request layout
│   │   │   ├── LogoMark.tsx         — purple circle logo (house + sparkle)
│   │   │   └── PasswordInput.tsx    — password field with visibility toggle
│   │   └── lib/
│   │       ├── auth.tsx             — React Context for authentication state
│   │       ├── bookings.ts          — booking types, date/status helpers
│   │       └── spaces.ts            — space types and search helpers
│   ├── package.json                 — Node dependencies (Next.js, Tailwind, shadcn/ui)
│   ├── tsconfig.json                — TypeScript configuration
│   ├── tailwind.config.js           — Tailwind CSS customization
│   ├── postcss.config.js            — PostCSS setup (for Tailwind)
│   ├── next.config.js               — Next.js configuration
│   ├── .env.local                   — environment variables (API URL)
│   ├── Dockerfile                   — container image for frontend
│   └── .next/                       — Next.js build output (created at runtime)
│
├── docker-compose.yml               — orchestrates backend + frontend containers
├── start.sh                         — script to start all services (./start.sh)
├── stop.sh                          — script to stop all services (./stop.sh)
│
├── DECISIONS.md                     — all implementation decisions (see for context)
├── ARCHITECTURE.md                  — system diagram and tech stack explanation
├── STRUCTURE.md                     — this file
├── ERRORS.md                        — errors found and fixed during testing
├── README.md                        — how to run, stop, and use the system
├── AGENTS.md                        — guidelines for AI agents working in this repo
│
├── app-requirements.md              — original specification from the student
└── PRE-SYSTEM-INSTRUCTION.md        — guidelines for the builder
```

## Key Files Explained

### Backend Files

**main.py**
- Entry point for the FastAPI server
- Imports and registers auth, spaces, bookings, and chat routes
- Mounts `/uploads/` for space photos
- Sets up CORS for frontend communication

**config.py**
- Centralized configuration (ports, database path, JWT secret, etc.)
- All settings in one place for easy modification

**models.py**
- Database schema definitions using SQLAlchemy ORM
- Tables: `users`, `personal_account`, `business_account`, `spaces`, `booking`, `space_photo`, `conversation`, `message`, `rating`
- `spaces` includes `description`, `rules`, `exchange_preferences`
- `booking` includes `exchange_offer`, `intended_use`, contract fields, signing timestamps

**database.py**
- Manages SQLite connection
- Provides `get_db()` dependency for FastAPI routes
- Creates tables on startup
- Runs lightweight migrations (e.g. adds new columns if missing)

**dependencies.py**
- Shared FastAPI auth dependencies used across routes
- `get_current_user()` — verifies JWT from `Authorization: Bearer` header (required)
- `get_optional_user()` — returns user if valid token present, else `None` (for public search)

**routes/auth.py**
- HTTP endpoints for authentication
- `POST /api/auth/register` — create new account (links PersonalAccount or BusinessAccount)
- `POST /api/auth/login` — authenticate and get JWT token
- `GET /api/auth/me` — get current user info (requires token)
- `POST /api/auth/logout` — client-side cleanup

**routes/spaces.py**
- HTTP endpoints for space listings
- `POST /api/spaces` — create listing (any logged-in user + JWT)
- `GET /api/spaces/mine` — owner's listings (JWT)
- `GET /api/spaces` — search/filter; excludes own listings when authenticated
- `GET /api/spaces/{id}` — public space detail
- `POST /api/spaces/{id}/photos` — upload space photo

**routes/bookings.py**
- HTTP endpoints for booking lifecycle
- `POST /api/bookings` — borrower creates booking request
- `GET /api/bookings/mine` — owner's incoming requests
- `GET /api/bookings/my-requests` — borrower's outgoing requests
- `GET /api/bookings/{id}` — booking detail (owner or borrower)
- `PATCH /api/bookings/{id}/approve|reject|sign` — owner actions and contract signing
- `POST /api/bookings/{id}/rate` — post-visit rating

**routes/chat.py**
- REST + WebSocket chat for approved bookings
- `GET /api/chat/conversations` — list conversations for current user
- `GET /api/chat/{id}/messages` — message history
- WebSocket `/api/chat/ws/{booking_id}` — real-time messaging

**services/bookings.py**
- Business logic for full booking lifecycle
- `create_booking()`, `list_bookings_for_owner()`, `list_bookings_for_borrower()`
- Approve/reject, contract generation and signing, ratings

**services/auth.py**
- Business logic for authentication
- Password hashing with bcrypt
- JWT token generation and verification
- User registration (creates linked account record) and login validation

**services/spaces.py**
- Business logic for space listings
- `create_space()` — validates fields, sets `owner_id` from authenticated `users.id`
- `search_spaces(exclude_owner_id)` — filterable search for Find mode
- `list_spaces_by_owner()` — returns spaces for the current owner, newest first

**import_excel.py**
- Standalone script to import data from Excel file
- Reads: database edt.xlsx (5 sheets)
- Creates: ORM objects and saves to SQLite
- Usage: `python3 import_excel.py`
- See DECISIONS.md #12 and #13 for details

**seed_data.py**
- Standalone script to populate demo data in English
- Clears and re-seeds business accounts, spaces, bookings (pending/approved/rejected)
- Milan spaces on owner1; 4 Bolzano spaces on owner2 (Alpine Loft, Walther Terrace, Makers Studio, Community Garden)
- Creates demo login `demoowner` / `secret12` (User.id matches owner1)
- Usage: `python3 seed_data.py`

**tests/**
- Pytest suite run from `backend/` with `pytest`
- Uses in-memory SQLite and dependency overrides (see `conftest.py`)
- Covers auth, spaces (incl. exclude-own when authenticated), bookings, and chat (61+ tests)

### Frontend Files

**src/app/layout.tsx**
- Root layout component
- Loads IBM Plex Sans via `next/font/google`
- Wraps entire app with `AuthProvider`
- App title: Match for Space

**src/components/AppShell.tsx**
- Shared page shell for Find/Host/task pages
- Header with `LogoMark`, `ModeNav`, logout
- Configurable back link (e.g. to `/find` or `/host`)

**src/components/ModeNav.tsx**
- Persistent header toggle: **Find** | **My spaces**
- Highlights active mode based on current route

**src/components/BookingGroups.tsx**
- Reusable three-column layout for booking requests
- Groups: Pending Approval, Confirmed, Rejected
- Used on `/host` and `/find` (my requests)

**src/app/dashboard/page.tsx**
- Protected route (requires authentication)
- Home hub with two mode cards: Find a space → `/find`, My spaces → `/host`
- Optional badges for pending counts

**src/app/find/page.tsx**
- Find mode: search and filter spaces
- Sends `Authorization` header so own listings are excluded
- "My booking requests" section via `BookingGroups`

**src/app/host/page.tsx**
- Host mode: your listings, incoming booking requests
- "Add a space" CTA → `/spaces/new`
- Uses `AppShell` + `ModeNav`

**src/app/messages/page.tsx**
- Chat UI: conversation list and WebSocket messaging per booking

**src/app/register/verified/page.tsx**
- Post-registration confirmation screen

**src/lib/spaces.ts**
- TypeScript types for space API responses
- Search/filter helpers for Find mode

**src/lib/bookings.ts**
- TypeScript types for booking API responses
- Helpers: `statusLabel`, `formatDate`, `formatDateRange`, `exchangeOfferPreview`

**src/app/bookings/[id]/page.tsx**
- Protected route for owner or borrower
- Approve/reject (owner), contract signing (both), ratings (after visit)

**src/app/spaces/[id]/page.tsx**
- Space detail with description, rules, exchange_preferences, photos
- Book Now form for authenticated users
- Uses `AppShell` with back link to `/find`

**src/app/spaces/new/page.tsx**
- Protected route for any logged-in user
- Form to create a listing (`POST /api/spaces`)
- On success: redirects to `/host`

**src/app/spaces/page.tsx**
- Redirects to `/find` (legacy route)

**src/components/ProtectedRoute.tsx**
- Wrapper component for pages that require authentication
- Checks if user is logged in
- Redirects to /login if not authenticated

**src/app/page.tsx**
- Landing splash (/)
- Shows logo, **Match for Space** title, **login** and **join us!** buttons
- If logged in: redirects to `/dashboard`

**src/lib/auth.tsx**
- React Context for authentication state management
- `AuthProvider` component manages login state and token persistence
- `useAuth()` hook provides: user, login(), register(), logout(), loading, error
- Stores JWT token in localStorage (see DECISIONS.md #5)

### Docker & Orchestration

**docker-compose.yml**
- Defines both backend and frontend services
- Sets environment variables, volumes, ports
- Establishes network between services
- Health checks for both services

**start.sh** / **stop.sh**
- Bash scripts to start/stop all services via Docker Compose

### Documentation

**DECISIONS.md** — implementation choices and rationale
**ARCHITECTURE.md** — system diagram, data flows, current phase
**STRUCTURE.md** — this file
**README.md** — user-facing setup and usage guide

## Data Flow: Authentication

1. User visits http://localhost:3000 → landing splash (**src/app/page.tsx**)
2. If logged in → redirect to `/dashboard`; otherwise show **login** / **join us!** buttons
3. User opens **/login** or **/register** and submits credentials
4. Frontend calls `POST /api/auth/login` or `POST /api/auth/register` (via useAuth)
5. Backend **routes/auth.py** → **services/auth.py** → JWT + user info
6. Register with terms acceptance → redirect to **/register/verified**, then login
7. Frontend stores token in localStorage → redirects to **/dashboard** (home hub)

## Data Flow: Find Mode

1. User chooses **Find a space** on hub → **/find**
2. `GET /api/spaces` with Bearer token → backend excludes own listings
3. User filters by location/category → clicks space → **/spaces/{id}**
4. Book Now → `POST /api/bookings` → request appears in **My booking requests** on `/find`

## Data Flow: Host Mode

1. User chooses **My spaces** on hub → **/host**
2. `GET /api/spaces/mine` → listings with links to `/spaces/{id}`
3. `GET /api/bookings/mine` → **BookingGroups** (pending / confirmed / rejected)
4. Add a space → **/spaces/new** → `POST /api/spaces` → back to `/host`

## Data Flow: Booking Lifecycle

1. Borrower books from space detail → status `pending`
2. Owner approves on `/host` or `/bookings/{id}` → `PATCH approve`
3. Both sign contract on `/bookings/{id}` → `PATCH sign`
4. After visit → `POST /api/bookings/{id}/rate`
5. Chat available at `/messages` via WebSocket

## Current Phase

**Implemented:**
- **Match for Space UI** — purple `#a166ff`, IBM Plex Sans, landing splash, redesigned login/register
- **Find/Host split** — `/dashboard` hub, `/find`, `/host`, `ModeNav`, `AppShell`
- Authentication with linked account records and `/register/verified`
- Space search with filters; own listings excluded when authenticated
- Create listing, photo upload, `exchange_preferences`
- Full booking lifecycle: request, approve/reject, contracts, ratings
- Real-time chat (`/messages`, WebSocket)
- Demo seed: Milan + Bolzano spaces, `demoowner` / `secret12`
- Backend tests (61+)

**Next:**
- Availability calendar widget
- Saved spaces / favourites
- Production deployment (PostgreSQL, HTTPS, refresh tokens)
