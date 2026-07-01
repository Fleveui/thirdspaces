# Project Structure

Complete file and folder organization for the Community Space Sharing Platform.

```
thirdspaces/
├── backend/                         — FastAPI server (Python)
│   ├── main.py                     — entry point, starts the server, registers routes
│   ├── config.py                   — all configuration (ports, paths, keys)
│   ├── models.py                   — database schema (users + 5 Excel tables)
│   ├── database.py                 — SQLite connection and session management
│   ├── dependencies.py             — shared auth: get_current_user, require_space_owner
│   ├── import_excel.py             — script to import data from database edt.xlsx
│   ├── seed_data.py                — demo seed data (English, includes description/rules)
│   ├── routes/
│   │   ├── auth.py                 — API endpoints: /api/auth/* (register, login, me, logout)
│   │   └── spaces.py               — API endpoints: /api/spaces/* (create, list, mine, detail)
│   ├── services/
│   │   ├── auth.py                 — business logic (password hashing, token generation)
│   │   └── spaces.py               — business logic (create_space, list_spaces_by_owner)
│   ├── tests/
│   │   ├── conftest.py             — pytest fixtures (in-memory DB, test client, auth tokens)
│   │   ├── test_health.py          — health endpoint tests
│   │   ├── test_auth_service.py    — unit tests for auth service
│   │   ├── test_auth_routes.py     — API tests for auth routes
│   │   ├── test_spaces_service.py  — unit tests for spaces service
│   │   └── test_spaces_routes.py   — API tests for spaces routes
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
│   │   │   ├── layout.tsx           — root layout, wraps app with AuthProvider
│   │   │   ├── page.tsx             — home page, redirects based on auth status
│   │   │   ├── login/
│   │   │   │   └── page.tsx         — login form
│   │   │   ├── register/
│   │   │   │   └── page.tsx         — registration form
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         — protected dashboard (role-based content)
│   │   │   ├── spaces/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx     — list-a-space form (space_owner only)
│   │   │   └── globals.css          — global styles (Tailwind, custom components)
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx   — wrapper for authenticated pages
│   │   └── lib/
│   │       └── auth.tsx             — React Context for authentication state
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
- Imports and registers auth and spaces routes
- Sets up CORS for frontend communication

**config.py**
- Centralized configuration (ports, database path, JWT secret, etc.)
- All settings in one place for easy modification

**models.py**
- Database schema definitions using SQLAlchemy ORM
- Tables: `users` (JWT auth), `personal_account`, `business_account`, `spaces`, `booking`, `space_photo`
- `spaces` includes `description` and `rules` (Text, nullable) for listing details

**database.py**
- Manages SQLite connection
- Provides `get_db()` dependency for FastAPI routes
- Automatically creates tables on startup

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
- Clears and re-seeds business accounts, spaces (with description/rules), bookings
- Usage: `python3 seed_data.py`
- Note: `owner_id` in seed data references `business_account` IDs (import path); app-created listings use `users.id`

**tests/**
- Pytest suite run from `backend/` with `pytest`
- Uses in-memory SQLite and dependency overrides (see `conftest.py`)
- Covers auth and spaces routes/services

### Frontend Files

**src/app/layout.tsx**
- Root layout component
- Wraps entire app with `AuthProvider` to enable global auth state
- Imports and applies global CSS

**src/lib/auth.tsx**
- React Context for authentication state management
- `AuthProvider` component manages login state and token persistence
- `useAuth()` hook provides: user, login(), register(), logout(), loading, error
- Stores JWT token in localStorage (see DECISIONS.md #5)

**src/app/login/page.tsx**
- Login form page
- Takes username and password
- On success: redirects to /dashboard
- On failure: shows error and prompts to create account

**src/app/register/page.tsx**
- Registration form page
- Collects: username, email, password, account type selection
- Client-side validation with field-level error messages
- On success: automatically logs in and redirects to dashboard

**src/app/dashboard/page.tsx**
- Protected route (requires authentication)
- Shows different content based on `account_type`
- Space owners: **List a Space** button, **Your Listings** (name + location via `GET /api/spaces/mine`)
- Regular users: placeholder sections for bookings, saved spaces, messages
- Has logout button

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
- Home page (/)
- Automatically redirects based on auth status:
  - If logged in: → /dashboard
  - If not: → /login

**globals.css**
- Tailwind CSS imports
- Custom component styles (.card, .btn, .input)
- Base and component layers

### Configuration Files

**package.json**
- Lists all Node.js dependencies
- Defines npm scripts: `npm run dev`, `npm run build`, `npm start`

**next.config.js**
- Next.js configuration
- Sets NEXT_PUBLIC_API_URL environment variable for API communication

**tailwind.config.js**
- Tailwind CSS customization
- Defines color palette for community-friendly aesthetic

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
- Data flow walkthrough (auth, create listing, owner listings)
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

1. User visits http://localhost:3000
2. **src/app/page.tsx** checks `useAuth()` → if not logged in, redirects to /login
3. User enters username/password on **src/app/login/page.tsx**
4. Frontend calls `POST http://localhost:8000/api/auth/login` (via useAuth)
5. Backend **routes/auth.py** receives request
6. **services/auth.py** validates credentials against **models.py** (users table in SQLite)
7. If valid: **services/auth.py** creates JWT token using **config.py** SECRET_KEY
8. Backend returns token + user info to frontend
9. Frontend stores token in localStorage (via AuthProvider in **src/lib/auth.tsx**)
10. Frontend redirects to **/dashboard**
11. **src/app/dashboard/page.tsx** (wrapped in ProtectedRoute) displays user info
12. User can log out → clears token → redirects to /login

## Data Flow: Space Listings (Space Owner)

1. Owner clicks **List a Space** on dashboard → **/spaces/new**
2. Owner submits form → `POST /api/spaces` with Bearer token
3. **dependencies.py** → `require_space_owner` → **services/spaces.py** → `create_space()`
4. New row in `spaces` table (`owner_id` = `users.id`)
5. Redirect to dashboard
6. Dashboard calls `GET /api/spaces/mine` → renders **Your Listings** (name + location)

## Current Phase

**Implemented:**
- Authentication (login, register, dashboard)
- Create space listing (`/spaces/new`, `POST /api/spaces`)
- Owner listings on dashboard (`GET /api/spaces/mine`)
- Public space list/detail API (`GET /api/spaces`, `GET /api/spaces/{id}`)
- Backend tests for auth and spaces

**Next:**
- Space search UI and filters
- Space detail page with photo gallery
- Booking flow, chat, availability calendar
- Photo upload on listing create
