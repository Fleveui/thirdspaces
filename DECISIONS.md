# Implementation Decisions

## 1. Frontend Framework: Next.js with Tailwind CSS and shadcn/ui
**What was unclear:** The specification mentions forms, buttons, and interactive UI components but doesn't specify which frontend framework to use.

**What we decided:** Next.js with App Router (latest pattern), Tailwind CSS for styling, and shadcn/ui for components.

**Why:** 
- You've learned shadcn/ui and expect it
- Next.js is ideal for this authenticated app with multiple pages
- Tailwind integrates seamlessly with shadcn/ui
- App Router is the modern Next.js convention

**Alternatives:** Plain HTML/CSS/JS would be simpler but less maintainable for forms and state management; React without Next.js would require manual routing setup.

**Can it change?** Yes, easily — components and styling are loosely coupled.

---

## 2. Backend Framework: FastAPI with SQLite
**What was unclear:** How to handle authentication, store user credentials, and manage sessions.

**What we decided:** FastAPI for the backend (Python HTTP API), SQLite for user data storage, JWT tokens for authentication.

**Why:**
- FastAPI is simple, fast, and well-documented
- SQLite is self-hosted and requires no setup
- JWT tokens are stateless and work well for SPAs
- Both are Python, transparent, and match the course philosophy

**Alternatives:** Django (heavier), Flask (lighter but needs more setup), or a Node.js server (not Python).

**Can it change?** Yes, but JWT logic would need to move into the new framework.

---

## 3. Account Types: Handled via Database Flag
**What was unclear:** How to distinguish between "User Account" and "Space Owner Account" technically.

**What we decided:** Both use the same login/registration flow. Account type is a database field (`account_type: enum['user', 'space_owner']`). Dashboard will differ based on this field.

**Why:** Simpler than separate login flows, matches the specification (one auth system serving two user types).

**Alternatives:** Separate authentication endpoints (more complex, not needed).

**Can it change?** Yes — if Space Owners need different signup requirements, we can branch the registration flow.

---

## 4. Password Storage: bcrypt Hashing
**What was unclear:** How to securely store passwords.

**What we decided:** bcrypt hashing with FastAPI-users pattern (hashed before storage, never stored plain text).

**Why:** Industry standard, simple, secure.

**Can it change?** No — always use bcrypt or equivalent for any password system.

---

## 5. Frontend Authentication State: React Context + localStorage
**What was unclear:** How to persist login state across page refreshes.

**What we decided:** Simple React Context for in-memory state + localStorage for persistence. JWT token stored in localStorage.

**Why:** Minimal, transparent, works for a single-page app. localStorage is vulnerable to XSS, but for a local development app with no external dependencies, the risk is acceptable.

**Alternatives:** Cookies with httpOnly flag (more secure, requires backend changes); Redux or Zustand (overkill for this scope).

**Can it change?** Yes — if you add real external hosting, switch to httpOnly cookies.

---

## 6. Styling Approach: Tailwind + shadcn/ui
**What was unclear:** Which shadcn/ui components to use for forms and buttons.

**What we decided:** 
- Use `Button` component for all buttons
- Use `Input` for text fields
- Use `Form` wrapper for form validation
- Use `Card` for page containers

**Why:** Minimal set of components, consistent styling, covers the login/registration flows.

**Can it change?** Yes — add more components as features expand.

---

## 7. Error Handling: User-Friendly Messages
**What was unclear:** What to show users when login fails or validation fails.

**What we decided:** 
- Invalid credentials → "Looks like you're new here. Let's create your account!" (redirect to signup)
- Invalid registration → Show field-level errors inline
- Network errors → Generic "Something went wrong. Try again."

**Why:** Matches the specification tone (informal, positive); doesn't expose system details to users.

**Can it change?** Yes — error messages can be refined based on testing.

---

## 12. Database Schema Expansion: Excel-Driven Design
**What was unclear:** The initial schema only included a `users` table. The specification mentions spaces, bookings, photos, and two account types. The database design needed to match the Excel file structure.

**What we decided:**
- Replace single `users` table with separate `personal_account` and `business_account` tables
- Add `spaces`, `booking`, and `space_photo` tables matching the Excel sheets
- Create `import_excel.py` script to populate SQLite from the Excel file
- Passwords are not imported from Excel; they must be set via registration flow for security

**Tables created:**
- `personal_account` (ID, NAME, SURNAME, E-MAIL, password_hash)
- `business_account` (ID, NAME, SURNAME, COMPANY, COMPANY_EMAIL, password_hash)
- `space` (ID, NAME, OWNER_ID, AREA_M2, IS_OUTDOOR, CATEGORY, AVAILABILITY, DEPOSIT_NEEDED, LOCATION)
- `booking` (BOOKING_ID, SPACE_ID, BORROWER_ID, START_DATE, END_DATE, STATUS)
- `space_photo` (PHOTO_ID, SPACE_ID, IMAGE_URL, POSITION)

**Why:**
- Excel schema is the source of truth for data structure
- Separate account types enable different dashboard flows
- Foreign keys link bookings → spaces and personal accounts
- Photos linked to spaces for galleries
- Import script handles schema evolution and data mapping

**Alternatives:**
- Keep single User table with account_type enum → doesn't match Excel structure, complicates data relationships
- Manual CSV exports → less maintainable, error-prone

**Can it change?** Yes — add more fields or tables as the specification evolves. Update import_excel.py to handle new sheets.

---

## 13. Excel Import Process
**What was unclear:** How to safely import data from Excel without breaking the running application.

**What we decided:**
- Create standalone `import_excel.py` script (not part of the main API)
- Script reads Excel, creates ORM objects, saves to SQLite
- Passwords are NOT imported (security: plain-text passwords in Excel = vulnerability)
- If data row is missing critical fields, skip it (resilient import)
- Optional `clear_database()` function to reset before fresh import

**How to use:**
```bash
cd backend
python3 import_excel.py
```

**Output:**
Shows import progress for each sheet and count of records imported.

**When to run:**
- Initial setup: after database.edt.xlsx is available
- During development: when test data in Excel changes
- Not needed during production

**Why:**
- Separates data import from API logic
- Excel remains the source of truth
- Safe to run multiple times
- Clear feedback on what was imported

**Can it change?** Yes — add validation rules, transformation logic, or error recovery as needed.

---



---

## 8. Dashboard Redirect: Role-Based (Future)
**What was unclear:** What happens after successful login — where do different account types go?

**What we decided:** For now, both User and Space Owner accounts redirect to `/dashboard`. Dashboard will check `account_type` and show appropriate content in the next phase.

**Why:** Keeps authentication phase simple; dashboard differentiation happens in phase 2.

**Can it change?** Yes — will change when we build the dashboard pages.

---

## 9. Database Schema: Minimal for Auth Phase
**What was unclear:** Which fields does a User record need?

**What we decided:**
```
users:
  - id (primary key)
  - username (unique)
  - email (unique)
  - password (hashed)
  - account_type ('user' or 'space_owner')
  - created_at (timestamp)
```

**Why:** Covers login requirements. Email is unique to prevent duplicate accounts. Account type determines dashboard behavior later.

**Alternatives:** Could add more fields (first name, last name, profile picture) later.

**Can it change?** Yes — easily add fields without breaking authentication.

---

## 10. API Endpoints for Auth Phase
**What we decided:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout (optional, for frontend cleanup)
GET /api/auth/me (returns current user info if token valid)
```

**Why:** Covers the three states in the specification (register, login, dashboard).

**Can it change?** Yes — will add more as features expand.

---

## 11. Running Locally: Docker Compose + start.sh
**What was unclear:** How to start both backend and frontend with one command.

**What we decided:** Docker Compose to orchestrate the services, `start.sh` script to run it all. Frontend runs on `http://localhost:3000`, backend on `http://localhost:8000`.

**Why:** Matches course philosophy (self-hosted, reproducible). Single `./start.sh` is beginner-friendly.

**Alternatives:** Manual scripts to start each service separately (more error-prone).

**Can it change?** Yes — can switch to native Node/Python processes if Docker feels too heavy.

---
