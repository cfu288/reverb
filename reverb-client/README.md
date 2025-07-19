# Reverb Client

React-based frontend for the Reverb medical patient management system.

## Overview

Reverb is a clinical medical application for healthcare professionals to create and manage patient rounding sheets ("Scutsheets"). The application supports:
- Multi-tenant organization management
- Real-time collaborative editing
- Patient list management
- Blood pressure tracking
- PDF generation for hospital rounds

## Tech Stack

- **React 18.3.1** with TypeScript
- **Vite 5.4.8** - Build tool
- **React Router 7.0.2** - Routing
- **Tailwind CSS 3.4.13** - Styling
- **shadcn/ui** - Component library
- **React PDF** - Document generation
- **React Hook Form + Zod** - Form handling
- **@adonisjs/transmit-client** - WebSocket support for real-time features
- **json-joy** - CRDT support for conflict-free collaborative editing

## Getting Started

### Prerequisites
- Node.js 20.11.0 or higher
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Architecture

### State Management
- **Context API** for global state management
- **React Query** for server state and caching
- **Local providers** in `/src/providers/`:
  - `LocalAppSettingsProvider` - App-wide settings
  - `PatientListProvider` - Patient list state
  - `TemplatesProvider` - Template configuration
  - `TransmitProvider` - WebSocket connection management
  - `TenantProvider` - Multi-tenant context

### Real-Time Features
The app uses WebSockets via AdonisJS Transmit for real-time collaboration:

```typescript
// Subscribe to real-time updates
const { data, error, isSubscribed } = useTransmitStream('patient-list/my-list');

// WebSocket connection states
- disconnected: No active subscriptions
- connected: Successfully subscribed to channels
- reconnecting: Attempting to reconnect
- failed: Connection failed after max attempts
```

### CRDT Schema
Patient lists use JSON CRDTs for conflict-free collaborative editing:

```typescript
// Patient data structure with CRDT support
- Patients (array)
  - Basic info (id, mrn, dob, names, location)
  - Clinical data (one_liner, hpi)
  - Collections (todos, labs, vitals, meds, assessment_and_plan)
```

### Authentication
- JWT-based authentication with refresh tokens
- Tokens stored in session storage
- Automatic token refresh for WebSocket connections
- Multi-tenant support with organization switching

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── AppLayout.tsx
│   ├── WebSocketStatus.tsx
│   └── ...
├── contexts/        # React contexts
├── hooks/          # Custom React hooks
├── models/         # TypeScript models
├── pages/          # Page components
├── providers/      # Context providers
├── schemas/        # Validation schemas and CRDT definitions
├── services/       # API services
├── storage/        # Storage utilities
└── utils/          # Helper utilities
    └── crdtHelpers.ts  # CRDT operation helpers
```

## Key Features

### Multi-Tenant Support
- Users can belong to multiple organizations
- Organization switcher in user menu
- Data isolation between tenants
- Automatic tenant context in API calls

### Real-Time Collaboration
- WebSocket-based real-time updates
- Conflict-free collaborative editing using CRDTs
- Visual connection status indicator
- Automatic reconnection with exponential backoff

### Patient List Management
- Create and manage patient lists
- Customizable display templates
- Rich patient data model
- PDF export functionality

## Environment Variables

```env
VITE_API_URL=http://localhost:3333  # Backend API URL
```

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Use absolute imports with `@/` prefix
- Follow existing component patterns
- No inline comments unless necessary

### Testing
Currently no test framework configured. TypeScript checking happens during build.

### Security
- Never store sensitive data in localStorage
- All API calls require authentication
- Tenant isolation enforced at API level

## Troubleshooting

### WebSocket Connection Issues
- Check that backend is running
- Verify authentication tokens are valid
- Look for connection status in bottom-right corner
- Check browser console for detailed errors

### Build Issues
- Clear node_modules and reinstall dependencies
- Ensure Node.js version meets requirements
- Check for TypeScript errors with build command