# Vantage SEO - Local Development Summary

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend only (port 5173) |
| `npm run mock-server` | Start backend only (port 3001) |
| `npm run dev:full` | Start both frontend and backend concurrently |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linter (passes) |
| `npm run typecheck` | Run TypeScript type check |

## Running the Application

### Option 1: Start both servers (recommended)
```bash
npm run dev:full
```
- Frontend: http://localhost:5173
- Mock Backend: http://localhost:3001

### Option 2: Manual setup
**Terminal 1 - Mock Server:**
```bash
npm run mock-server
```
Server runs on: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

## Application Features

- **Authentication**: Registration, login, OTP verification (accepts any 6-digit code), logout
- **Project Management**: Create, read, update, delete projects
- **SEO Analysis**:
  - Site Explorer: Enter a domain and analyze
  - Backlinks: Fetch and manage backlinks
  - Keywords: Add and track keywords
  - Site Audit: Run site audits
  - Reports: Generate reports
- **Mock LLM Integration**: Returns realistic mock data based on prompts

## Build Notes

- **Lint**: Passes cleanly
- **Typecheck**: Shows errors related to component library type definitions (radix-ui, embla-carousel, sonner, etc.) - these are type definition mismatches, not application logic errors
- **Build**: Production build has alias resolution issues with Vite v6 `@/` path aliases, but development mode works fully

## Testing Workflow

1. Register: http://localhost:5173/register
   - Enter any email (e.g., `test@example.com`)
   - Enter any password (e.g., `password123`)
   
2. Login: http://localhost:5173/login
   - Use registered email/password
   - Redirects to dashboard

3. Create a project:
   - Click "Add Project"
   - Enter a domain name (e.g., `example.com`)

4. Test SEO features:
   - **Site Explorer**: Enter a domain and click analyze
   - **Backlinks**: Select a project and fetch backlinks
   - **Keywords**: Add and track keywords
   - **Site Audit**: Run a site audit
   - **Reports**: Generate reports

## Troubleshooting

- **Port already in use**: Kill processes on ports 3001 or 5173, then restart
- **Module not found**: Run `npm install`
- **CORS issues**: Update CORS origin in `mock-server.cjs` if changing Vite port