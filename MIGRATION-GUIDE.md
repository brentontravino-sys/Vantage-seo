# Migration Guide: Base44 to Standalone Deployment

This document outlines the changes made to remove Base44 dependencies and prepare the Vantage SEO application for deployment on other cloud platforms.

## Changes Made

### 1. Dependencies (package.json)
**Removed:**
- `@base44/sdk` - Base44 SDK
- `@base44/vite-plugin` - Base44 Vite plugin

**Added:**
- `axios` - HTTP client for API requests

**Updated:**
- App name changed from `base44-app` to `vantage-seo`

### 2. Vite Configuration (vite.config.js)
**Removed:**
- Base44 Vite plugin and all its configuration options

**Result:**
```javascript
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
  ],
});
```

### 3. API Client (src/api/)
**Created:** `src/api/client.js` - New API client using Axios
- Implements the same interface as Base44 SDK (`auth`, `entities`, `integrations`)
- Includes axios interceptors for auth token management
- Provides RESTful API methods that can connect to any backend

**Updated:** `src/api/base44Client.js` - Now exports the new client for backward compatibility

### 4. Authentication (src/lib/AuthContext.jsx)
**Removed:**
- Base44 SDK imports (`@base44/sdk/dist/utils/axios-client`)
- Base44-specific app state checking

**Updated:**
- Uses the new API client for all auth operations
- Simplified to work with standard backend APIs

### 5. App Parameters (src/lib/app-params.js)
**Removed:**
- Base44-specific storage keys (`base44_` prefix)
- Base44-specific environment variables (`VITE_BASE44_` prefix)

**Updated:**
- Storage keys now use `app_` prefix
- Environment variables now use `VITE_` prefix without Base44
- Removed `functionsVersion` parameter (not needed for standard APIs)

### 6. Branding (index.html)
**Updated:**
- Removed Base44 logo reference
- Changed title from "Base44 APP" to "Vantage SEO"
- Changed favicon to local path

### 7. Image Helpers (src/ui/image-helpers.js)
**Removed:**
- `media.base44.com` from WIX_MEDIA_HOSTS

### 8. Project Structure
**Removed:**
- `Base44/` directory and all its contents

**Created:**
- `src/api/client.js` - New API client

**Updated:**
- `jsconfig.json` - Added `src/api/**/*.js` to include, removed exclusions

### 9. Documentation
**Created:**
- `README.md` - New documentation for standalone deployment
- `AGENTS.md` - Updated project context
- `MIGRATION-GUIDE.md` - This file

**Removed:**
- Old `.txt` versions of README and AGENTS files

## Backward Compatibility

To maintain backward compatibility with existing code:
- The variable `base44` is still used throughout the codebase
- It now imports from `@/api/base44Client` which exports our new client
- The new client mimics the Base44 SDK structure with:
  - `base44.auth` - Authentication methods
  - `base44.entities` - CRUD operations for entities
  - `base44.integrations` - Integration methods (LLM, etc.)

This means all existing components and pages continue to work without modification!

## API Endpoints Required

Your backend API must implement the following endpoints:

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/reset-password-request` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP code
- `GET /api/auth/{provider}` - OAuth provider redirect (Google, etc.)

### Entities
- `GET /api/entities/Project` - List projects
- `POST /api/entities/Project` - Create project
- `GET /api/entities/Project/:id` - Get project
- `PUT /api/entities/Project/:id` - Update project
- `DELETE /api/entities/Project/:id` - Delete project
- Similar CRUD endpoints for: Keyword, Backlink, AuditIssue, Report
- Bulk operations: `POST /api/entities/{Entity}/bulk`, `PUT /api/entities/{Entity}/bulk`, `DELETE /api/entities/{Entity}`

### Integrations
- `POST /api/integrations/core/invoke-llm` - Invoke LLM for AI features

## Environment Variables

Create a `.env` file with:

```bash
# Required
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_ID=your_app_id

# Optional
VITE_APP_NAME=Vantage SEO
```

## Deploying to Cloud Providers

### Vercel
```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `VITE_API_BASE_URL` = Your backend API URL
- `VITE_APP_ID` = Your app identifier

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

Set environment variables in Netlify dashboard.

### AWS Amplify
```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

### Firebase / Cloud Run
```bash
npm run build
# Deploy the dist/ directory
```

## Next Steps

1. **Set up your backend API**: Implement the required endpoints listed above
2. **Configure environment variables**: Set `VITE_API_BASE_URL` to your backend
3. **Test the application**: Run `npm run dev` and verify all features work
4. **Deploy**: Use one of the cloud provider methods above

## Known Limitations

1. **LLM Integration**: The `invoke-llm` endpoint must be implemented on your backend. You'll need to integrate with an AI service (OpenAI, Gemini, etc.).

2. **OAuth**: Social login providers must be configured on your backend.

3. **Data Storage**: You'll need to implement database storage for all entities (Project, Keyword, Backlink, AuditIssue, Report).

4. **File Storage**: If your app uses file uploads, implement appropriate storage.

## Support

For questions about:
- **Frontend**: Refer to this migration guide and the README
- **Backend Implementation**: You'll need to implement the API endpoints based on your technology stack
- **Deployment**: Refer to your cloud provider's documentation
