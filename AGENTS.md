# AGENTS.md

## Cursor Cloud specific instructions

SnowWhite is an enterprise label and QR/barcode generation platform: a **FastAPI** backend (`main.py`) with optional **React** frontends (`label-designer-app/`, `label-designer/`).

### Services

| Service | Port | Required for |
|---------|------|--------------|
| PostgreSQL 16 | 5432 | API + DB-backed tests |
| FastAPI (Uvicorn) | 8000 | API development and E2E |
| React (`label-designer-app`) | 3000 | Frontend dev (optional) |

### PostgreSQL

PostgreSQL is **not** managed by Docker Compose in this cloud VM. Start it before the API:

```bash
sudo pg_ctlcluster 16 main start
```

Database credentials match `.env.example` (`snowwhite` / `snowwhite_dev_password` / `snowwhite_db`). If the role or database is missing, create them once as the `postgres` OS user.

### Backend

```bash
cp .env.example .env   # first time only
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- Health: `GET http://localhost:8000/health`
- OpenAPI docs: `http://localhost:8000/docs`

### Tests

Set `PYTHONPATH` to the repo root (there is no `pyproject.toml` / editable install):

```bash
source .venv/bin/activate
PYTHONPATH=/workspace pytest
```

Expect ~99 passing tests; some template/parser tests have pre-existing fixture or data issues unrelated to environment setup.

### Frontend (optional)

```bash
cd label-designer-app
npm install
BROWSER=none npm start
```

Use `npm install` (not `npm ci`) if the lockfile is out of sync.

### Docker Compose alternative

`docker-compose.yml` defines `db`, `api`, and `test-watcher`. Docker is not pre-installed on the cloud VM; local PostgreSQL + Uvicorn is the supported path here.

### Gotchas

- `main.py` runs `Base.metadata.create_all()` on startup — PostgreSQL must be reachable before starting Uvicorn.
- Phase 2 routers under `app/api/v1/routers/` are not all wired into `main.py`; only `auth`, `users`, `templates`, `labels`, and `integrations` are active.
- Excel import parsers need `openpyxl` / `xlrd` (listed in `setup_week2.py`, not in `requirements.txt`).
