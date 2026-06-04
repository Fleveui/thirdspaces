# Architecture: Community Space Sharing Platform

## System Diagram

```
┌──────────────────────────┐
│    Browser (User)        │
│  http://localhost:3000   │
└────────────┬─────────────┘
             │ HTTP/JSON
             ▼
┌──────────────────────────────────────────────────────────────┐
│          Frontend (Next.js)                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Login Page  │  │ Register Pg  │  │ Dashboard    │        │
│  │  /login      │  │ /register    │  │ /dashboard   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                 │                   │               │
│         └─────────────────┴───────────────────┘               │
│                       │                                       │
│           ┌───────────▼────────────┐                          │
│           │   Auth Context         │                          │
│           │  (src/lib/auth.tsx)    │                          │
│           │  - user state          │                          │
│           │  - JWT token           │                          │
│           │  - login/register fn   │                          │
│           └───────────┬────────────┘                          │
│                       │                                       │
│           ┌───────────▼────────────┐                          │
│           │  Protected Route       │                          │
│           │ (checks auth status)   │                          │
│           └───────────┬────────────┘                          │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP/JSON
                       │ POST /api/auth/login
                       │ POST /api/auth/register
                       │ GET /api/auth/me
                       ▼
┌──────────────────────────────────────────────────────────────┐
│        Backend (FastAPI)  http://localhost:8000               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  main.py (entry point)                                 │  │
│  │  - starts FastAPI server                               │  │
│  │  - enables CORS for frontend                           │  │
│  │  - includes auth routes                                │  │
│  └────────────────────────────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  routes/auth.py (HTTP endpoints)                        │  │
│  │  - POST /api/auth/register                             │  │
│  │  - POST /api/auth/login                                │  │
│  │  - GET /api/auth/me                                    │  │
│  │  - POST /api/auth/logout                               │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  services/auth.py (business logic)                      │  │
│  │  - hash_password() [bcrypt]                             │  │
│  │  - verify_password()                                    │  │
│  │  - create_access_token() [JWT]                          │  │
│  │  - verify_token()                                       │  │
│  │  - register_user()                                      │  │
│  │  - authenticate_user()                                  │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  models.py (database schema)                            │  │
│  │  - User:                                               │  │
│  │    • id (UUID)                                         │  │
│  │    • username (unique)                                 │  │
│  │    • email (unique)                                    │  │
│  │    • password_hash (bcrypt)                            │  │
│  │    • account_type ('user' or 'space_owner')            │  │
│  │    • created_at (timestamp)                            │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │ SQL                                   │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  database.py (SQLite connection)                        │  │
│  │  - create SQLite engine                                │  │
│  │  - manage database sessions                            │  │
│  │  - provide get_db() dependency                         │  │
│  └────────────────────┬───────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────┘
                       │ File: app.db
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              Database (SQLite)                                │
│              app.db (local file)                              │
│                                                               │
│  tables:                                                      │
│  - personal_account (borrowers)                              │
│      • id, name, surname, email, password_hash               │
│  - business_account (space owners)                           │
│      • id, name, surname, company, company_email             │
│  - space (available spaces)                                  │
│      • id, name, owner_id, area_m2, is_outdoor,             │
│      • category, availability, deposit_needed, location      │
│  - booking (reservation requests)                            │
│      • booking_id, space_id, borrower_id, start_date,       │
│      • end_date, status, created_at                          │
│  - space_photo (images)                                      │
│      • photo_id, space_id, image_url, position               │
│                                                               │
│  Relationships:                                              │
│  personal_account → booking → space ← business_account       │
│                          ↑            ↓                      │
│                          └── space_photo                      │
└──────────────────────────────────────────────────────────────┘
```

## Component Deployment

| Component | Type | Runs How | Port | Purpose |
|-----------|------|----------|------|---------|
| Frontend | local/docker | Node.js in container | 3000 | Web UI (login, dashboard) |
| Backend | local/docker | Python in container | 8000 | API server (auth endpoints) |
| Database | local/docker | SQLite in container | - | User data and credentials |

## Tech Stack Decisions

### Why Next.js (Frontend)?

**From specification:** The spec mentions multiple pages (login, register, dashboard), forms, buttons, cards, and navigation. This requires a structured SPA framework with routing and component management.

**Why not vanilla HTML/CSS/JavaScript?**
- No built-in routing (would need manual path handling)
- No component reusability
- No state management for auth

**Why not another framework (Vue, Svelte)?**
- You learned Next.js + shadcn/ui in the course
- Next.js App Router is modern and well-documented
- Integrates cleanly with Tailwind CSS

**Decision:** Next.js 14 with App Router, Tailwind CSS, TypeScript.
→ see DECISIONS.md #1

---

### Why FastAPI (Backend)?

**From specification:** Need HTTP endpoints for authentication, database storage of users, and password hashing.

**Why Python + FastAPI?**
- The course emphasizes simple, transparent tools
- FastAPI is faster than Flask, requires less boilerplate
- Python is readable for a design student learning to code
- Built-in OpenAPI documentation (/docs)

**Why not Node.js?**
- Not explicitly mentioned in preferences
- Would require npm/JavaScript knowledge for student to modify
- Python is more accessible for non-programmers

**Decision:** FastAPI with Uvicorn.
→ see DECISIONS.md #2

---

### Why SQLite (Database)?

**From specification:** Need to store user credentials and account information persistently.

**Why SQLite?**
- No setup required (file-based)
- Built-in Python support (SQLAlchemy ORM)
- Single-machine deployment (student's Mac)
- Data stored locally (no external dependency)

**Why not PostgreSQL?**
- Requires Docker container (overkill for auth-only phase)
- Student not handling multi-service database access yet

**Decision:** SQLite with SQLAlchemy ORM.
→ see DECISIONS.md #2

---

### Why JWT Tokens (Authentication)?

**From specification:** Users must log in with credentials. After login, they access protected pages (dashboard).

**Why JWT?**
- Stateless (no server session storage needed)
- Works well for SPAs (token stored in localStorage)
- Simple to implement
- Can be extended for refresh tokens later

**Why not sessions + cookies?**
- More complex for a first build
- Requires server state management

**Decision:** JWT access tokens, localStorage storage.
→ see DECISIONS.md #2, #5

---

### Why bcrypt (Password Hashing)?

**Non-negotiable:** Never store passwords in plain text.

**Why bcrypt?**
- Industry standard
- Slow by design (resistant to brute-force attacks)
- Built into Python passlib library

**Decision:** bcrypt with 12 rounds (configurable in config.py).
→ see DECISIONS.md #4

---

## Data Flow: User Registration

```
1. User fills registration form
   (username, email, password, account_type)
   ↓
2. Frontend validation
   - username min 3 chars
   - email valid format
   - password min 6 chars
   - passwords match
   ↓
3. POST /api/auth/register
   {
     "username": "alice",
     "email": "alice@example.com",
     "password": "secret123",
     "account_type": "user"
   }
   ↓
4. Backend receives request (routes/auth.py)
   ↓
5. Validate schema (Pydantic)
   ↓
6. Check if username/email already exists (models.User in SQLite)
   ↓
7. Hash password (services/auth.py → bcrypt)
   ↓
8. Create User record in database
   ↓
9. Return user object (no password hash exposed)
   {
     "id": "abc123...",
     "username": "alice",
     "email": "alice@example.com",
     "account_type": "user",
     "message": "Account created successfully!"
   }
   ↓
10. Frontend: automatically calls login() with same credentials
   ↓
11. Proceed to login flow (see below)
```

## Data Flow: User Login

```
1. User enters username + password
   ↓
2. Frontend POST /api/auth/login
   {
     "username": "alice",
     "password": "secret123"
   }
   ↓
3. Backend receives request (routes/auth.py)
   ↓
4. Look up user by username (models.User)
   ↓
5. Check if user exists
   - No → return error: "Invalid username or password"
   - Yes → continue
   ↓
6. Verify password (services/auth.py → bcrypt.verify)
   - Invalid → return error: "Invalid username or password"
   - Valid → continue
   ↓
7. Create JWT token (services/auth.py)
   - Payload: user_id, expiration (30 min), issued_at
   - Signed with SECRET_KEY from config.py
   ↓
8. Return success response
   {
     "token": "eyJhbGciOiJIUzI1NiIs...",
     "user": {
       "id": "abc123...",
       "username": "alice",
       "email": "alice@example.com",
       "account_type": "user"
     },
     "message": "You're successfully logged in!"
   }
   ↓
9. Frontend: stores token in localStorage
   localStorage.setItem('auth_token', token)
   ↓
10. Frontend: updates useAuth() context with user object
   ↓
11. Frontend: redirects to /dashboard
   ↓
12. Dashboard checks ProtectedRoute
    - Token valid? → render dashboard
    - Token expired? → redirect to /login
```

## Data Flow: Accessing Protected Pages

```
1. User navigates to /dashboard
   ↓
2. Page wrapped in <ProtectedRoute>
   ↓
3. ProtectedRoute checks:
   - Is token in localStorage?
   - Is user in context state?
   ↓
   No → redirect to /login
   Yes → continue
   ↓
4. If page just loaded, verify token with backend
   GET /api/auth/me
   Headers: Authorization: Bearer <token>
   ↓
5. Backend verifies token (services/auth.py)
   - Decode JWT using SECRET_KEY
   - Check expiration
   - Return user object if valid
   ↓
6. Frontend receives user info
   ↓
7. Dashboard renders with user information
```

## External Dependencies

**None at this phase.** All services run locally:
- Frontend: Node.js + npm
- Backend: Python + pip
- Database: SQLite (file-based)

## Error Handling & Fallbacks

| Error | Cause | Handling |
|-------|-------|----------|
| Invalid credentials | Wrong password or unknown user | Show "Invalid username or password" |
| Username exists | Duplicate on registration | Show "Username already taken" |
| Email exists | Duplicate on registration | Show "Email already in use" |
| Token expired | 30 min inactivity | Redirect to /login |
| Token invalid | Tampered or corrupt | Reject and redirect to /login |
| Backend unreachable | Service down | Show "Network error. Try again" |
| Invalid form input | Client-side validation | Show field-level error message |

## Environment Configuration

All configuration in one place: `backend/config.py`

| Setting | Default | Purpose |
|---------|---------|---------|
| HOST | 0.0.0.0 | Backend listen address (all interfaces in container) |
| PORT | 8000 | Backend listen port |
| FRONTEND_URL | http://localhost:3000 | CORS origin |
| DATABASE_URL | sqlite:///app.db | SQLite path |
| SECRET_KEY | dev-secret-key-... | JWT signing key (change in production) |
| ACCESS_TOKEN_EXPIRE_MINUTES | 30 | JWT token lifetime |
| ALLOWED_ORIGINS | [FRONTEND_URL] | CORS whitelist |

Frontend: `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Security Notes (Current Phase)

✅ **Implemented:**
- Passwords hashed with bcrypt
- JWT tokens signed with SECRET_KEY
- CORS restricted to frontend URL
- Form validation (frontend + backend)

⚠️ **Not implemented (for future phases):**
- HTTPS/TLS (only development)
- Refresh tokens (current token lasts 30 min)
- Rate limiting on auth endpoints
- CSRF protection (not needed for SPA + CORS)
- Logout token blacklist

## Database Schema & Import

### Complete Schema

The database has 5 tables, mapped from the Excel file `database edt.xlsx`:

```
personal_account          business_account
├─ id (PK)               ├─ id (PK)
├─ name                  ├─ name
├─ surname               ├─ surname
├─ email (unique)        ├─ company
├─ password_hash         ├─ company_email (unique)
└─ created_at            └─ created_at

space
├─ id (PK)
├─ name
├─ owner_id (FK) ────→ business_account.id
├─ area_m2
├─ is_outdoor
├─ category
├─ availability
├─ deposit_needed
├─ location
└─ created_at

booking
├─ booking_id (PK)
├─ space_id (FK) ────→ space.id
├─ borrower_id (FK) ────→ personal_account.id
├─ start_date
├─ end_date
├─ status (pending | approved | rejected)
└─ created_at

space_photo
├─ photo_id (PK)
├─ space_id (FK) ────→ space.id
├─ image_url
├─ position
└─ created_at
```

### Import Process

The Excel file is the source of truth for all data except passwords:

```
database edt.xlsx
    ├── Sheet "personal account"     → Python ORM → personal_account table
    ├── Sheet "buissiness account"   → Python ORM → business_account table
    ├── Sheet "space"                → Python ORM → space table
    ├── Sheet "Booking"              → Python ORM → booking table
    └── Sheet "item photo"           → Python ORM → space_photo table
```

**To import data:**
```bash
cd backend
python3 import_excel.py
```

**Output example:**
```
============================================================
Community Space Sharing Platform - Excel Import
============================================================

📥 Importing personal accounts...
   ✅ Imported 42 personal accounts
📥 Importing business accounts...
   ✅ Imported 8 business accounts
📥 Importing spaces...
   ✅ Imported 25 spaces
📥 Importing bookings...
   ✅ Imported 17 bookings
📥 Importing space photos...
   ✅ Imported 73 photos

============================================================
✅ Import completed successfully!
============================================================
```

**Key behaviors:**
- If a row has missing ID (primary key), it's skipped
- Passwords are NOT imported from Excel (always set via registration flow)
- Spaces link to business accounts via owner_id
- Bookings link spaces to borrowers
- Photos link to spaces for galleries
- All timestamps default to current UTC time
- Script is idempotent: can run multiple times safely

**When to run:**
- Initial setup: populate database with test data
- During development: when Excel data changes
- Not needed during production (users create accounts via web UI)

→ see DECISIONS.md #12 and #13 for the "why" behind this approach

## Next Phases

### Phase 2: Space Discovery
- Add Space model (name, owner, location, images, availability)
- Add /api/space endpoints (list, search, filter, detail)
- Add space listing pages
- Add dashboard sections showing bookings

### Phase 3: Booking & Chat
- Add Booking model
- Add /api/booking endpoints
- Add booking form and calendar
- Add real-time chat (WebSocket or polling)

### Phase 4: Production Deployment
- Switch to httpOnly cookies instead of localStorage
- Add refresh tokens
- Move SECRET_KEY to environment variable
- Use PostgreSQL instead of SQLite
- Add rate limiting
- Configure HTTPS and CORS for production domain
