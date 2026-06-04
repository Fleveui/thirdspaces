# Project Structure

Complete file and folder organization for the Community Space Sharing Platform.

```
emancipatory digital transformation/
├── backend/                         — FastAPI server (Python)
│   ├── main.py                     — entry point, starts the server
│   ├── config.py                   — all configuration (ports, paths, keys)
│   ├── models.py                   — database schema (5 tables from Excel)
│   ├── database.py                 — SQLite connection and session management
│   ├── import_excel.py             — script to import data from database edt.xlsx
│   ├── routes/
│   │   └── auth.py                 — API endpoints: /api/auth/* (register, login, me, logout)
│   ├── services/
│   │   └── auth.py                 — business logic (password hashing, token generation)
│   ├── Dockerfile                  — container image for backend
│   ├── requirements.txt             — Python dependencies (FastAPI, SQLAlchemy, pandas, etc.)
│   └── app.db                       — SQLite database (created at runtime)
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
│   │   │   │   └── page.tsx         — protected dashboard page
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
│
├── app-requirements.md              — original specification from the student
└── PRE-SYSTEM-INSTRUCTION.md        — guidelines for the builder (this file)
```

## Key Files Explained

### Backend Files

**main.py**
- Entry point for the FastAPI server
- Imports and registers routes
- Sets up CORS for frontend communication

**config.py**
- Centralized configuration (ports, database path, JWT secret, etc.)
- All settings in one place for easy modification

**models.py**
- Database schema definitions using SQLAlchemy ORM
- Currently: User table with username, email, password_hash, account_type

**database.py**
- Manages SQLite connection
- Provides `get_db()` dependency for FastAPI routes
- Automatically creates tables on startup

**routes/auth.py**
- HTTP endpoints for authentication
- `POST /api/auth/register` - create new account
- `POST /api/auth/login` - authenticate and get JWT token
- `GET /api/auth/me` - get current user info (requires token)
- `POST /api/auth/logout` - client-side cleanup

**services/auth.py**
- Business logic for authentication
- Password hashing with bcrypt
- JWT token generation and verification
- User registration and login validation

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
- Shows different content based on user account_type
- Currently: placeholder for future space/booking management
- Has logout button

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
- Data flow walkthrough
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

## Data Flow: Authentication Phase

1. User visits http://localhost:3000
2. **src/app/page.tsx** checks `useAuth()` → if not logged in, redirects to /login
3. User enters username/password on **src/app/login/page.tsx**
4. Frontend calls `POST http://localhost:8000/api/auth/login` (via useAuth)
5. Backend **routes/auth.py** receives request
6. **services/auth.py** validates credentials against **models.py** (User table in SQLite)
7. If valid: **services/auth.py** creates JWT token using **config.py** SECRET_KEY
8. Backend returns token + user info to frontend
9. Frontend stores token in localStorage (via AuthProvider in **src/lib/auth.tsx**)
10. Frontend redirects to **/dashboard**
11. **src/app/dashboard/page.tsx** (wrapped in ProtectedRoute) displays user info
12. User can log out → clears token → redirects to /login

## Next Phase

When implementing space discovery:
- Add `/api/space` endpoints in backend (routes/spaces.py, services/spaces.py)
- Add Space model to models.py
- Add new pages: src/app/spaces/ (search, detail pages)
- Update dashboard to show actual bookings instead of placeholders
