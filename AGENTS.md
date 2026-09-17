# AGENTS.md

## Project Context

This is a Vantage SEO application. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and deployment workflow.

## Key Files

- `src/`: frontend application source.
- `src/api/client.js`: main API client with axios configuration.
- `src/api/base44Client.js`: backward-compatible client export (deprecated).
- `vite.config.js`: Vite configuration.
- `.env`: environment values (not committed to git).

## Working Notes

- Use `npm run dev` for local development.
- The application expects a backend API to be running at the URL specified in `VITE_API_BASE_URL`.
- All API calls are made through the client defined in `src/api/client.js`.
- Run the relevant checks from `package.json` before finishing code changes:
  - `npm run lint` for code style
  - `npm run typecheck` for type checking
  - `npm run build` to verify production build
