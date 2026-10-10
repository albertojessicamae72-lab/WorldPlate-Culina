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

The backend currently stores records in a SQLite file under `backend/data`. For accounts to survive production restarts and deployments, make sure the Render service uses persistent storage for that file or move production data to a managed database. Vercel does not provide that persistence for the backend.

Community messages are stored in that SQLite database and do not expire when someone logs out or leaves the app idle. Conversations initially load the latest 100 messages; scroll to the top to load older messages. Deleting a conversation hides it from that user's inbox; its messages are permanently deleted only after both participants delete it.

## Build

```powershell
npm run build
```

The frontend is deployed on Vercel and the FastAPI backend is deployed on Render. `vercel.json` forwards `/api/*` requests to the Render backend and sends other paths to `index.html` for client-side routing.
