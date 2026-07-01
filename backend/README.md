# Backend

FastAPI + SQLite API for the Community Space Sharing Platform.

## Prerequisites

- Python 3.11 (tested with pyenv; `python --version` should show 3.11.x)

## Local development

### 1. Navigate to the backend folder

```bash
cd backend
```

### 2. Create and activate a virtual environment (recommended)

Even with Python 3.11 set globally via pyenv, a venv keeps dependencies isolated:

```bash
python -m venv .venv
source .venv/bin/activate
```

Confirm you're on 3.11:

```bash
python --version
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the server

```bash
python main.py
```

The API runs at **http://localhost:8000**. Interactive API docs: **http://localhost:8000/docs**.

The SQLite database (`app.db`) is created automatically in this directory on first use.

### Health check

In another terminal:

```bash
curl http://localhost:8000/health
```

Expected response: `{"status":"healthy"}`

Stop the server with `Ctrl+C`.

## Notes

- **Auto-reload:** `main.py` runs uvicorn with `reload=True`, so code changes restart the server automatically.
- **Frontend:** The frontend (`npm run dev` in `frontend/`) expects the API at port 8000.
- **Docker:** To run backend and frontend together in containers, use `./start.sh` from the project root (see the main `README.md`).
