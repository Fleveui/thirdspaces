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

## Tests

The backend uses [pytest](https://docs.pytest.org/) for unit and API tests. Test files live in `tests/`.

### Prerequisites

From the `backend` directory, with your virtual environment activated and dependencies installed (see steps 2–3 above):

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Run all tests

```bash
pytest
```

Verbose output (shows each test name):

```bash
pytest -v
```

### Run a subset

Single file:

```bash
pytest tests/test_auth_service.py
```

Single test class or method:

```bash
pytest tests/test_spaces_routes.py::TestCreateSpace
pytest tests/test_spaces_routes.py::TestCreateSpace::test_create_space_as_owner
```

### What gets tested

| File | Coverage |
|------|----------|
| `test_auth_service.py` | Password hashing, JWT tokens, register/authenticate logic |
| `test_auth_routes.py` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| `test_spaces_service.py` | `create_space` validation and persistence |
| `test_spaces_routes.py` | `GET/POST /api/spaces`, auth (401/403), owner linking |
| `test_health.py` | `/` and `/health` |

### Notes

- Tests use an **in-memory SQLite database** — they do not read or write `app.db`.
- No running server is required; tests use FastAPI's `TestClient`.
- `pytest.ini` in this directory configures test discovery and the Python path.

## Notes

- **Auto-reload:** `main.py` runs uvicorn with `reload=True`, so code changes restart the server automatically.
- **Frontend:** The frontend (`npm run dev` in `frontend/`) expects the API at port 8000.
- **Docker:** To run backend and frontend together in containers, use `./start.sh` from the project root (see the main `README.md`).
