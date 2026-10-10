# Culina
## Prerequisites

- Node.js and npm
- Python 3.10 or newer

## Run locally on Windows

1. Install frontend dependencies:

   ```powershell
   npm install
   ```

2. Create and prepare a Python virtual environment:

   ```powershell
   py -m venv backend\.venv
   .\backend\.venv\Scripts\Activate.ps1
   python -m pip install -r backend\requirements.txt
   ```

3. In the activated environment, start the API in the first terminal:

   ```powershell
   npm run dev:api
   ```

4. Open a second terminal in the project folder and start Vite:

   ```powershell
   npm run dev
   ```

Vite prints a local URL, usually `http://localhost:5173`. Keep both terminals running while testing. Vite's development server proxies API requests to the local FastAPI server on port 8000. The backend creates its SQLite database on startup; local database files are excluded from Git.

`npm run dev` is only for local development; it does not deploy the app or tell Vercel about accounts. Vercel builds and deploys the frontend from the connected Git repository. Account registration and login requests go from that frontend to the FastAPI backend through the `/api/*` rewrite in `vercel.json`. The login session is kept in that user's browser, while account records are stored by the backend.

Locally, the backend uses SQLite at `backend/data/culina.sqlite3`. In production, configure the Render backend with a managed PostgreSQL database and set its `DATABASE_URL` environment variable to the database's **Internal Database URL**. The backend creates its tables on startup and uses PostgreSQL whenever `DATABASE_URL` is set; otherwise, it continues to use local SQLite. Do not put database URLs or database files in Git.

## Production account database

1. In Render, create a managed PostgreSQL database. In the backend web service's **Environment** settings, add `DATABASE_URL` with the database's **Internal Database URL**, then redeploy the backend. Wait for `/api/health` to respond successfully before testing signup from the Vercel site.
2. If you want to keep the accounts and related records from your local SQLite database, first back up `backend/data/culina.sqlite3`. From a terminal with the backend dependencies installed, run the migration using the database's **External Database URL** (the internal URL is only reachable by services inside Render):

   ```powershell
   cd backend
   $env:DATABASE_URL = Read-Host "Paste the Render External Database URL"
   python .\migrate_sqlite_to_postgres.py --dry-run
   python .\migrate_sqlite_to_postgres.py
   ```

   The migration copies accounts, password hashes, profile data, messages, saved items, and related records. It does not copy browser login sessions or print passwords/account contents, so users will need to log in again. Keep the SQLite backup until you have verified the imported accounts on the live site.
3. In Render, use the **Internal Database URL** for the backend service's `DATABASE_URL` setting. Keep the same PostgreSQL database and URL on future deployments; do not create a new database for each deployment.

Without `DATABASE_URL`, the deployed backend falls back to a local SQLite file, which may be lost when its service restarts or redeploys. Vercel only hosts the frontend; it does not persist backend account data.

Community messages are stored in that SQLite database and do not expire when someone logs out or leaves the app idle. Conversations initially load the latest 100 messages; scroll to the top to load older messages. Deleting a conversation hides it from that user's inbox; its messages are permanently deleted only after both participants delete it.

## Build

```powershell
npm run build
```

The frontend is deployed on Vercel and the FastAPI backend is deployed on Render. `vercel.json` forwards `/api/*` requests to the Render backend and sends other paths to `index.html` for client-side routing.
