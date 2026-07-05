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
│  │  Landing     │  │  Login Page  │  │ Register Pg  │        │
│  │  /           │  │  /login      │  │ /register    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Home Hub    │  │  Find Mode   │  │  Host Mode   │        │
│  │  /dashboard  │  │  /find       │  │  /host       │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ List Space   │  │ Space Detail │  │  Messages    │        │
│  │ /spaces/new  │  │ /spaces/[id] │  │  /messages   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Booking Dtl  │  │ Incoming Req │  │ Saved Favs   │        │
│  │ /bookings/id │  │/host/requests│  │/find/favorites│       │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         PageHeader + minimal AppShell (find | host)            │
│         /find/requests (borrower)  /register/verified          │
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
                       │ POST /api/spaces
                       │ GET /api/spaces (optional auth; excludes own listings)
                       │ GET /api/spaces/mine
                       │ GET /api/spaces/{id}
                       │ POST /api/bookings
                       │ GET /api/bookings/mine
                       │ GET /api/bookings/my-requests
                       │ GET /api/bookings/{id}
                       │ PATCH /api/bookings/{id}/approve|reject|sign
                       │ POST /api/bookings/{id}/rate
                       │ GET /api/chat/conversations
                       │ WebSocket /api/chat/ws/{booking_id}
                       │ GET /api/favorites
                       │ GET|POST|DELETE /api/favorites/{space_id}
                       ▼
┌──────────────────────────────────────────────────────────────┐
│        Backend (FastAPI)  http://localhost:8000               │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  main.py (entry point)                                 │  │
│  │  - starts FastAPI server                               │  │
│  │  - enables CORS for frontend                           │  │
│  │  - includes auth, spaces, bookings, favorites, chat routes│  │
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
│  │  routes/spaces.py (HTTP endpoints)                     │  │
│  │  - POST /api/spaces (create listing, any logged-in user) │  │
│  │  - GET /api/spaces/mine (owner's listings)               │  │
│  │  - GET /api/spaces (search; excludes own if authed)      │  │
│  │  - GET /api/spaces/{id} (public detail)                │  │
│  │  - POST /api/spaces/{id}/photos (upload image)         │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  routes/bookings.py (HTTP endpoints)                   │  │
│  │  - POST /api/bookings (borrower booking request)       │  │
│  │  - GET /api/bookings/mine (owner incoming requests)    │  │
│  │  - GET /api/bookings/my-requests (borrower requests)   │  │
│  │  - GET /api/bookings/{id} (owner or borrower)          │  │
│  │  - PATCH approve|reject|sign                           │  │
│  │  - POST /api/bookings/{id}/rate                        │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  routes/favorites.py (HTTP endpoints)                │  │
│  │  - GET /api/favorites (saved spaces for user)        │  │
│  │  - GET /api/favorites/{space_id} (favorited status)  │  │
│  │  - POST /api/favorites/{space_id} (save)             │  │
│  │  - DELETE /api/favorites/{space_id} (remove)       │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  routes/chat.py (WebSocket + REST)                     │  │
│  │  - GET /api/chat/conversations                         │  │
│  │  - GET /api/chat/{id}/messages                         │  │
│  │  - WebSocket /api/chat/ws/{booking_id}                 │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  dependencies.py (shared auth)                         │  │
│  │  - get_current_user() [required JWT]                   │  │
│  │  - get_optional_user() [JWT if present, else None]     │  │
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
│  │  services/spaces.py (business logic)                   │  │
│  │  - create_space(), list_spaces_by_owner()              │  │
│  │  - search_spaces(exclude_owner_id) — Find mode filter  │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  services/bookings.py (business logic)                 │  │
│  │  - create_booking(), list for owner/borrower           │  │
│  │  - approve/reject, contract signing, ratings           │  │
│  └────────────────────┬───────────────────────────────────┘  │
│                       │                                       │
│  ┌────────────────────▼────────────────────────────────────┐  │
│  │  services/favorites.py (business logic)              │  │
│  │  - list_favorites(), is_favorited()                    │  │
│  │  - add_favorite(), remove_favorite()                   │  │
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
│  - users (authentication)                                    │
│      • id, username, email, password_hash, account_type      │
│  - personal_account (borrowers)                              │
│      • id, name, surname, email, password_hash               │
│  - business_account (space owners)                           │
│      • id, name, surname, company, company_email             │
│  - space (available spaces)                                  │
│      • id, name, owner_id, area_m2, is_outdoor,             │
│      • category, availability, location,                     │
│      • description, rules, exchange_preferences            │
│  - booking (reservation requests)                            │
│      • booking_id, space_id, borrower_id, start_date,       │
│      • end_date, status, exchange_offer, intended_use,      │
│      • contract_text, borrower_signed_at, owner_signed_at   │
│  - space_photo (images)                                      │
│      • photo_id, space_id, image_url, position               │
│  - space_favorite (saved spaces per user)                    │
│      • id, user_id, space_id, created_at (unique pair)       │
│  - conversation, message (chat)                              │
│  - rating (post-visit ratings)                               │
│                                                               │
│  Relationships:                                              │
│  users (space_owner) → space.owner_id                        │
│  users → space_favorite → space (saved listings)             │
│  personal_account → booking → space ← business_account       │
│                          ↑            ↓                      │
│                          └── space_photo                      │
└──────────────────────────────────────────────────────────────┘
```

## Component Deployment

| Component | Type | Runs How | Port | Purpose |
|-----------|------|----------|------|---------|
| Frontend | local/docker | Node.js in container | 3000 | Match for Space UI (Next.js) |
| Backend | local/docker | Python in container | 8000 | API server (auth, spaces, bookings, favorites) |
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
   (username, email, password, account_type, accept terms/privacy)
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
8. Create User record + linked PersonalAccount or BusinessAccount
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
10. Frontend: redirects to /register/verified
   ↓
11. User proceeds to login flow (see below)
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
   - Payload: user_id, expiration (default 24 h), issued_at
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
    - Token expired? → redirect to landing (/)
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
7. Dashboard (hub) renders mode selection cards
   - Find a space → /find
   - My spaces → /host
```

## Data Flow: Home Hub and Find/Host Modes

```
1. User logs in → redirects to /dashboard (home hub)
   ↓
2. Hub header: LogoMark badge avatar + username; messages, incoming-requests bell, logout
   Hub body: mode cards and request strips:
   - Find a space → /find
   - My booking requests → /find/requests
   - Saved favorites → /find/favorites
   - List your space → /host
   - Incoming requests → /host/requests
   Optional badges for pending booking counts
   ↓
3. Task pages use AppShell variant="minimal" + PageHeader (contextual back arrows)
   Legacy full AppShell with ModeNav still available for some routes
   ↓
4. /spaces redirects to /find (legacy route)
```

## Data Flow: Find Mode (Space Search)

```
1. User opens /find (ProtectedRoute)
   ↓
2. GET /api/spaces?location=&category=&...
   Headers: Authorization: Bearer <token> (when logged in)
   ↓
3. Backend: get_optional_user() — if token present, exclude owner's spaces
   services/spaces.py → search_spaces(exclude_owner_id=user.id)
   ↓
4. Frontend renders filterable grid of spaces (not your own listings)
   ↓
5. User clicks space → /spaces/{id} → Book Now flow
   ↓
6. GET /api/bookings/my-requests → "My booking requests" on `/find` and `/find/requests`
   ↓
7. Bookmark toggle on SpaceCard rows and non-owner space detail
   GET /api/favorites/{space_id} on load; POST or DELETE to save/remove
```

## Data Flow: Saved Favorites (Find Mode)

```
1. User opens /find/favorites (from dashboard strip or find flow)
   ↓
2. GET /api/favorites
   Headers: Authorization: Bearer <token>
   ↓
3. Backend: list_favorites(user_id) → SpaceResponse[] (newest first)
   ↓
4. Frontend renders purple gradient section with bookmarked SpaceCard rows
   ↓
5. Toggle bookmark on find results or /spaces/{id} (non-owner view):
   - POST /api/favorites/{space_id} → 201 { favorited: true }
   - DELETE /api/favorites/{space_id} → 204
   ↓
6. BookmarkButton + favorites.ts helpers keep UI in sync
```

## Data Flow: Create Space Listing (Any Logged-in User)

```
1. User clicks "Add a space" on /host (or hub)
   ↓
2. Navigates to /spaces/new (ProtectedRoute)
   ↓
3. User fills form:
   name, location, area_m2, category, is_outdoor,
   availability, description, rules, exchange_preferences
   ↓
4. Frontend validation (required fields, area > 0)
   ↓
5. POST /api/spaces
   Headers: Authorization: Bearer <token>
   Body: CreateSpaceRequest JSON
   ↓
6. Backend: get_current_user dependency
   - No/invalid token → 401
   ↓
7. services/spaces.py → create_space(owner_id=user.id, ...)
   ↓
8. INSERT into spaces table
   ↓
9. Return 201 + SpaceResponse
   ↓
10. Frontend redirects to /host
```

## Data Flow: Host Mode (Owner Listings & Requests)

```
1. User loads /host (ProtectedRoute + AppShell mode="host")
   Intro hub: "View my listings" → /host?view=listings, "Add a space" → /spaces/new
   ↓
2. Listings view (/host?view=listings):
   GET /api/spaces/mine + GET /api/bookings/mine (parallel)
   ↓
3. countBookingsBySpace() → per-space request count on SpaceCard rows
   Badge links to /host/requests?space_id={id} (when count > 0)
   ↓
4. Click listing → /spaces/{id} (own-listing detail view)
   - All list-a-space fields, photo placeholder
   - Request strip above photo → /host/requests?space_id={id}
   - Back arrow → /host?view=listings
   ↓
5. Incoming requests page (/host/requests):
   GET /api/bookings/mine → pending / confirmed / rejected sections
   Accept/Reject on pending cards (PATCH approve|reject)
   ↓
6. Contextual back navigation (hostNavigation.ts):
   - ?space_id={id} on URL → back to /spaces/{id}
   - No space_id (from dashboard) → back to /dashboard
```

## Data Flow: Borrower Booking Request

```
1. User opens /spaces/{id} and clicks Book Now
   ↓
2. Fills dates, intended use, exchange offer
   ↓
3. POST /api/bookings
   Headers: Authorization: Bearer <token>
   Body: { space_id, start_date, end_date, intended_use, exchange_offer }
   ↓
4. services/bookings.py → create_booking()
   - Status: pending
   ↓
5. Borrower sees request on /find and /find/requests
   Owner sees it on /host/requests (and via per-space badges on listings)
```

## Data Flow: Contract Signing & Ratings

```
1. Owner approves booking → PATCH /api/bookings/{id}/approve
   ↓
2. Both parties open /bookings/{id}
   ↓
3. Contract text shown; each signs via PATCH /api/bookings/{id}/sign
   ↓
4. After visit: POST /api/bookings/{id}/rate (borrower or owner)
```

## Data Flow: Real-time Chat

```
1. User opens /messages
   ↓
2. GET /api/chat/conversations (bookings with chat access)
   ↓
3. User selects conversation → WebSocket /api/chat/ws/{booking_id}
   Headers: Authorization via query or handshake
   ↓
4. Messages persisted in message table; broadcast to connected clients
```

## Data Flow: Owner Dashboard Listings (legacy — see Host Mode)

```
1. Space owner loads /host (formerly combined on /dashboard)
   ↓
2. GET /api/spaces/mine + GET /api/bookings/mine
   ↓
3. Listings and booking columns rendered via BookingGroups
```

## Data Flow: Space Detail Page

```
1. User opens /spaces/{id} (ProtectedRoute)
   ↓
2. GET /api/spaces/{id} — public detail; photos included
   ↓
3. Frontend detects isOwnSpace (user.id === space.owner_id)
   ↓
4a. Find view (not owner):
   - Purple/lavender accents, availability badge
   - BookmarkButton (GET/POST/DELETE /api/favorites/{space_id})
   - Book Now form for authenticated non-owners
   - Back → /find
   ↓
4b. Own-listing view (owner):
   - Host cream accents; all list-a-space fields + photo placeholder
   - GET /api/bookings/mine → request count strip above photo
   - No availability badge; back → /host?view=listings
   ↓
5. Loading / 404 / error states handled client-side
```

## Data Flow: Owner Booking Requests (Host Mode)

```
1. User opens /host/requests (from dashboard or via ?space_id={id} from listing flow)
   ↓
2. GET /api/bookings/mine
   Headers: Authorization: Bearer <token>
   ↓
3. Backend: list_bookings_for_owner(user.id)
   ↓
4. IncomingRequestCard sections: Pending, Confirmed (green), Rejected (red)
   - Pending: Accept / Reject (PATCH approve|reject)
   - All cards link to /bookings/{id}
   ↓
5. Back arrow: hostRequestsBackHref(space_id) → /spaces/{id} or /dashboard
```

## Frontend Design System (Match for Space)

The UI is branded **Match for Space** with dual accents: purple for **Find** and cream for **Host**.

| Token | Value | Usage |
|-------|--------|--------|
| `primary` | `#a166ff` | Find buttons, links, lavender inputs |
| `primary-dark` | `#8a4de6` | Button hover states |
| `primary-light` | `#f3ebff` | Find subtle backgrounds |
| `host-cream` | `#ffbe68` | Host buttons, badges, strips |
| `host-cream-light` | `#ffd9a8` | Host input backgrounds |
| `host-cream-accent` | `#9a5516` | Host text accents |
| Font | IBM Plex Sans | Loaded via `next/font/google` in `layout.tsx` |

**Shared UI classes** (defined in `frontend/src/app/globals.css`):

- `.btn-primary` — purple filled button (find flow)
- `.btn-host` / `.btn-host-outline` — cream gradient / outline (host flow)
- `.input-lavender` — find form inputs
- `.input-cream` — host form inputs
- `.card` — white container, soft shadow, rounded

**Shared components:**

- `LogoMark` — logo with `badge` (purple circle + white mark; login splash and dashboard profile avatar) and `mark` variants
- `SparkleIcon` — star icon on find/host intro hubs and registration pages (CSS mask from `/star.png`)
- `PageHeader` — back arrow + title (contextual navigation)
- `AppShell` — `mode` (find | host), `variant` (full | minimal)
- `HubActionCard` — dashboard mode cards and request strips (`SavedFavoritesStrip`)
- `BookmarkButton` — toggle save on find SpaceCard rows and space detail
- `SpaceCard` — listing card/row with find or host accent; request badge on host listings
- `IncomingRequestCard` — host incoming request card (cream / green / red status)
- `MyBookingRequestCard` — borrower request card (find accent)
- `CategoryChips` — category selector (`variant="find"` | `"host"`)

**Navigation helpers:**

- `frontend/src/lib/hostNavigation.ts` — `hostRequestsHref(spaceId?)`, `hostRequestsBackHref(spaceId)`
- `frontend/src/lib/favorites.ts` — `fetchFavorites`, `addFavorite`, `removeFavorite`, `fetchFavoriteStatus`

**Key routes:**

- `/` — landing with inline login; `/login` redirects here
- `/register` — registration; `/register/verified` — post-signup confirmation
- `/dashboard` — home hub: logo badge + username header; Find, My booking requests, Saved favorites, List your space, Incoming requests; messages icon → `/messages`
- `/find` — intro + search/results; `/find/requests` — borrower's outgoing requests; `/find/favorites` — saved spaces
- `/host` — intro hub; `/host?view=listings` — your listing rows
- `/host/requests` — incoming requests (`?space_id={id}` for contextual back)
- `/spaces/new` — create listing (cream form)
- `/spaces/[id]` — space detail (find or own-listing view)
- `/bookings/[id]` — booking detail, approve/reject, contract, ratings
- `/messages` — chat (WebSocket per booking)

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
| Token expired | JWT past expiry | Redirect to landing; session cleared via authFetch |
| Token invalid | Tampered or corrupt | Reject and redirect to /login |
| Backend unreachable | Service down | Show "Network error. Try again" |
| Invalid form input | Client-side validation | Show field-level error message |
| Not space owner | Legacy check on some endpoints | 403 or redirect |
| Own listing in Find | Authenticated search excludes owner_id | Hidden from /find results |
| Space validation failed | Missing/invalid listing fields | 400 with detail message |
| Space not found | Invalid or deleted space id | 404 on detail page |

## Environment Configuration

All configuration in one place: `backend/config.py`

| Setting | Default | Purpose |
|---------|---------|---------|
| HOST | 0.0.0.0 | Backend listen address (all interfaces in container) |
| PORT | 8000 | Backend listen port |
| FRONTEND_URL | http://localhost:3000 | CORS origin |
| DATABASE_URL | sqlite:///app.db | SQLite path |
| SECRET_KEY | dev-secret-key-... | JWT signing key (change in production) |
| ACCESS_TOKEN_EXPIRE_MINUTES | 1440 | JWT token lifetime (24 h default) |
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
- Refresh tokens (current token lasts 24 h by default)
- Rate limiting on auth endpoints
- CSRF protection (not needed for SPA + CORS)
- Logout token blacklist

## Database Schema & Import

### Complete Schema

The database maps core entities from the Excel file `database edt.xlsx`, plus app tables (`users`, `space_favorite`, chat, ratings):

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
├─ owner_id (FK) ────→ users.id (for app-created listings)
│                      business_account.id (for Excel/seed import)
├─ area_m2
├─ is_outdoor
├─ category
├─ availability
├─ location
├─ description
├─ rules
├─ exchange_preferences
└─ created_at

booking
├─ booking_id (PK)
├─ space_id (FK) ────→ space.id
├─ borrower_id (FK) ────→ personal_account.id
├─ start_date
├─ end_date
├─ status (pending | approved | rejected | completed)
├─ exchange_offer (Text, nullable)
├─ intended_use (Text, nullable)
├─ contract_text (Text, nullable)
├─ borrower_signed_at
├─ owner_signed_at
└─ created_at

space_photo
├─ photo_id (PK)
├─ space_id (FK) ────→ space.id
├─ image_url
├─ position
└─ created_at

conversation
├─ id (PK)
├─ booking_id (FK) ────→ booking.booking_id
└─ created_at

message
├─ id (PK)
├─ conversation_id (FK)
├─ sender_id (FK) ────→ users.id
├─ content (Text)
└─ created_at

rating
├─ id (PK)
├─ booking_id (FK)
├─ rater_id (FK) ────→ users.id
├─ score (1–5)
├─ comment (Text, nullable)
└─ created_at

space_favorite
├─ id (PK)
├─ user_id (FK) ────→ users.id
├─ space_id (FK) ────→ space.id
├─ created_at
└─ unique (user_id, space_id)
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

→ see DECISIONS.md #12, #13, #14, and #15 for the "why" behind this approach

## Current Phase: Full Flowchart MVP

**Implemented:**
- **Match for Space UI** — dual theme: find purple (`#a166ff`), host cream (`#ffbe68`), IBM Plex Sans, landing login on `/`
- **Dashboard hub** — mode cards plus My booking requests, Saved favorites, and Incoming requests strips with pending badges
- **Find/Host intro + task views** — `/find` and `/host` mirror layout (intro → results/listings); `/find/requests`, `/host/requests`
- **Contextual navigation** — `PageHeader` back arrows; `hostNavigation.ts` (`space_id` on incoming requests)
- **Space detail** — full list-a-space fields, photo placeholder, owner vs find accents and actions
- **Host listing badges** — per-space booking request counts on My spaces (replaces availability pill)
- **Incoming requests UI** — cream theme; confirmed green / rejected red badges and card outlines
- **Space discovery** — filterable `GET /api/spaces`; optional auth excludes own listings
- **Listings** — cream form at `/spaces/new`, photo upload, `exchange_preferences`
- **Saved favorites** — `space_favorite` table, `/api/favorites` CRUD, `/find/favorites`, bookmark on find cards and detail
- **Borrower booking** — Book Now, `/find/requests`, lavender form styling
- **Owner workflow** — approve/reject on `/host/requests`, contracts and ratings on `/bookings/{id}`
- **Auth** — `authFetch`, 401 session clearing, 24 h JWT default
- **Chat** — `/messages`, WebSocket
- **Demo seed** — Milan + Bolzano spaces, `demoowner` / `secret12`
- Backend tests (70+)

**Not yet implemented:**
- Availability calendar widget (text field only for now)
- Email verification (UI flow only)
- Production deployment (PostgreSQL, HTTPS, refresh tokens)

## Next Phases

### Phase 2: Polish & Discovery
- Availability calendar widget on listing and detail pages
- Proximity-based search ordering

### Phase 3: Production Deployment
- Switch to httpOnly cookies instead of localStorage
- Add refresh tokens
- Move SECRET_KEY to environment variable
- Use PostgreSQL instead of SQLite
- Add rate limiting
- Configure HTTPS and CORS for production domain
