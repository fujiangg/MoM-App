# MoM App — Complete setup (local & VM)

This document explains **what each step does** and gives **commands you can copy**. Work **from top to bottom** the first time. Replace placeholders like `YOUR_DB_HOST`, `APP_VM_IP`, and passwords with your real values.

**Project layout** (for path reference):

```text
my-app/                 ← open terminals here, or use full paths
├── backend/
│   ├── .env            ← you create/edit (secrets, DB URL)
│   ├── venv/           ← created by you (not in git)
│   ├── app/
│   └── requirements.txt
├── frontend/
│   ├── .env            ← optional (API URL for browser)
│   └── package.json
├── README.md
└── SETUP_GUIDE.md
```

---

## What runs where

| Component | Port | Purpose |
|-----------|------|---------|
| **PostgreSQL** | `5432` | Stores users and MoM records |
| **FastAPI** (backend) | `8000` | REST API + JWT auth |
| **Vite** (frontend dev) | `5173` | Web UI in development |

**First API start:** the app runs SQLAlchemy `create_all`, so tables are created automatically when the database connection works.

---

## Part 0 — Prerequisites

### What you need

- **Python 3.11+** for the backend virtualenv.
- **Node.js 20+** and **npm** for the frontend.
- **PostgreSQL 14+** on the same machine as the API *or* on a separate server the API can reach.
- **Git** if you clone the repo onto a VM.

### Check versions (local or VM)

```bash
python3 --version
node --version
npm --version
psql --version
```

### Install PostgreSQL (pick your OS)

**Ubuntu / Debian (typical Linux VM):**

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Explanation:** PostgreSQL must be **running** before you start the FastAPI app, or uvicorn will fail when it tries to create tables on startup.

---

## Part 1 — PostgreSQL: database and user

### 1.1 Why this step

The API expects a **database** and a **non-superuser** with access. You create them once per environment (local laptop vs VM).

### 1.2 Open a shell as the Postgres superuser

**Linux (common default user `postgres`):**

```bash
sudo -u postgres psql
```

**macOS Homebrew:** often your mac user owns the default cluster; try:

```bash
psql postgres
```

### 1.3 Run SQL (inside `psql`)

```sql
CREATE USER mom_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE mom_app OWNER mom_user;
GRANT ALL PRIVILEGES ON DATABASE mom_app TO mom_user;
\q
```

**Explanation:** `mom_app` is the database name used in connection strings; `mom_user` is the login the FastAPI app will use.

### 1.4 Test login as `mom_user`

```bash
psql "postgresql://mom_user:your_secure_password@localhost:5432/mom_app" -c "SELECT 1;"
```

If this fails, fix the password or PostgreSQL access before continuing.

### 1.5 Connection string (`DATABASE_URL`)

Format:

```text
postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME
```

**Special characters in the password:** characters like `@`, `#`, `/`, `:` must be **percent-encoded** in the URL, or the parser will break (wrong host, “could not translate host name …”).

| Character | Encode as |
|-----------|-----------|
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `:` | `%3A` |

**Generate encoded password quickly (Python):**

```bash
python3 -c "import urllib.parse; print(urllib.parse.quote('P@ssw0rd', safe=''))"
```

Use the **output** as the password segment in `DATABASE_URL` (e.g. `P%40ssw0rd`).

### 1.6 Which host to use

| Where Postgres runs | Use in `DATABASE_URL` |
|---------------------|------------------------|
| Same machine as API | `localhost` or `127.0.0.1` |
| Another VM | That VM's IP or hostname; firewall must allow **5432** from the API host |

---

## Part 2 — Backend (FastAPI)

### 2.1 Why a virtual environment

Isolates Python packages so `pip install` does not affect system Python.

### 2.2 Go to project root, then backend

Replace `/path/to/my-app` with your actual folder.

```bash
cd /path/to/my-app/backend
```

### 2.3 Create venv and install dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

**Windows PowerShell:**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.4 Create `backend/.env`

**Explanation:**

- `DATABASE_URL` — where SQLAlchemy connects; must be reachable from **this** machine.
- `SECRET_KEY` — used to sign JWT tokens; must stay secret and stable per environment.

**Example file** (edit values; encode password if needed):

```env
DATABASE_URL=postgresql://mom_user:your_secure_password@localhost:5432/mom_app
SECRET_KEY=change-this-to-a-long-random-string
```

**Optional — generate a random `SECRET_KEY`:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Append other keys only if your code uses them (e.g. `OPENAI_API_KEY=`).

### 2.5 Test DB connection (before uvicorn)

Still in `backend/` with venv activated:

```bash
source venv/bin/activate
python -c "from app.db.session import engine; from sqlalchemy import text; \
with engine.connect() as c: c.execute(text('SELECT 1')); print('Database OK')"
```

If you see `Database OK`, the URL and network are fine.

### 2.6 Start the API

```bash
cd /path/to/my-app/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Explanation:**

- `--host 0.0.0.0` — listen on all interfaces (needed when other machines or a browser on another host hit this VM).
- `--port 8000` — matches the default frontend expectation.

**Keep this terminal open** while developing.

### 2.7 Verify from another terminal

**Root endpoint:**

```bash
curl -s http://127.0.0.1:8000/
```

**Interactive API docs (Swagger):**

Open in a browser: **http://127.0.0.1:8000/docs**

### 2.8 Optional: smoke test script

Install `requests` in the same venv (not listed in `requirements.txt`):

```bash
cd /path/to/my-app/backend
source venv/bin/activate
pip install requests
```

With uvicorn **running**, in a **second** terminal:

```bash
cd /path/to/my-app/backend
source venv/bin/activate
python verify_backend.py
```

**Explanation:** `verify_backend.py` uses `BASE_URL = "http://localhost:8000"`. To test a remote API, edit that constant in the file or use curl (Part 4).

---

## Part 3 — Frontend (React + Vite)

### 3.1 Install dependencies

```bash
cd /path/to/my-app/frontend
npm install
```

### 3.2 (Optional) Tell the browser where the API is

**When you need `frontend/.env`:**

- Your **browser** loads the UI from `http://SOME_HOST:5173` but the API is at `http://OTHER_HOST:8000`.

Create `frontend/.env`:

```env
VITE_API_URL=http://OTHER_HOST:8000
```

**Examples:**

- Local dev, API on same PC: often **omit** this file; code falls back to `http://localhost:8000`.
- Browser on your laptop, API on VM `10.100.33.70`: `VITE_API_URL=http://10.100.33.70:8000`

**Important:** After changing `.env`, **restart** `npm run dev` (Vite reads env at startup).

### 3.3 Start the dev server

**Local only (default bind to localhost):**

```bash
cd /path/to/my-app/frontend
npm run dev
```

**VM: allow access from other machines** (listen on all interfaces):

```bash
cd /path/to/my-app/frontend
npm run dev -- --host 0.0.0.0
```

Open the URL Vite prints (e.g. **http://localhost:5173** or **http://APP_VM_IP:5173**).

### 3.4 CORS

Browsers only allow your UI to call the API if the API permits your UI's **origin** (scheme + host + port).

The list lives in `backend/app/main.py` (`origins` in `CORSMiddleware`).

If you use e.g. `http://10.100.33.70:5173`, add exactly that string to `origins`, save, and **restart uvicorn**.

### 3.5 Production-style build (optional)

```bash
cd /path/to/my-app/frontend
npm run build
```

Static files go to `frontend/dist/`. Serve them with Nginx or another static host; set `VITE_API_URL` **at build time** if you bake the API URL into the bundle, or use a relative `/api` proxy through Nginx.

---

## Part 4 — First user (signup) and login

There is **no** default username. Register once, then log in on the UI.

### 4.1 Via Swagger UI

1. Open **http://127.0.0.1:8000/docs** (or your server's `:8000/docs`).
2. Expand **POST /auth/signup**, try it out, body:

   ```json
   { "username": "alice", "password": "your_password" }
   ```

3. Use **POST /auth/login** with the same credentials (form fields `username`, `password`) to confirm.

### 4.2 Via curl (signup)

```bash
curl -s -X POST http://127.0.0.1:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"your_password"}'
```

### 4.3 Via curl (login — OAuth2 form)

```bash
curl -s -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=alice&password=your_password"
```

Response includes `access_token` for authenticated MoM routes.

### 4.4 Use the web app

Open the frontend URL, log in with **alice** / **your_password** (or whatever you created).

---

## Part 5 — Local machine: full sequence (copy-paste checklist)

Run in order; use **two terminals** for backend and frontend.

**Terminal A — database (one-time):** create user/DB (Part 1.3), then test with Part 1.4.

**Terminal B — backend:**

```bash
cd /path/to/my-app/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
# Create backend/.env with DATABASE_URL and SECRET_KEY (Part 2.4)
python -c "from app.db.session import engine; from sqlalchemy import text; \
with engine.connect() as c: c.execute(text('SELECT 1')); print('Database OK')"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal C — frontend:**

```bash
cd /path/to/my-app/frontend
npm install
npm run dev
```

**Then:** open **http://localhost:5173**, signup if needed (Part 4), log in.

---

## Part 6 — VM deployment (database VM + app VM)

Example from the main README (change to your IPs):

| Role | Example IP |
|------|------------|
| App server (runs FastAPI + optionally Vite) | `10.100.33.70` |
| Database server | `10.100.33.69` |

### 6.1 Put project on the app VM

**From your laptop (example with `scp`):**

```bash
scp -r /path/to/my-app user@10.100.33.70:~/
```

Or clone with Git on the VM:

```bash
ssh user@10.100.33.70
git clone <your-repo-url> my-app
```

### 6.2 On the database VM — PostgreSQL listens for remote API

**Concept:** `postgresql.conf` controls **listen_addresses**; `pg_hba.conf` controls **who** may connect from which IP.

**Find config (paths vary by distro):**

```bash
sudo -u postgres psql -c "SHOW config_file;"
sudo -u postgres psql -c "SHOW hba_file;"
```

**Typical edits** (use your editor; restart PostgreSQL after changes):

1. In `postgresql.conf` set e.g. `listen_addresses = '*'` (or the DB VM's LAN IP).
2. In `pg_hba.conf` add a line allowing the **app server** to connect with password auth, e.g.:

   ```text
   host  mom_app  mom_user  10.100.33.70/32  scram-sha-256
   ```

**Reload / restart:**

```bash
sudo systemctl restart postgresql
```

**Firewall (Ubuntu `ufw` example — app IP only):**

```bash
sudo ufw allow from 10.100.33.70 to any port 5432 proto tcp
sudo ufw enable
sudo ufw status
```

### 6.3 On the database VM — create user and database

Use Part 1.3 in `psql` as superuser. Test **from the app VM** (install `postgresql-client` if needed):

```bash
# On app VM
sudo apt install -y postgresql-client
psql "postgresql://mom_user:your_secure_password@10.100.33.69:5432/mom_app" -c "SELECT 1;"
```

### 6.4 On the app VM — `backend/.env`

Point at the **database VM**:

```env
DATABASE_URL=postgresql://mom_user:ENCODED_PASSWORD@10.100.33.69:5432/mom_app
SECRET_KEY=<long_random_secret>
```

### 6.5 On the app VM — backend (same as Part 2)

```bash
cd ~/my-app/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 6.6 On the app VM — open API port (example `ufw`)

```bash
sudo ufw allow 8000/tcp
sudo ufw reload
```

### 6.7 Frontend on VM (development from browser on your laptop)

**On app VM:**

```bash
cd ~/my-app/frontend
npm install
```

Create `frontend/.env` (API visible to **your browser**):

```env
VITE_API_URL=http://10.100.33.70:8000
```

```bash
npm run dev -- --host 0.0.0.0
```

**On laptop browser:** `http://10.100.33.70:5173`

Add `http://10.100.33.70:5173` to FastAPI **CORS** `origins` in `backend/app/main.py`, restart uvicorn.

### 6.8 Production note (Nginx)

For real deployments, put Nginx in front: TLS, static files from `frontend/dist`, optional reverse proxy `/` to FastAPI. Exact config depends on your domain; see README "Deployment Notes".

---

## Part 7 — Ports reference

| Port | Service | Who opens it |
|------|---------|----------------|
| **5432** | PostgreSQL | DB VM firewall: usually only app server |
| **8000** | FastAPI | App VM if you call API from outside |
| **5173** | Vite dev | App VM only if you browse UI from another machine |

---

## Part 8 — Troubleshooting

| Symptom | Likely cause | What to do |
|---------|----------------|------------|
| Weird hostname in PG error (`...@10.x` in host) | `@` in password not encoded | URL-encode password (Part 1.5) |
| `Network is unreachable` / timeout to DB | Wrong IP, VPN, or firewall | Ping/route; open 5432; check `pg_hba.conf` |
| Uvicorn exits on startup | DB connection fails | Fix `DATABASE_URL`; run Part 2.5 |
| CORS error in browser | UI origin not allowed | Add origin in `main.py`; restart API |
| 401 on `/mom` | No / invalid token | Signup + login (Part 4) |
| UI hits wrong API | Missing or stale `VITE_API_URL` | Set `frontend/.env`; restart `npm run dev` |

---

## Part 9 — Stop services

| What | How |
|------|-----|
| FastAPI | In its terminal: **Ctrl+C** |
| `npm run dev` | In its terminal: **Ctrl+C** |

---

## Quick command reference

```bash
# Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (local)
cd frontend && npm run dev

# Frontend (VM, listen externally)
cd frontend && npm run dev -- --host 0.0.0.0

# API health
curl -s http://127.0.0.1:8000/

# Docs (paste in browser)
# http://127.0.0.1:8000/docs
```

---

**Same repo everywhere:** repeat Parts **2–4** on each new machine; only **`DATABASE_URL`**, **`VITE_API_URL`**, **firewall**, and **CORS** change between laptop and VMs.
