# Match for Space

**What it does:** A web app where people can share and discover underused spaces in their community. Space owners list spaces, review booking requests, and approve or reject them. Users browse spaces in **Find** mode, submit booking requests, sign contracts, chat with owners, and leave ratings.

**Current phase:** Full flowchart MVP — search, booking, owner approval, contracts, chat, ratings, and Match for Space UI.

---

## Prerequisites

Make sure you have these installed before starting:

### 1. Docker Desktop
Required to run frontend and backend containers.

- **macOS / Windows:** Download from [docker.com](https://www.docker.com/products/docker-desktop)
- **Linux:** Install Docker Engine and Docker Compose via your package manager (apt, yum, etc.)
- **Verify:** Open Terminal and run `docker --version`

### 2. Git (optional but recommended)
To clone or manage the project.

- **macOS:** `brew install git`
- **Windows:** [Download installer](https://git-scm.com/download/win)
- **Linux:** `apt install git` or `yum install git`

---

## Quick Start

### 1. Open Terminal

**macOS:** Press `Cmd + Space`, type "Terminal", press Enter

**Windows/Linux:** Open your terminal application

### 2. Navigate to the project folder

```bash
cd ~/emancipatory\ digital\ transformation
```

Or wherever you saved the project.

### 3. Start the system

```bash
chmod +x start.sh stop.sh  # Make scripts executable (first time only)
./start.sh
```

**What happens:**
- ✓ Docker builds the backend and frontend images
- ✓ Starts both services in containers
- ✓ Waits for them to be ready
- ✓ Opens the app in your browser at http://localhost:3000

**First run will take 1-2 minutes.** Subsequent runs are faster.

### 4. Test the app

1. **Landing:** Open http://localhost:3000 — splash screen with **login** and **join us!**
2. **Register:** Click **join us!**, fill in the form, select account type
3. **Log in:** Use your credentials (or seed user `demoowner` / `secret12` after running `python3 seed_data.py` in `backend/`)
4. **Home hub:** After login you land on `/dashboard` — choose **Find a space** or **My spaces**
5. **Find mode (`/find`):** Browse spaces in Bolzano (and elsewhere) — your own listings are hidden here; filter and book
6. **Host mode (`/host`):** Manage listings, review incoming requests, add new spaces
7. **Book → approve → sign → chat:** Book from a space detail page; owner approves on `/host`; both sign on booking detail; chat at `/messages`

**Demo data (optional):**
```bash
cd backend
python3 seed_data.py
```
Then log in as `demoowner` / `secret12` to see sample spaces and bookings. Find mode shows Bolzano spaces from other owners (not your own listings).

### 5. Stop the system

When done, press `Ctrl + C` in Terminal, or in a new Terminal window run:

```bash
./stop.sh
```

---

## URLs & Documentation

| What | URL | Purpose |
|------|-----|---------|
| App | http://localhost:3000 | The web interface |
| Home hub | http://localhost:3000/dashboard | Choose Find a space or My spaces |
| Find mode | http://localhost:3000/find | Browse and book spaces (own listings hidden) |
| Host mode | http://localhost:3000/host | Manage listings and incoming requests |
| Messages | http://localhost:3000/messages | Chat with booking partners |
| API | http://localhost:8000 | Backend server |
| API Docs | http://localhost:8000/docs | Interactive API documentation (Swagger) |

---

## File Organization

See `STRUCTURE.md` for the complete file tree and explanations.

**Quick reference:**
- `frontend/` — web pages, Find/Host modes, chat (Next.js + React)
- `backend/` — HTTP API, WebSocket chat, database logic (FastAPI + SQLite)
- `docker-compose.yml` — how services are started
- `DECISIONS.md` — why we built it this way
- `ARCHITECTURE.md` — system diagram and data flow

---

## Common Issues & Fixes

### Issue: "Docker is not running"
**Fix:** Open Docker Desktop and wait for it to fully start (you'll see the whale icon in the menu bar on macOS)

### Issue: Port 3000 or 8000 already in use
**Fix:** 
```bash
# Kill the service using the port (macOS/Linux)
lsof -ti:3000 | xargs kill -9  # for port 3000
lsof -ti:8000 | xargs kill -9  # for port 8000
```
Then run `./start.sh` again.

### Issue: Frontend loads but says "Failed to fetch"
**Fix:** This means the backend isn't responding. Check:
```bash
docker-compose ps  # Are both services running?
docker-compose logs backend  # Any error messages?
```

### Issue: "Cannot find module" error in frontend
**Fix:** Stale Next.js build cache. Stop the dev server, then:
```bash
cd frontend
rm -rf .next node_modules/.cache
npm run dev
```
Do not run `npm run build` while `npm run dev` is running.

### Issue: Login always fails
**Fix:** 
- Make sure you registered first
- Check that the username/password are correct
- Database may have been reset; try registering again

---

## Understanding the Code

**Where should I look to understand...?**

- **How login works?** → `ARCHITECTURE.md` (Data Flow section) + `frontend/src/lib/auth.tsx`
- **Find vs Host modes?** → `ARCHITECTURE.md` (Home Hub and Find/Host Modes) + `frontend/src/components/ModeNav.tsx`
- **Where user data is stored?** → `backend/models.py` (User table definition)
- **How passwords are secured?** → `backend/services/auth.py` (bcrypt hashing)
- **What files are where?** → `STRUCTURE.md` (complete file tree)
- **Why we chose these tools?** → `DECISIONS.md` (implementation decisions)

---

## For Developers

### Running in development mode (without Docker)

If you want to run directly on your machine instead of Docker:

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

**Database:** Created automatically in `backend/app.db`

**Backend tests:**
```bash
cd backend
pytest
```

### UI and branding

The frontend is branded **Match for Space**:

- Primary color: `#a166ff`
- Font: IBM Plex Sans (via `next/font/google`)
- Design tokens and shared classes: `frontend/tailwind.config.js`, `frontend/src/app/globals.css`
- Landing splash at `/`, redesigned `/login` and `/register`

See `ARCHITECTURE.md` (Frontend Design System section) for details.

### Stopping development servers
- Backend: Press `Ctrl + C` in the backend terminal
- Frontend: Press `Ctrl + C` in the frontend terminal

### Making changes
- Backend changes reload automatically (Uvicorn watch mode)
- Frontend changes reload automatically (Next.js dev mode)
- Refresh your browser to see changes

---

## Next Steps: What to Build Next

The core flowchart MVP is implemented (search, booking, contracts, chat, ratings, Find/Host split). Remaining work:

### Polish
- Availability calendar widget (currently a text field)
- Saved spaces / favourites
- Proximity-based search ordering

### Production
- Switch from SQLite to PostgreSQL
- Use proper HTTPS (not http://localhost)
- Deploy to a server (Heroku, DigitalOcean, AWS, etc.)
- Change SECRET_KEY to a real random value
- Update CORS allowed origins
- Refresh tokens and httpOnly cookies

---

## Troubleshooting: More Help

### Check service health
```bash
docker-compose ps
# Should show both services as "healthy" or "running"
```

### View logs
```bash
docker-compose logs frontend  # Frontend logs
docker-compose logs backend   # Backend logs
docker-compose logs           # All logs
```

### Restart everything
```bash
./stop.sh
sleep 2
./start.sh
```

### Deep clean (removes everything, fresh start)
```bash
./stop.sh
docker-compose down -v       # Remove volumes (database will be reset)
rm -rf frontend/node_modules # Clear dependencies
docker-compose build --no-cache
./start.sh
```

---

## Questions?

Refer to:
- **What do you want to know?** → `STRUCTURE.md` (find the file, see what it does)
- **Why did you build it this way?** → `DECISIONS.md` (decision-by-decision)
- **How do the pieces connect?** → `ARCHITECTURE.md` (system overview)
- **What went wrong?** → `ERRORS.md` (errors and fixes)

---

## License & Notes

This is a student project for an emancipatory digital transformation course. The system is designed to be:
- **Local & self-hosted** (runs on your Mac, no external services)
- **Transparent** (you can read and understand every part of the code)
- **Modular** (add features one at a time without breaking what works)

Good luck building! 🚀
