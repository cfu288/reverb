# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reverb is a medical application for healthcare professionals to manage patient rounding sheets ("Scutsheets"). It's a full-stack web application with:
- **Backend**: AdonisJS with TypeScript (in `/reverb-api`)
- **Frontend**: React with TypeScript and Vite (in `/reverb-client`)
- **Database**: PostgreSQL with Redis for caching
- **Architecture**: Multi-tenant with role-based access control

## Development Commands

### Backend (`/reverb-api`)
```bash
# Development server with hot reload
node ace serve --hmr

# Run tests
node ace test

# Lint code
npm run lint

# Type checking
npm run typecheck

# Build for production
node ace build

# Database migrations
node ace migration:fresh        # Fresh migration (drops all tables)
node ace migration:run          # Run pending migrations
node ace migration:rollback     # Rollback migrations
```

### Frontend (`/reverb-client`)
```bash
# Development server
npm run dev

# Build (includes TypeScript checking)
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Backend Structure
- **Multi-tenant architecture** with tenant isolation
- **JWT authentication** with refresh tokens
- **Role-based access control** using AdonisJS Bouncer
- **API endpoints** organized by resource (auth, patients, tenants, users)
- **Database models** with Lucid ORM relationships
- **VineJS validators** for input validation
- **WebSocket support** via Transmit for real-time updates

### Frontend Structure
- **React Context** for state management (no Redux)
- **React Query** for data fetching and caching
- **React Hook Form + Zod** for form handling
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **React PDF** for document generation

### Key Models and Data Flow
1. **Tenant** → **User** → **Role** → **Permission** (RBAC structure)
2. **User** → **PatientList** → **Patient** (data ownership)
3. Patient data stored as JSON with configurable display templates

## Important Implementation Notes

### Authentication Flow
- Login returns access and refresh tokens
- Access tokens expire in 30 minutes
- Refresh tokens used to get new access tokens
- Frontend stores tokens in session storage

### Patient Data Structure
- Patients have flexible JSON data storage in `patient_data` field
- Blood pressure data tracked separately with timestamps
- Display templates control which fields are shown in UI

### API Response Format
All API responses follow a consistent structure:
```typescript
{
  success: boolean,
  data?: any,
  error?: string,
  message?: string
}
```

### Testing Approach
- Backend: Japa test runner with unit and functional tests
- Frontend: Currently no test framework (only linting)
- Run backend tests with `node ace test`

### Database Setup
PostgreSQL must be running locally. See `/reverb-api/README.md` for detailed setup instructions including user creation and permissions.

## Code Conventions

### Import Aliases
- Backend: `#controllers/*`, `#models/*`, `#services/*` etc.
- Frontend: `@/` maps to `src/` directory

### File Organization
- Backend: Feature-based organization (controllers, models, services)
- Frontend: Component-based with feature directories

### TypeScript Usage
- Strict mode enabled in both projects
- Use interfaces for data models
- Avoid `any` types

### Error Handling
- Backend: Custom exceptions in `app/exceptions/`
- Frontend: React Error Boundaries and try-catch blocks
- All errors logged with appropriate context

## Note on Undo/Redo Implementation

The undo/redo implementation plan has been moved to the Lexical Integration Requirements document (`LEXICAL_INTEGRATION_REQUIREMENTS.md`) where it belongs with other feature planning. The implementation will use a custom history manager since json-joy doesn't provide a built-in UndoManager.