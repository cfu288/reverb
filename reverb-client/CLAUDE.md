# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reverb is a clinical medical application for healthcare professionals to create and manage patient rounding sheets ("Scutsheets"). The application supports patient list management, blood pressure tracking, and PDF generation for hospital rounds.

## Key Technologies

- React 18.3.1 with TypeScript
- Vite 5.4.8 (build tool)
- React Router 7.0.2
- Tailwind CSS 3.4.13
- React PDF for document generation
- Recharts for data visualization
- React Hook Form + Zod for forms
- shadcn/ui component library

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

Note: No test commands are configured. TypeScript checking happens during build.

## Architecture Overview

### State Management
- Context API providers in `/src/providers/`:
  - `LocalAppSettingsProvider` - App-wide settings
  - `PatientListProvider` - Patient list state
  - `TemplatesProvider` - Template configuration

### Core Features
1. **Patient List Management** (`/src/components/PatientListPrintout/`)
   - Customizable patient information display
   - Assessment and plan sections
   - Lab result visualizations (Fishbone diagrams)

2. **Blood Pressure Tracking** (`/src/components/BPTable/`)
   - Data entry forms with OCR support via OpenAI
   - Statistical analysis and hypertension classification
   - Graph visualizations

3. **Template System** (`/src/pages/TemplateConfig/`)
   - Create/edit display templates
   - Configure visible sections and order

4. **PDF Generation** (`/src/pages/GeneratePDF.tsx`)
   - Export patient lists as PDFs

### Code Conventions
- Use TypeScript for all components
- Import paths use `@/` alias for `src/` directory
- Components organized by feature in subdirectories
- Custom hooks in `/src/hooks/`
- Models/types in `/src/models/`
- UI components from shadcn/ui in `/src/components/ui/`

### Important Files
- `/src/models/Patient.ts` - Patient data structure
- `/src/models/DisplayTemplate.ts` - Template configuration
- `/src/storage/StorageAPI.ts` - Session storage abstraction
- `/src/const.ts` - Application constants