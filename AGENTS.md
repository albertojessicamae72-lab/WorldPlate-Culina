# AGENTS.md

## Project Context

This repository contains a React/Vite frontend and a FastAPI backend. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup and project workflow.

## Key Files

- `src/`: frontend application source.
- `backend/app/`: FastAPI application and API routes.
- `backend/requirements.txt`: Python backend dependencies.
- `vite.config.js`: Vite configuration, including the local API proxy.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Run the frontend with `npm run dev`.
- Run the backend with `npm run dev:api` from an activated Python environment with `backend/requirements.txt` installed.
- Run the relevant checks from `package.json` before finishing code changes.
