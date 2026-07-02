# Project Structure

Complete file and folder organization for the Community Space Sharing Platform.

```
thirdspaces/
├── backend/                         — FastAPI server (Python)
│   ├── main.py                     — entry point, starts the server, registers routes
│   ├── config.py                   — all configuration (ports, paths, keys)
│   ├── models.py                   — database schema (users + 5 Excel tables)
│   ├── database.py                 — SQLite connection, schema migration on startup
│   ├── dependencies.py             — shared auth: get_current_user, require_space_owner
│   ├── import_excel.py             — script to import data from database edt.xlsx
│   ├── seed_data.py                — demo seed (spaces, bookings, demoowner login)
│   ├── routes/
│   │   ├── auth.py                 — API endpoints: /api/auth/* (register, login, me, logout)
│   │   ├── spaces.py               — API endpoints: /api/spaces/* (create, list, mine, detail)
│   │   └── bookings.py             — API endpoints: /api/bookings/* (mine, detail, approve, reject)
│   ├── services/
│   │   ├── auth.py                 — business logic (password hashing, token generation)
│   │   ├── spaces.py               — business logic (create_space, list_spaces_by_owner)
│   │   └── bookings.py             — business logic (list/get/update owner bookings)
│   ├── tests/
│   │   ├── conftest.py             — pytest fixtures (in-memory DB, test client, auth tokens)
│   │   ├── test_health.py          — health endpoint tests
│   │   ├── test_auth_service.py    — unit tests for auth service
│   │   ├── test_auth_routes.py     — API tests for auth routes
│   │   ├── test_spaces_service.py  — unit tests for spaces service
│   │   ├── test_spaces_routes.py   — API tests for spaces routes
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
│   │   │   │   └── page.tsx         — registration form
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         — protected dashboard (listings + booking columns)
│   │   │   ├── bookings/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     — booking detail (approve/reject)
│   │   │   ├── spaces/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx     — public space detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     — list-a-space form (space_owner only)
│   │   │   └── globals.css          — global styles (Tailwind, .btn, .input, .card)
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx   — wrapper for authenticated pages
│   │   │   ├── LogoMark.tsx         — purple circle logo (house + sparkle)
│   │   │   └── PasswordInput.tsx    — password field with visibility toggle
│   │   └── lib/
│   │       ├── auth.tsx             — React Context for authentication state
│   │       └── bookings.ts          — booking types, date/status helpers
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
- Imports and registers auth, spaces, and bookings routes
- Sets up CORS for frontend communication

**config.py**
- Centralized configuration (ports, database path, JWT secret, etc.)
- All settings in one place for easy modification

**models.py**
- Database schema definitions using SQLAlchemy ORM
- Tables: `users` (JWT auth), `personal_account`, `business_account`, `spaces`, `booking`, `space_photo`
- `spaces` includes `description` and `rules` (Text, nullable) for listing details
- `booking` includes `exchange_offer` (Text, nullable) for what the borrower offers in exchange

**database.py**
- Manages SQLite connection
- Provides `get_db()` dependency for FastAPI routes
- Creates tables on startup
- Runs lightweight migrations (e.g. adds `exchange_offer` to `booking` if missing)

**dependencies.py**
- Shared FastAPI auth dependencies used across routes
- `get_current_user()` — verifies JWT from `Authorization: Bearer` header
- `require_space_owner()` — returns 403 if `account_type` is not `space_owner`

**routes/auth.py**
- HTTP endpoints for authentication
- `POST /api/auth/register` — create new account
- `POST /api/auth/login` — authenticate and get JWT token
- `GET /api/auth/me` — get current user info (requires token)
- `POST /api/auth/logout` — client-side cleanup

**routes/spaces.py**
- HTTP endpoints for space listings
- `POST /api/spaces` — create listing (space_owner + JWT)
- `GET /api/spaces/mine` — owner's listings, id/name/location only (space_owner + JWT)
- `GET /api/spaces` — public list of all spaces
- `GET /api/spaces/{id}` — public space detail

**routes/bookings.py**
- HTTP endpoints for space owner booking management
- `GET /api/bookings/mine` — all bookings for owner's spaces (space_owner + JWT)
- `GET /api/bookings/{id}` — single booking detail
- `PATCH /api/bookings/{id}/approve` — approve pending booking
- `PATCH /api/bookings/{id}/reject` — reject pending booking

**services/bookings.py**
- Business logic for owner booking requests
- `list_bookings_for_owner()` — joins booking, space, personal_account
- `get_booking_for_owner()` — single booking with authorization check
- `update_booking_status()` — pending → approved | rejected only

**services/auth.py**
- Business logic for authentication
- Password hashing with bcrypt
- JWT token generation and verification
- User registration and login validation

**services/spaces.py**
- Business logic for space listings
- `create_space()` — validates fields, sets `owner_id` from authenticated `users.id`
- `list_spaces_by_owner()` — returns spaces for the current owner, newest first

**import_excel.py**
- Standalone script to import data from Excel file
- Reads: database edt.xlsx (5 sheets)
- Creates: ORM objects and saves to SQLite
- Handles mapping:
  - "personal account" sheet → personal_account table
  - "buissiness account" sheet → business_account table
  - "space" sheet → space table
  - "Booking" sheet → booking table
  - "item photo" sheet → space_photo table
- Usage: `python3 import_excel.py`
- Note: Does NOT import passwords (security: set via registration)
- Idempotent: safe to run multiple times
- See DECISIONS.md #12 and #13 for details

**seed_data.py**
- Standalone script to populate demo data in English
- Clears and re-seeds business accounts, spaces, bookings (pending/approved/rejected), exchange_offer text
- Creates demo login `demoowner` / `secret12` (User.id matches owner1 business account)
- Usage: `python3 seed_data.py`

**tests/**
- Pytest suite run from `backend/` with `pytest`
- Uses in-memory SQLite and dependency overrides (see `conftest.py`)
- Covers auth, spaces, and bookings routes/services (58 tests)

### Frontend Files

**src/app/layout.tsx**
- Root layout component
- Loads IBM Plex Sans via `next/font/google`
- Wraps entire app with `AuthProvider`
- App title: Match for Space

**src/lib/bookings.ts**
- TypeScript types for owner booking API responses
- Helpers: `statusLabel`, `formatDate`, `formatDateRange`, `exchangeOfferPreview`

**src/components/LogoMark.tsx**
- SVG logo: purple circle with white house outline and sparkle

**src/components/PasswordInput.tsx**
- Password input with visibility toggle and `SparkleIcon` helper

**src/app/login/page.tsx**
- Login page ("Wow you're back!" — Match for Space design)
- Username + `PasswordInput`, forgot-password link (UI only)
- On success: redirects to /dashboard

**src/app/register/page.tsx**
- Registration page ("Nice to meet you!")
- Account type, username, email, passwords via `PasswordInput`
- On success: automatically logs in and redirects to dashboard

**src/app/dashboard/page.tsx**
- Protected route (requires authentication)
- Header with `LogoMark` and Match for Space branding
- Space owners: **List a Space**, **Your Listings** (links to `/spaces/{id}`)
- **Booking Requests** in three columns: Pending Approval, Confirmed, Rejected
- Pending bookings: inline Accept/Reject; all rows link to `/bookings/{id}`
- Regular users: placeholder sections for bookings, saved spaces, messages

**src/app/bookings/[id]/page.tsx**
- Protected route for space owners only
- Fetches booking via `GET /api/bookings/{id}`
- Shows space, borrower, dates, exchange_offer, status
- Accept/Reject buttons for pending bookings

**src/app/spaces/[id]/page.tsx**
- Public route (no ProtectedRoute)
- Fetches space via `GET /api/spaces/{id}`
- Displays name, location, description, rules with empty-state fallbacks
- Handles loading, 404, and error states
- Link back to `/dashboard`

**src/app/spaces/new/page.tsx**
- Protected route for space owners only
- Form to create a listing (`POST /api/spaces`)
- Fields: name, location, area, category, indoor/outdoor, availability, description, rules, deposit
- Redirects non-owners to `/dashboard`
- On success: redirects to `/dashboard`

**src/components/ProtectedRoute.tsx**
- Wrapper component for pages that require authentication
- Checks if user is logged in
- Redirects to /login if not authenticated
- Shows loading state while checking

**src/app/page.tsx**
- Landing splash (/)
- Shows logo, **Match for Space** title, **login** and **join us!** buttons
- If logged in: redirects to `/dashboard`

**src/lib/auth.tsx**
- React Context for authentication state management
- `AuthProvider` component manages login state and token persistence
- `useAuth()` hook provides: user, login(), register(), logout(), loading, error
- Stores JWT token in localStorage (see DECISIONS.md #5)

**globals.css**
- Tailwind CSS imports
- Shared design system: `.card`, `.btn-primary`, `.btn-outline`, `.btn-secondary`, `.input`
- Primary color `#a166ff` via Tailwind `primary` token

**tailwind.config.js**
- Tailwind CSS customization
- Match for Space palette: `primary` (#a166ff), `primary-dark`, `primary-light`

**tsconfig.json**
- TypeScript compiler configuration
- Sets up path aliases (@/* points to src/*)

**.env.local**
- Frontend environment variables (not committed to git)
- Sets API URL: `NEXT_PUBLIC_API_URL=http://localhost:8000`

**requirements.txt**
- Python dependencies for backend
- Key packages: FastAPI, SQLAlchemy, passlib (bcrypt), PyJWT

**requirements-dev.txt**
- Dev/test dependencies: pytest, httpx

**pytest.ini**
- Pytest root config for `backend/tests/`

### Docker & Orchestration

**docker-compose.yml**
- Defines both backend and frontend services
- Sets environment variables, volumes, ports
- Establishes network between services
- Health checks for both services

**backend/Dockerfile**
- Python 3.11 slim image
- Installs dependencies from requirements.txt
- Runs main.py on port 8000

**frontend/Dockerfile**
- Node 18 alpine image
- Installs npm dependencies
- Runs `npm run dev` on port 3000

**start.sh**
- Bash script to start everything
- Checks for Docker installation
- Runs `docker-compose up -d`
- Waits for services to be healthy
- Opens app in default browser

**stop.sh**
- Bash script to stop all services
- Runs `docker-compose down`

### Documentation

**DECISIONS.md**
- Documents every implementation choice
- Explains what was unclear in the spec, what was decided, why, and alternatives
- Reference point when modifying the system

**ARCHITECTURE.md**
- ASCII diagram showing how components connect
- Explanation of tech stack choices
- Data flow walkthrough (auth, listings, space detail, owner bookings)
- Frontend design system (Match for Space)
- Component list with how each runs

**STRUCTURE.md**
- This file
- Complete file tree with one-line descriptions
- Explains what each file does and why it exists

**ERRORS.md**
- Log of errors encountered during development
- What caused each error
- How it was fixed
- Learning outcome: building software is iterative

**README.md**
- User-facing documentation
- Prerequisites and setup instructions
- How to run and stop the system
- Troubleshooting common issues

**AGENTS.md**
- Conventions and context for AI agents editing this repo

## Data Flow: Authentication

1. User visits http://localhost:3000 → landing splash (**src/app/page.tsx**)
2. If logged in → redirect to `/dashboard`; otherwise show **login** / **join us!** buttons
3. User opens **/login** or **/register** and submits credentials
4. Frontend calls `POST /api/auth/login` or `POST /api/auth/register` (via useAuth)
5. Backend **routes/auth.py** receives request
6. **services/auth.py** validates credentials against **models.py** (users table in SQLite)
7. If valid: **services/auth.py** creates JWT token using **config.py** SECRET_KEY
8. Backend returns token + user info to frontend
9. Frontend stores token in localStorage (via AuthProvider in **src/lib/auth.tsx**)
10. Frontend redirects to **/dashboard**
11. **src/app/dashboard/page.tsx** (wrapped in ProtectedRoute) displays user info and owner tools
12. User can log out → clears token → can return to landing or login

## Data Flow: Space Listings (Space Owner)

1. Owner clicks **List a Space** on dashboard → **/spaces/new**
2. Owner submits form → `POST /api/spaces` with Bearer token
3. **dependencies.py** → `require_space_owner` → **services/spaces.py** → `create_space()`
4. New row in `spaces` table (`owner_id` = `users.id`)
5. Redirect to dashboard
6. Dashboard calls `GET /api/spaces/mine` → renders **Your Listings** (name + location, each linking to `/spaces/{id}`)

## Data Flow: Space Detail Page

1. User clicks listing on dashboard or opens `/spaces/{id}` directly
2. **src/app/spaces/[id]/page.tsx** reads id from URL
3. `GET /api/spaces/{id}` (no auth) → **routes/spaces.py**
4. Page renders name, location, description, rules (or loading / 404 / error)

## Data Flow: Owner Booking Requests

1. Space owner dashboard calls `GET /api/bookings/mine` with Bearer token
2. **routes/bookings.py** → **services/bookings.py** → joins booking, space, personal_account
3. Dashboard renders three columns: Pending Approval, Confirmed, Rejected
4. Owner clicks Accept/Reject on pending row → `PATCH /api/bookings/{id}/approve|reject`
5. Owner opens `/bookings/{id}` for full detail including `exchange_offer`

## Current Phase

**Implemented:**
- **Match for Space UI** — purple `#a166ff`, IBM Plex Sans, landing splash, redesigned login/register
- Authentication (login, register, dashboard)
- Create space listing (`/spaces/new`, `POST /api/spaces`)
- Owner listings on dashboard with links to `/spaces/{id}`
- Minimal space detail page (`/spaces/[id]`)
- Owner booking management: list, detail, approve/reject (`/api/bookings/*`)
- Booking `exchange_offer` field (what borrower offers in exchange)
- Demo seed data with `demoowner` / `secret12`
- Backend tests for auth, spaces, and bookings (58 tests)

**Next:**
- Borrower booking request form (`POST /api/bookings`)
- Space search UI and filters
- Full detail page (photo gallery, calendar, Book Now)
- Chat, user dashboard sections, photo upload
