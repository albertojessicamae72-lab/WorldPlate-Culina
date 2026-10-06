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

3. In the activated environment, start the API:

   ```powershell
   npm run dev:api
   ```

4. In a second terminal, start the frontend:

   ```powershell
   npm run dev
   ```

The Vite development server proxies API requests to the local FastAPI server on port 8000. The backend creates its SQLite database on startup; local database files are excluded from Git.

## Build

```powershell
npm run build
```

No hosting or deployment provider is configured in this repository. Push commits to GitHub as usual, and configure deployment separately with the host you choose.
