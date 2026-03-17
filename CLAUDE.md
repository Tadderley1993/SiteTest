# DTA - Digital Agency Landing Page + Admin Dashboard

## Project Overview
A full-stack web application featuring a modern landing page with a multi-step contact form and an admin dashboard for managing submissions.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via Prisma ORM
- **Auth**: JWT-based admin authentication (stored in memory, not localStorage)

## Project Structure
```
/dta
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/    # HeroHeadline
│   │   │   ├── form/       # Multi-step form (Step1-3, FormPanel, SuccessMessage)
│   │   │   └── admin/      # LoginForm, Dashboard, SubmissionsTable
│   │   ├── pages/          # Home.tsx, Admin.tsx
│   │   ├── context/        # AuthContext.tsx
│   │   └── lib/            # api.ts (Axios client)
│   ├── tailwind.config.js
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # submissions.ts, auth.ts, admin.ts
│   │   ├── middleware/     # auth.ts (JWT verification)
│   │   └── index.ts
│   └── package.json
├── prisma/
│   ├── schema.prisma       # Submission + Admin models
│   ├── seed.ts             # Creates admin user
│   └── dev.db              # SQLite database
└── .env
```

## Running the Application

### Prerequisites
- Node.js 18+

### Setup (first time)
```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Generate Prisma client and create database
cd .. && npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma

# Seed admin user
npx tsx prisma/seed.ts
```

### Start Development Servers
```bash
# Terminal 1 - Backend (port 3001)
cd server && npm run dev

# Terminal 2 - Frontend (port 5173)
cd client && npm run dev
```

### Access
- Landing page: http://localhost:5173
- Admin dashboard: http://localhost:5173/admin
  - Username: `admin`
  - Password: `admin123`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/submissions` | No | Create new form submission |
| POST | `/api/auth/login` | No | Admin login, returns JWT |
| GET | `/api/admin/submissions` | JWT | List all submissions |
| GET | `/api/admin/submissions/:id` | JWT | Get single submission |

## Database Schema

### Submission
- `id`, `firstName`, `lastName`, `email`, `phone`, `clientType`
- `services` (JSON string of selected services)
- `description`, `teamSize`, `budget`
- `timelineMonths`, `timelineWeeks`, `timelineDays` (optional)
- `createdAt`

### Admin
- `id`, `username`, `passwordHash`, `createdAt`

## Design Tokens (Tailwind) — POST REDESIGN (2026-03-16)
```js
colors: {
  background: '#000000',
  surface: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#ffffff',
  'accent-secondary': '#8a8f98',
  'text-primary': '#ffffff',
  'text-muted': '#8a8f98',
  'slate-grey': '#1a1c23',
  'cool-grey': '#8a8f98',
}
fonts: {
  display: ['General Sans', 'sans-serif'],  // Fontshare
  body: ['General Sans', 'sans-serif'],
}
```

## PRE-REDESIGN SNAPSHOT — revert to this to undo the 2026-03-16 redesign
```js
// tailwind.config.js colors (original)
colors: {
  background: '#080A0F',
  surface: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#E8FF47',
  'accent-secondary': '#47C6FF',
  'text-primary': '#F0F0F0',
  'text-muted': '#666666',
}
fonts: {
  display: 'Bebas Neue',
  body: 'DM Sans',
}
// index.html fonts (original)
// Google Fonts: Bebas Neue + DM Sans
// Hero layout: BeamsBackground + HeroHeadline (left) + FormPanel (right), dot texture, vignette
// All section headings: font-display uppercase (Bebas Neue large caps)
// Accent color used throughout as yellow-green highlight (#E8FF47)
```

## Demo Mode (OFF — live mode active)
`client/src/pages/Home.tsx` — `formCompleted` defaults to `false` (live mode).
**To re-enable demo mode:** Change `useState(false)` to `useState(true)` to skip the form gate.

## Key Features
- Glassmorphism UI with `backdrop-blur-xl` effects
- Framer Motion animations (staggered word reveal, step transitions)
- Multi-step form with validation
- Expandable submission rows in admin table
- Search/filter submissions by name or email
