# Testing Guide for Vantage SEO Local Development

This guide explains how to run and test the Vantage SEO application locally with the mock backend server.

## Quick Start

### Option 1: Using npm scripts (Recommended)

```bash
# Install all dependencies (if not already done)
npm install

# Start both mock server and frontend in one command
npm run dev:full
```

This will:
1. Start the mock backend server on http://localhost:3001
2. Start the Vite frontend on http://localhost:5173
3. Both will run simultaneously

### Option 2: Using the batch file (Windows)

```bash
# On Windows, run:
start-dev.bat
```

### Option 3: Manually in separate terminals

**Terminal 1 - Mock Backend:**
```bash
npm run mock-server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access the Application

Once both servers are running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## Test Accounts

You can register and login with any email/password combination:
- Email: `test@example.com` (or any email)
- Password: `password123` (or any password)

The mock server stores users in memory, so they'll be available as long as the server is running.

## Testing Features

### Authentication Flow

1. **Register**: Create a new account at http://localhost:5173/register
   - Enter any email and password
   - The mock server accepts any 6-digit OTP code for verification

2. **Login**: Sign in at http://localhost:5173/login
   - Use the credentials you registered with
   - Google OAuth is also mocked (redirects back with a token)

3. **Forgot Password**: Test password reset flow
   - Request a reset link
   - The mock server logs the request (check server console)

### Project Management

1. **Create a Project**: Use the "Add Project" dialog
   - Enter a domain name
   - The mock server will create the project and return it

2. **List Projects**: Projects appear in the sidebar
   - All CRUD operations work with the mock server

### SEO Analysis Features

1. **Site Explorer**: Test domain overview and analysis
   - Enter a domain (e.g., "example.com")
   - The mock server returns sample SEO data
   - Includes domain rating, traffic, keywords, etc.

2. **Backlinks**: Test backlink analysis
   - Select a project
   - Click "Fetch backlinks"
   - The mock server returns 25 sample backlinks

3. **Keywords**: Test keyword tracking
   - Add keywords manually
   - The mock server persists them for the session

4. **Site Audit**: Test site audit
   - Select a project
   - Click "Analyze Site"
   - The mock server returns 20 sample audit issues

5. **Reports**: Test report generation
   - Create reports from existing data
   - The mock server handles all CRUD operations

## API Endpoints Available

All endpoints are available at `http://localhost:3001/api`:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-otp` - Verify OTP (accepts any 6-digit code)
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/google` - Mock Google OAuth

### Entities
- `GET /api/entities/Project` - List projects
- `POST /api/entities/Project` - Create project
- `GET /api/entities/Project/:id` - Get project
- `PUT /api/entities/Project/:id` - Update project
- `DELETE /api/entities/Project/:id` - Delete project
- `GET /api/entities/Project/filter` - Filter projects
- Similar endpoints for: Keyword, Backlink, AuditIssue, Report
- Bulk operations: `/bulk`, `/delete-many`

### Integrations
- `POST /api/integrations/core/invoke-llm` - Mock LLM calls
  - Returns realistic mock data based on prompt
  - Supports: domain overview, organic search, backlinks, site audit, etc.

## Troubleshooting

### "Cannot find module 'express'"
Run: `npm install`

### "Port already in use"
- Mock server uses port 3001
- Vite uses port 5173
- If these are taken, either:
  - Stop the existing processes
  - Update the port in `mock-server.cjs` (line 6)

### "Invalid token" or "Not authenticated"
- Make sure you're logged in
- Check that the token is being sent in the Authorization header
- The mock server extracts user ID from the token: `mock_token_{userId}_{timestamp}`

### "404 Not Found" on API calls
- Verify the mock server is running
- Check that `VITE_API_BASE_URL` in `.env` is set to `http://localhost:3001/api`

### CORS issues
- The mock server is configured to allow requests from `http://localhost:5173`
- If you change the Vite port, update the CORS origin in `mock-server.cjs` (line 11)

## Mock Data Behavior

The mock server provides realistic but simulated data:

- **Domain Analysis**: Returns sample SEO metrics (domain rating 85, traffic 150K, etc.)
- **Backlinks**: Returns 25 sample backlinks with various domain ratings
- **Keywords**: Returns sample keywords with positions, volumes, and traffic
- **Audit Issues**: Returns 20 sample issues with severities
- **Reports**: Handles report creation and storage

All data is stored in memory and will be lost when the server restarts.

## Console Output

The mock server logs activity to the console:
- User registrations and logins
- API requests
- Password reset requests
- OTP verifications

Check the terminal where the mock server is running to see these logs.

## Production vs Development

This mock server is for **development and testing only**. For production:

1. Implement a real backend API
2. Connect to a real database
3. Set up proper authentication
4. Configure real LLM/AI services
5. Update the API base URL in your environment variables

## Useful Commands

```bash
# Start both servers
npm run dev:full

# Start only mock server
npm run mock-server

# Start only frontend
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Next Steps

Once you've tested the application locally:

1. **Develop your real backend** using the API endpoint specifications
2. **Connect to a database** for persistent storage
3. **Configure real authentication** (JWT, sessions, etc.)
4. **Set up AI/LLM services** (OpenAI, Gemini, Claude, etc.)
5. **Deploy to a cloud provider** (Vercel, Netlify, AWS, etc.)

See `MIGRATION-GUIDE.md` for more details on production deployment.
