**Resume Ranking System**

**Project Summary**
- **Purpose**: A recruiter-focused web application that ingests resumes (file upload or Gmail import), parses candidate information, ranks candidates against job criteria, and presents ranked results for review in a protected dashboard.
- **Primary flows**: Resume ingestion → parsing → ranking/matching → recruiter review → reporting.

**Tech Stack**
- **Frontend**: React (Vite), Tailwind CSS, lucide-react, react-router-dom. Code: [frontend](frontend).
- **Backend**: FastAPI + Uvicorn (JSON APIs, SSE). Code: [Backend](Backend).
- **Agent subsystem**: Python-based agents and sub-agents for parsing, ranking, and reporting. Code: [Agent/my_agent](Agent/my_agent).
- **Database**: SQLite (development). Schema and init code: [init.sql](init.sql) and [database/sqlite_db.py](database/sqlite_db.py).
- **Authentication**: JWT (HS256) tokens issued by backend and stored client-side.

**Architecture Overview**
- Browser SPA (frontend) communicates with the FastAPI backend at `/api/*`.
- Backend persists resumes, jobs, rankings, and users in SQLite.
- Agent processes perform heavier tasks (resume parsing, ranking) and interact via internal APIs/MCP transports.
- Auth protects dashboard routes; frontend uses an `AuthContext` to persist tokens and guard routes.

**Key Files & Responsibilities**
- **Backend**
  - [Backend/app/main.py](Backend/app/main.py): app bootstrap, CORS, router registration.
  - [Backend/app/routes/auth.py](Backend/app/routes/auth.py): auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
  - [Backend/app/services/auth_service.py](Backend/app/services/auth_service.py): password hashing, JWT creation/verification, user helpers.
- **Database**
  - [init.sql](init.sql): schema reference and historical SQL.
  - [database/connection.py](database/connection.py): DB connection shim (delegates to SQLite helper).
  - [database/sqlite_db.py](database/sqlite_db.py): schema creation and DB helpers.
- **Frontend**
  - [frontend/src/lib/api.js](frontend/src/lib/api.js): client-side API calls (auth, match endpoints).
  - [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx): auth provider and token persistence.
  - [frontend/src/Root.jsx](frontend/src/Root.jsx): router and route guards.
  - [frontend/src/components/AuthLayout.jsx](frontend/src/components/AuthLayout.jsx): login/signup hero and feature cards.
  - [frontend/src/App.jsx](frontend/src/App.jsx): main app shell and dashboard.
- **Agent**
  - [Agent/my_agent/sub_agents/resume_parser.py](Agent/my_agent/sub_agents/resume_parser.py): resume parsing logic.
  - [Agent/my_agent/sub_agents/ranker.py](Agent/my_agent/sub_agents/ranker.py): candidate scoring and ranking.

**API Endpoints & Auth Flow**
- POST `/api/auth/register`
  - Payload: { "name": "...", "email": "...", "password": "..." }
  - Response: { "access_token": "<jwt>", "token_type": "bearer", "user": { id, name, email } }
- POST `/api/auth/login`
  - Payload: { "email": "...", "password": "..." }
  - Response: same as register.
- GET `/api/auth/me`
  - Header: `Authorization: Bearer <token>`
  - Response: current user object.

Usage notes:
- Frontend stores token in localStorage key `recruitai_auth_token` (see [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx)).
- Include `Authorization: Bearer <token>` on protected requests.

Example curl (register):
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"s3cret"}'
```

**Local Setup & Run**
- Backend (Python 3.10+ recommended):
```powershell
cd Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# initialize sqlite DB (if needed)
python ..\scripts\init_sqlite.py
uvicorn app.main:app --reload --port 8000
```
- Frontend (Node.js + npm):
```bash
cd frontend
npm install
# set backend API URL for dev
# create .env.local with: VITE_API_URL=http://localhost:8000
npm run dev
```
- Agent (optional):
```powershell
cd Agent
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python my_agent/main.py
```

**Environment & Config**
- `VITE_API_URL`: frontend dev API base (e.g., `http://localhost:8000`). Set in `frontend/.env.local`.
- JWT secret and expiry: configured in `Backend/app/services/auth_service.py` (or via env overrides if added).

**Database Notes**
- Uses SQLite for local/dev. To recreate schema, run [scripts/init_sqlite.py](scripts/init_sqlite.py) or inspect [init.sql](init.sql).

**Troubleshooting**
- CORS errors: ensure `VITE_API_URL` matches backend origin and check CORS settings in [Backend/app/main.py](Backend/app/main.py).
- Port conflicts with uvicorn: stop other processes on ports 8000/8001/8002/8003 (Windows: `Get-NetTCPConnection` / `Stop-Process`).
- Register/login 500s: check backend logs for DB insert errors; ensure the DB schema includes the `users` table (see [database/sqlite_db.py](database/sqlite_db.py)).

**Next Steps & Recommendations**
- Add migrations (Alembic) for robust schema management.
- Add unit & integration tests for auth and ranking logic.
- Harden production settings: secure JWT secret, HTTPS, stricter CORS, rate-limiting.
- Add email verification and password reset flows for production readiness.

**Contributing**
- Fork, create a feature branch, and open a pull request with tests.

---
Generated on May 24, 2026.
