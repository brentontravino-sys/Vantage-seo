# Local Setup & Testing Guide

## Quick Start (Recommended)

### On Windows:
1. Open Command Prompt or Git Bash
2. Navigate to the project folder:
   ```cmd
   cd C:\Users\User\Downloads\Vantage-seo
   ```
3. Install dependencies (if not already installed):
   ```cmd
   npm install
   ```
4. Start both servers:
   ```cmd
   npm run dev:full
   ```
   OR use the batch file:
   ```cmd
   start-dev.bat
   ```

### On Mac/Linux:
```bash
cd /path/to/Vantage-seo
npm install
npm run dev:full
```

## Alternative: Manual Setup

### Terminal 1: Start Mock Backend Server
```bash
npm run mock-server
```
Server runs on: http://localhost:3001

### Terminal 2: Start Frontend Development Server
```bash
npm run dev
```
Frontend runs on: http://localhost:5173

## Access the Application

Once both servers are running:
- **Application:** http://localhost:5173
- **API Server:** http://localhost:3001

## Test the Application

### 1. Register a New Account
- Go to: http://localhost:5173/register
- Enter any email (e.g., `test@example.com`)
- Enter any password (e.g., `password123`)
- For OTP verification, enter any 6-digit code (e.g., `123456`)

### 2. Login
- Go to: http://localhost:5173/login
- Use the email and password you registered with
- You should be redirected to the dashboard

### 3. Create a Project
- Click "Add Project" or similar button
- Enter a domain name (e.g., `example.com`)
- The project will be created and appear in your list

### 4. Test SEO Features
- **Site Explorer**: Enter a domain and click analyze
- **Backlinks**: Select a project and fetch backlinks
- **Keywords**: Add and track keywords
- **Site Audit**: Run a site audit
- **Reports**: Generate reports

## What's Running

### Mock Backend Server (Port 3001)
- Handles all API requests from the frontend
- Provides mock data for all features
- Includes authentication, entities (Projects, Keywords, etc.), and LLM integrations
- No database required - stores data in memory

### Vite Development Server (Port 5173)
- Serves the React frontend
- Hot module replacement for instant updates
- Connects to the mock backend via `VITE_API_BASE_URL=http://localhost:3001/api`

## Files Created/Modified

### New Files:
- `mock-server.cjs` - Mock backend server
- `.env` - Environment configuration
- `start-dev.bat` - Windows batch file for easy startup
- `TESTING-GUIDE.md` - Detailed testing instructions
- `LOCAL-SETUP.md` - This file

### Modified Files:
- `package.json` - Added scripts and devDependencies
- `src/api/client.js` - New API client using Axios
- `src/api/base44Client.js` - Updated to use new client
- All other files - Updated to remove Base44 dependencies

## Troubleshooting

### Port Already in Use
If you see "Port already in use" errors:

**For port 3001 (mock server):**
```bash
# Find and kill the process
npx kill-port 3001
# Then restart the server
npm run mock-server
```

**For port 5173 (Vite):**
```bash
npx kill-port 5173
npm run dev
```

### Module Not Found Errors
If you see "Cannot find module" errors for express, cors, etc.:
```bash
npm install
```

### Frontend Can't Connect to API
1. Verify mock server is running (check terminal output)
2. Check `.env` file has correct URL:
   ```
   VITE_API_BASE_URL=http://localhost:3001/api
   ```
3. Restart the frontend if you changed the .env file

### CORS Issues
The mock server is configured to accept requests from `http://localhost:5173`. If you change the Vite port:
1. Stop both servers
2. Update CORS origin in `mock-server.cjs` (line 11):
   ```javascript
   app.use(cors({
     origin: 'http://localhost:NEW_PORT',
     credentials: true
   }));
   ```
3. Restart servers

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend only |
| `npm run mock-server` | Start backend only |
| `npm run dev:full` | Start both frontend and backend |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linter |
| `npm run lint:fix` | Fix linting issues |

## Environment Variables

The application uses these environment variables (configured in `.env`):

```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_ID=vantage-seo-dev
```

You can modify these in the `.env` file or override them:
```bash
# On Windows
set VITE_API_BASE_URL=http://localhost:8080/api && npm run dev

# On Mac/Linux
VITE_API_BASE_URL=http://localhost:8080/api npm run dev
```

## Mock Server Features

The mock server provides:

### Authentication
- User registration and login
- JWT-like token system (mock tokens)
- OTP verification (accepts any 6-digit code)
- Password reset (logs to console)
- Google OAuth (redirects with mock token)

### Entity Management
- CRUD operations for all entities
- Filter and sort capabilities
- Bulk operations (create, update, delete)
- In-memory storage (resets on server restart)

### AI/ML Mock
- LLM invocation endpoint
- Returns realistic mock data based on prompt
- Supports various SEO analysis types

## What's Next

Once you've tested locally with the mock server, you can:

1. **Develop your real backend** using the API specifications in `MIGRATION-GUIDE.md`
2. **Connect to a real database** (MongoDB, PostgreSQL, etc.)
3. **Set up real authentication** (JWT, OAuth, etc.)
4. **Integrate with real AI services** (OpenAI, Google Gemini, etc.)
5. **Deploy to production** on Vercel, Netlify, AWS, etc.

See `MIGRATION-GUIDE.md` and `TESTING-GUIDE.md` for more details.

## Tips for Development

1. **Auto-restart**: Use `nodemon` for the mock server to auto-restart on changes:
   ```bash
   npx nodemon mock-server.cjs
   ```

2. **Logging**: The mock server logs to the console. Watch the terminal to see API requests.

3. **Data Persistence**: Mock server data is in-memory. For persistent testing data, implement a simple JSON file storage.

4. **Custom Mock Data**: Edit `mock-server.cjs` to return different mock data based on your needs.

## Stopping the Servers

To stop the servers:
- Press `Ctrl + C` in each terminal window
- Or close the terminal windows

## Verify It's Working

1. Check that http://localhost:3001 responds (mock server)
2. Check that http://localhost:5173 loads (frontend)
3. Try registering and logging in
4. Try creating a project
5. Try using the SEO analysis features

If all these work, your local development environment is set up correctly!
