# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BSL Plataforma - Medical occupational health system built with Node.js/Express backend and vanilla JavaScript frontend. The system manages patient medical exams, certifications, and appointments with a dual-database architecture: PostgreSQL for the main platform and Wix CMS as the source of truth for patient records.

## Development Commands

```bash
npm install        # Install dependencies
npm start          # Start production server (node server.js)
npm run dev        # Start development server with auto-reload (nodemon)
```

Server runs on port 8080 by default (configurable via PORT env var).

## Architecture Overview

### Dual-Database System
The platform operates with TWO databases that must stay synchronized:

1. **PostgreSQL (Platform Database)**: Main operational database
   - Tables: `formularios`, `HistoriaClinica`, `usuarios`, `empresas`
   - Used by web application for real-time operations
   - Contains both user-generated data and synced data from Wix

2. **Wix CMS (Source of Truth)**: External content management system
   - Collections: `HistoriaClinica`, `FORMULARIO`, `CHATBOT`
   - Accessed via HTTP functions at `https://www.bsl.com.co/_functions/`
   - Medical data entered by doctors goes here first
   - Requires periodic synchronization to PostgreSQL

### Synchronization Pattern
Medical data flows: **Wix → PostgreSQL** (Wix is authoritative for medical records)

Key synchronization scripts:
- `migracion-historia-clinica.js` - Full migration of HistoriaClinica from Wix to PostgreSQL
- `sincronizar-datos-medicos.js` - Daily sync of medical fields (mdConceptoFinal, mdDx1, etc.) for records with fechaConsulta = today
- `migracion-formulario.js` - Migration of FORMULARIO collection from Wix

### Backend (server.js - ~9000 lines)

Single Express server handling:
- **Authentication & Authorization**: JWT-based auth with role-based permissions (ADMIN, APROBADOR, MEDICO, etc.)
- **Patient Management**: CRUD operations for patient records across both databases
- **Medical Exams**: Audiometry, visiometry, psychological tests
- **Certificate Generation**: PDF generation using Puppeteer
- **Wix Integration**: HTTP endpoints to fetch/sync data with Wix CMS

Key endpoint patterns:
- `/api/historia-clinica/*` - Patient medical history (synced from Wix)
- `/api/formularios/*` - Patient intake forms
- `/api/ordenes/*` - Medical exam orders
- `/api/auth/*` - Authentication endpoints
- `/api/admin/*` - Admin operations (user management, permissions)

### Frontend (public/)

Multiple HTML pages with vanilla JavaScript (no framework):
- `ordenes.html` - Main dashboard for viewing/managing patient orders
- `panel-admin.html` - Admin panel for user management
- `panel-empresas.html` - Company portal for viewing employee exams
- `index.html` - Patient intake form (multi-step wizard)
- `audiometria.html`, `visiometria.html` - Exam interfaces
- `certificado-template.html` - Medical certificate template

Frontend architecture:
- Direct DOM manipulation (no virtual DOM)
- Fetch API for backend communication
- Inline event handlers and global functions
- Modal-based workflows for patient details

### Wix Integration (WIX/)

Backend functions that run on Wix platform (deployed separately):
- `http-functions.js` - Main HTTP endpoints exposed by Wix
  - `get_historiaClinicaPorFecha` - Get records by consultation date
  - `get_exportarHistoriaClinica` - Paginated export for migration
  - `post_updateHistoriaClinica` - Update medical records
- `exposeDataBase.js` - Database query functions
- `agendarAlonso.js` - Appointment scheduling logic
- `automaticWhp.js` - WhatsApp automation

These files use Wix SDK (`wix-data`, `wix-fetch`) and must be deployed to Wix separately from the main platform.

## Data Flow Patterns

### Patient Order Creation
1. Company creates order in Wix → generates `_id`
2. Patient fills form at `/index.html?_id=xxx`
3. Form data saved to PostgreSQL `formularios` table
4. Data synced back to Wix `FORMULARIO` collection
5. Medical exam conducted → doctor enters results in Wix
6. Results synced to PostgreSQL via `sincronizar-datos-medicos.js`

### Modal Details in ordenes.html
The patient details modal loads data from **PostgreSQL HistoriaClinica table** via `/api/historia-clinica/:id` endpoint. If medical fields (mdConceptoFinal, mdDx1, etc.) appear empty, run the sync script to pull latest data from Wix.

## Database Schema

### Key Tables

**formularios** (PostgreSQL)
- Patient intake form submissions
- Auto-migrates new columns on server startup
- Links to HistoriaClinica via `wix_id` foreign key

**HistoriaClinica** (PostgreSQL)
- Medical history records synced from Wix
- Primary key: `_id` (Wix-generated UUID)
- Critical fields: `numeroId` (patient ID), `atendido` (status), `mdConceptoFinal` (medical concept), `mdDx1/mdDx2` (diagnoses)
- Index on: `numeroId`, `celular`, `codEmpresa`, `fechaAtencion`

**usuarios** (PostgreSQL)
- Platform user accounts
- Roles: ADMIN, MEDICO, APROBADOR, EMPRESA
- Permissions stored as JSON array

### Field Naming Conventions
- **Frontend**: camelCase (primerNombre, numeroId)
- **PostgreSQL**: snake_case for formularios, camelCase with quotes for HistoriaClinica ("primerNombre")
- **Wix**: camelCase (primerNombre, numeroId)

Careful mapping required when transforming data between systems.

## Environment Variables

Required in `.env`:
```
# PostgreSQL (DigitalOcean)
DB_HOST=
DB_PORT=25060
DB_USER=
DB_PASSWORD=
DB_NAME=defaultdb

# Server
PORT=8080

# JWT
JWT_SECRET=

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```

## Migration & Sync Scripts

Run from project root:

```bash
# Full migration from Wix to PostgreSQL
node migracion-historia-clinica.js [--skip=N] [--dry-run] [--desde=YYYY-MM-DD]

# Daily sync of medical data for today's consultations
node sincronizar-datos-medicos.js [--dry-run] [--fecha=YYYY-MM-DD]

# Migrate FORMULARIO collection
node migracion-formulario.js
```

Use `--dry-run` to preview changes without modifying database.

## Important Patterns & Gotchas

### Images and Base64
- Patient photos stored as base64 in PostgreSQL
- **NEVER** include `foto` field in list queries (causes memory issues)
- Always exclude in SELECT: `SELECT _id, nombre, apellido FROM ...` (not SELECT *)

### Wix Sync Failures
- Wix sync failures are logged but **do not block** the user response
- Form submissions succeed even if Wix sync fails
- Check server logs for sync errors

### Health Survey Tag Conversion
- Frontend checkboxes converted to tag arrays for Wix
- Only "Sí" (Yes) responses are sent as tags
- Example: `["Diabetes", "Hipertensión"]`

### Date Handling
- Wix uses UTC timestamps
- Colombia timezone is UTC-5
- Always adjust for timezone when comparing dates
- `fechaConsulta` vs `fechaAtencion`: consultation date vs actual exam date

### Authentication Flow
- JWT tokens stored in localStorage
- Middleware: `authMiddleware` (validates token), `requireAdmin` (checks role)
- Permissions checked via `hasPermission()` function
- Token expiration: 24 hours

## Code References

When modifying code, use these patterns for file references:
- Files: `[server.js](server.js)` or `[ordenes.html](public/ordenes.html)`
- Specific lines: `[server.js:3419](server.js#L3419)`
- Line ranges: `[ordenes.html:3822-3841](public/ordenes.html#L3822-L3841)`

## Debugging Common Issues

**Patient shows PENDIENTE but should be ATENDIDO:**
- Medical data in Wix but not synced to PostgreSQL
- Run: `node sincronizar-datos-medicos.js --fecha=YYYY-MM-DD`

**Modal shows incomplete medical data:**
- Check if endpoint `/api/historia-clinica/:id` returns full record
- Verify PostgreSQL has latest data from Wix
- Run sync script for the consultation date

**Form submission fails:**
- Check PostgreSQL connection (DB_HOST, DB_PASSWORD)
- Verify table schema matches code (auto-migration on startup)
- Check server logs for detailed error messages

**Wix endpoints return 404:**
- Ensure Wix functions are deployed (WIX/http-functions.js)
- Check URL format: `https://www.bsl.com.co/_functions/endpointName`
- Verify CORS headers in Wix function responses
