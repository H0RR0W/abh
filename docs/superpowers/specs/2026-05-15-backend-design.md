# Backend Design: ЕЦСМУ Demo

## Stack
- Next.js 14 API routes (same project)
- Prisma + SQLite (`prisma/dev.db`)
- JWT in httpOnly cookies (`staff_token`, `migrant_token`)
- Local file storage (`/uploads/`)

## Database Schema

**StaffUser** — сотрудники миграционной службы
- id, email, password (bcrypt), name, role (admin|inspector|operator|analyst), createdAt

**Migrant** — мигранты (все поля из JSON)
- id, firstName, lastName, middleName, citizenship, passportNumber, phone
- status (active|expired|blocked|pending), registrationDate, registrationExpiry
- patentNumber, patentExpiry, employer, address, lat, lng, lastSeen
- violations, photo (path), createdAt, updatedAt

**Document** — документы мигранта
- id, migrantId, type, name, status, filePath, uploadedAt

**Payment** — платежи
- id, migrantId, type (patent|fine|duty), amount, currency, date, status, description

**LocationHistory** — история геолокации
- id, migrantId, lat, lng, timestamp, address

**ChatMessage** — чат мигрант ↔ служба
- id, migrantId, from (migrant|service), text, createdAt

**SmsCode** — временные коды для mock SMS
- id, phone, code, expiresAt, used

## API Routes

### Auth
- `POST /api/auth/staff/login` — email+password → staff_token cookie
- `POST /api/auth/migrant/send-code` — phone → generates code (logged to console)
- `POST /api/auth/migrant/verify` — phone+code → migrant_token cookie
- `POST /api/auth/logout` — clear cookies

### Migrants (staff only)
- `GET /api/migrants` — list, query: search, status, citizenship
- `POST /api/migrants` — create new migrant
- `GET /api/migrants/[id]` — full profile
- `PATCH /api/migrants/[id]` — update status, data, send notification
- `DELETE /api/migrants/[id]` — soft delete

### Documents
- `GET /api/migrants/[id]/documents` — list
- `POST /api/migrants/[id]/documents` — upload (multipart)
- `PATCH /api/migrants/[id]/documents/[docId]` — update status

### Payments
- `GET /api/migrants/[id]/payments`
- `POST /api/migrants/[id]/payments` — record payment

### Chat
- `GET /api/chat/[migrantId]` — message history
- `POST /api/chat/[migrantId]` — send message

### Reports
- `GET /api/reports/migrants` — CSV export
- `GET /api/reports/payments` — CSV export

### Migrant self-service (migrant token)
- `GET /api/me` — own profile
- `GET /api/me/documents`
- `POST /api/me/documents` — upload own document
- `GET /api/me/payments`
- `POST /api/me/payments` — initiate payment (mock)
- `GET /api/me/chat`
- `POST /api/me/chat`

## Auth Middleware
`middleware.ts` at root:
- `/admin/*` → requires valid `staff_token`
- `/migrant/cabinet*` → requires valid `migrant_token`
- `/api/migrants/*` and `/api/chat/*` → requires staff_token
- `/api/me/*` → requires migrant_token

## File Upload
- `POST` with `multipart/form-data`
- Saved to `/uploads/[migrantId]/[filename]`
- Served via `GET /api/uploads/[...path]`

## Seed
`prisma/seed.ts` — imports existing `data/migrants.json`, creates all records in DB + 2 staff users:
- admin@migration.gov / admin123
- inspector@migration.gov / inspector123
