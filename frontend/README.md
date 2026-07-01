# Frontend

Next.js + React web app for the Community Space Sharing Platform.

## Prerequisites

- Node.js 18+ (`node --version` should show 18.x or newer)
- Backend running at http://localhost:8000 (see `backend/README.md`)

## Local development

### 1. Navigate to the frontend folder

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app runs at **http://localhost:3000**.

Stop the server with `Ctrl+C`.

## Environment

`.env.local` configures the backend API URL:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

You usually don't need to change this for local development.

## Production build (optional)

```bash
npm run build
npm start
```

## Notes

- **Auto-reload:** Next.js dev mode reloads automatically when you change files.
- **Backend required:** Login and API calls will fail with "Failed to fetch" if the backend is not running on port 8000.
- **Docker:** To run backend and frontend together in containers, use `./start.sh` from the project root (see the main `README.md`).
