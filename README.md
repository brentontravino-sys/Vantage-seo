# Vantage SEO

A comprehensive SEO analysis and management application.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.

## Configuration

Create a `.env` file in the project root with the following variables:

```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_ID=your_app_id
```

- `VITE_API_BASE_URL`: The base URL of your backend API
- `VITE_APP_ID`: Your application identifier

## Run Locally

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite (typically http://localhost:5173).

## Build for Production

```bash
npm run build
```

This will create an optimized build in the `dist` directory.

## Project Structure

- `src/api/`: API client and configuration
  - `client.js`: Main API client with axios configuration
  - `base44Client.js`: Backward-compatible export (deprecated name)
- `src/pages/`: Application pages
- `src/ui/`: React UI components
- `src/lib/`: Libraries and utilities
- `src/hooks/`: Custom React hooks

## API Integration

The application uses a RESTful API for all backend operations. To configure your backend:

1. Implement the API endpoints as defined in `src/api/client.js`
2. Set the `VITE_API_BASE_URL` environment variable to point to your backend

### Required API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/reset-password-request` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP

#### Entities (CRUD operations)
- `GET /api/entities/Project` - List projects
- `POST /api/entities/Project` - Create project
- `GET /api/entities/Project/:id` - Get project
- `PUT /api/entities/Project/:id` - Update project
- `DELETE /api/entities/Project/:id` - Delete project
- Similar endpoints for: Keyword, Backlink, AuditIssue, Report

#### Integrations
- `POST /api/integrations/core/invoke-llm` - Invoke LLM for AI features

## Deploying to Cloud Providers

### Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Configure your backend API URL in the Vercel project settings

### Netlify

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify deploy`
3. Set environment variables in the Netlify dashboard

### AWS Amplify

1. Install Amplify CLI: `npm install -g @aws-amplify/cli`
2. Run: `amplify init`
3. Run: `amplify add hosting`
4. Deploy with: `amplify publish`

### Google Cloud Run / Firebase

1. Build the application: `npm run build`
2. Deploy the `dist` directory to your preferred hosting service
3. Configure environment variables for your backend API

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **UI Components**: Radix UI, Lucide React
- **State Management**: React Query (TanStack)
- **HTTP Client**: Axios
- **Routing**: React Router DOM

## License

Private - All rights reserved
