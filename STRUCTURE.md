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
│   │   │   ├── page.tsx             — landing splash + inline login (redirects if logged in)
│   │   │   ├── login/
│   │   │   │   └── page.tsx         — redirects to / (login lives on landing)
│   │   │   ├── register/
│   │   │   │   ├── page.tsx         — registration form (terms/privacy)
│   │   │   │   └── verified/
│   │   │   │       └── page.tsx     — post-registration confirmation
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         — home hub (Find / My booking requests / List your space / Incoming requests)
│   │   │   ├── find/
│   │   │   │   ├── page.tsx         — Find mode: intro, search, filters, results, my booking requests strip
│   │   │   │   └── requests/
│   │   │   │       └── page.tsx     — borrower's outgoing booking requests
│   │   │   ├── host/
│   │   │   │   ├── page.tsx         — Host mode: intro hub + listings view (?view=listings)
│   │   │   │   └── requests/
│   │   │   │       └── page.tsx     — incoming booking requests (approve/reject, cream theme)
│   │   │   ├── messages/
│   │   │   │   └── page.tsx         — chat conversations (WebSocket)
│   │   │   ├── bookings/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     — booking detail (approve, sign, rate)
│   │   │   ├── spaces/
│   │   │   │   ├── page.tsx         — redirects to /find
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     — space detail (find + own-listing host views)
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     — list-a-space form (cream inputs)
│   │   │   └── globals.css          — global styles (Tailwind, .btn, .input, .card, host cream)
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   — wrapper for authenticated pages
│   │   │   ├── AppShell.tsx         — page shell (full or minimal variant)
│   │   │   ├── PageHeader.tsx       — back arrow + title (contextual navigation)
│   │   │   ├── HubActionCard.tsx    — dashboard mode cards + request strips
│   │   │   ├── SpaceCard.tsx        — listing card/row (find or host accent; request badge on host)
│   │   │   ├── IncomingRequestCard.tsx — host incoming request card (cream/green/red status)
│   │   │   ├── MyBookingRequestCard.tsx — borrower booking request card (find accent)
│   │   │   ├── CategoryChips.tsx    — category selector (find or host variant)
│   │   │   ├── FilterPanel.tsx      — find-mode filter panel
│   │   │   ├── SearchBar.tsx        — find-mode search input
│   │   │   ├── LogoMark.tsx         — logo (badge / mark variants)
│   │   │   ├── SparkleIcon.tsx      — star/sparkle icon (CSS mask)
│   │   │   ├── ModeNav.tsx          — Find | My spaces header toggle (legacy full shell)
│   │   │   ├── BookingGroups.tsx    — three-column booking layout (legacy)
│   │   │   └── PasswordInput.tsx    — password field with visibility toggle
│   │   └── lib/
│   │       ├── auth.tsx             — React Context + authFetch (401 clears session)
│   │       ├── api.ts               — fetchWithAuth, SessionExpiredError
│   │       ├── bookings.ts          — booking types, status helpers, countBookingsBySpace
│   │       ├── spaces.ts            — space types, categories, EXCHANGE_OPTIONS, LISTING_DEFAULTS
│   │       └── hostNavigation.ts    — hostRequestsHref / hostRequestsBackHref (space_id back nav)
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
- Shared page shell with `mode` (`find` | `host`) and `variant` (`full` | `minimal`)
- Minimal variant: content only (used with `PageHeader` for back navigation)
- Full variant: header with `LogoMark`, `ModeNav`, logout

**src/components/PageHeader.tsx**
- Back arrow button + page title + optional right action
- Used across find/host task pages for consistent contextual navigation

**src/components/HubActionCard.tsx**
- Dashboard mode cards: **Find a space** (purple gradient), **List your space** (cream gradient)
- Strips: `MyBookingRequestsStrip` (find), `IncomingRequestsStrip` (host cream)

**src/components/SpaceCard.tsx**
- Listing card (`layout="card"`) or row (`layout="row"`) with `accent` (`find` | `host`)
- Find row: availability badge (e.g. "Available now")
- Host row: optional `requestCount` — shows clickable request badge linking to `/host/requests?space_id={id}` instead of availability badge

**src/components/IncomingRequestCard.tsx**
- Host incoming request card on `/host/requests`
- Cream avatar and pending badge; confirmed (green) / rejected (red) status and card outlines
- Accept (`btn-host`) / Reject (`btn-host-outline`) on pending requests

**src/app/dashboard/page.tsx**
- Protected route (requires authentication)
- Home hub: Find a space, My booking requests strip, List your space, Incoming requests strip
- Bell icon links to `/host/requests`; optional pending count badges

**src/app/find/page.tsx**
- Find mode: intro hub + results view (mirrors host layout)
- Search, category chips, filters; own listings excluded when authenticated
- My booking requests strip links to `/find/requests`

**src/app/find/requests/page.tsx**
- Borrower's outgoing booking requests (`GET /api/bookings/my-requests`)

**src/app/host/page.tsx**
- Host mode: intro hub (`/host`) and listings view (`/host?view=listings`)
- Fetches `GET /api/spaces/mine` + `GET /api/bookings/mine` for per-space request counts
- `SpaceCard` rows with request badges; back from listings → intro; back from intro → dashboard

**src/app/host/requests/page.tsx**
- Dedicated incoming requests page (pending / confirmed / rejected sections)
- Contextual back: `space_id` query param → `/spaces/{id}`; no param → `/dashboard`

**src/lib/hostNavigation.ts**
- `hostRequestsHref(spaceId?)` — builds `/host/requests` or `/host/requests?space_id={id}`
- `hostRequestsBackHref(spaceId)` — resolves back target for requests page

**src/lib/spaces.ts**
- TypeScript types for space API responses
- `SPACE_CATEGORIES`, `EXCHANGE_OPTIONS`, `LISTING_DEFAULTS` (shared with list + detail forms)
- Search/filter helpers and `availabilityBadge` for find listings

**src/lib/bookings.ts**
- TypeScript types for booking API responses
- Helpers: `statusLabel`, `formatDate`, `formatDateRange`, `exchangeOfferPreview`, `countBookingsBySpace`

**src/lib/api.ts** / **src/lib/auth.tsx**
- `fetchWithAuth` / `authFetch` — attaches Bearer token; 401 clears session (`SessionExpiredError`)

**src/app/spaces/[id]/page.tsx**
- Space detail with all list-a-space fields, photo placeholder, exchange preference options
- **Find view** (not owner): lavender accents, availability badge, Book Now form, back → `/find`
- **Own listing** (owner): host cream accents, request strip above photo (links to `/host/requests?space_id={id}`), no availability badge, back → `/host?view=listings`

**src/app/spaces/new/page.tsx**
- Protected route for any logged-in user
- Cream-themed form (`input-cream`, `btn-host`, `CategoryChips variant="host"`)
- On success: redirects to `/host`

**src/app/spaces/page.tsx**
- Redirects to `/find` (legacy route)

**src/components/ProtectedRoute.tsx**
- Wrapper component for pages that require authentication
- Checks if user is logged in
- Redirects to /login if not authenticated

**src/app/page.tsx**
- Landing splash (/) with inline login form and **join us!** link
- `/login` redirects here; if logged in → `/dashboard`

**src/lib/auth.tsx**
- React Context for authentication state management
- `AuthProvider` manages login state and token persistence
- `useAuth()` provides: user, login(), register(), logout(), **authFetch()**, loading, error
- Stores JWT token in localStorage; 401 responses clear session

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

1. User chooses **List your space** on hub → **/host** (intro: View my listings, Add a space)
2. **View my listings** → `/host?view=listings`
3. `GET /api/spaces/mine` + `GET /api/bookings/mine` → listing rows with per-space request count badges
4. Click listing → **/spaces/{id}** (own-listing detail: all form fields, request strip, back → listings)
5. Click request badge or strip → **/host/requests?space_id={id}** (back → that space detail)
6. Dashboard **Incoming requests** strip → **/host/requests** (back → dashboard)
7. Add a space → **/spaces/new** → `POST /api/spaces` → back to `/host`

## Data Flow: Booking Lifecycle

1. Borrower books from space detail → status `pending`
2. Owner reviews on **/host/requests** or **/bookings/{id}** → `PATCH approve|reject`
3. Both sign contract on `/bookings/{id}` → `PATCH sign`
4. After visit → `POST /api/bookings/{id}/rate`
5. Chat available at `/messages` via WebSocket

## Contextual Back Navigation (Host)

| Page | Entry | Back arrow |
|------|-------|------------|
| `/host` (intro) | Dashboard | `/dashboard` |
| `/host?view=listings` | View my listings | `/host` (intro) |
| `/spaces/{id}` (own) | My listings | `/host?view=listings` |
| `/host/requests` | Dashboard strip/bell | `/dashboard` |
| `/host/requests?space_id={id}` | Listing badge or detail strip | `/spaces/{id}` |

Implemented in `frontend/src/lib/hostNavigation.ts` via `space_id` query parameter.

## Current Phase

**Implemented:**
- **Match for Space UI** — purple find theme (`#a166ff`), host cream theme (`#f7d58f`), IBM Plex Sans, landing login
- **Find/Host split** — `/dashboard` hub with request strips, `/find` (intro + results), `/host` (intro + `?view=listings`), `/host/requests`, `/find/requests`
- **Contextual navigation** — `PageHeader` back arrows; `hostNavigation.ts` for incoming-requests back via `space_id`
- **Space detail** — full list-a-space fields, photo placeholder, owner vs find accents
- **Host listing badges** — per-space booking request counts (replaces "Available now" on My spaces)
- Authentication with linked account records, `authFetch`, session expiry handling
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
