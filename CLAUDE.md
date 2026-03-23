# DTA — Designs By TA

Full-stack portfolio site + admin dashboard. Boston MA freelance agency, SEO-optimized.

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + react-helmet-async (port 5173)
- **Backend**: Node.js + Express + TypeScript (port 3001)
- **DB**: SQLite via Prisma ORM (`prisma/dev.db`)
- **Auth**: JWT in React context (never localStorage)

## Dev
```bash
# First time
cd client && npm install && cd ../server && npm install
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma && npx tsx prisma/seed.ts

# Daily
cd server && npm run dev          # Terminal 1
cd client && npm run dev          # Terminal 2
```
Admin: http://localhost:5173/admin — `admin` / `admin123`

## Deploy
- **Frontend**: Vercel — `vercel --prod --yes` (live at https://dta-puce.vercel.app)
- **Backend**: Railway (auto-deploys from GitHub `main`)
- Root `vercel.json` builds from `client/` with `outputDirectory: client/dist`

## Routes
| Route | Page | SEO Target |
|-------|------|------------|
| `/` | Home.tsx | "web design agency Boston MA" |
| `/why-choose-me` | WhyChooseMe.tsx | "best freelance web designer Boston" |
| `/about` | About.tsx | "Designs By TA Terrence Adderley" |
| `/services` | Services.tsx | "web design services Boston MA" |
| `/portfolio` | Portfolio.tsx | "web design portfolio Boston" |
| `/case-studies` | CaseStudies.tsx | "web design case studies results" |
| `/admin` | Admin.tsx | (admin only) |
| `/sign/:token` | SignProposal.tsx | (proposal signing) |
| `/demo/fintech` | demos/FintechDemo.tsx | NexaBank |
| `/demo/restaurant` | demos/RestaurantDemo.tsx | Chez Laurent |
| `/demo/product` | demos/ProductDemo.tsx | Apex Audio |

## API (all under /api)
- `POST /submissions` — contact form (no auth)
- `POST /auth/login` — JWT login
- `GET/POST /admin/submissions`, `/admin/clients`, `/admin/proposals`, `/admin/settings`, `/admin/expenses`
- `GET /admin/financials/summary`, `/admin/analytics/*`

## Design System — Obsidian Prestige
```js
background: '#08090D'  surface: 'rgba(255,255,255,0.03)'
accent: '#C6A84B'      accent-dim: '#8A6F2E'
text-primary: '#F5F0E8'  text-muted: '#6B6560'
font: Satoshi (local, client/public/fonts/, weights 300–900)
```

## Navigation
- **`Sidebar.tsx`** is the actual nav (not Navbar.tsx). PublicLayout renders Sidebar.
- Desktop: floating circular icon buttons, vertically centered left sidebar, logo top-left
- Mobile: dark top bar (logo centered, hamburger left, CTA right) + dropdown menu
- Logo click: scrolls to top if already on `/`, else navigates home

## Key Features
- **Tablet showcase** (Home, desktop only, `hidden md:block`): 300vh sticky scroll, 3 phases
  - Phase 1 (0–0.35): `rotateX` 62°→0° tilt, `perspective: 1400px`
  - Phase 2 (0.35–0.75): TabletPreview scrolls via `previewScrollY` (-900px translate)
  - Phase 3 (≥0.74): tablet exits right, "See, I told ya." reveals
  - CRITICAL: sticky section must NOT be inside `overflow-hidden` ancestor
  - Scale math: `window.innerWidth * 0.60 * 0.89 / 1024` (no DOM measurement)
- **Mobile showcase** (`md:hidden`): static dark section replaces the 3D animation
- **TabletPreview**: Villa Lumière luxury rental, tropical palette, vw-based fonts
- Hero text: `clamp(36px, 12vw, 180px)` — prevents mobile overflow
- Service cards: CSS hover animation disabled on mobile via `@media (max-width: 767px)`
- CaseStudies article tags: vertical rotated label (`writingMode: vertical-rl`, `rotate(180deg)`)
- Portfolio filter: All / Branding / Web App / E-Commerce
- Multi-step form → `/api/submissions`
- Full admin: submissions, clients, kanban, proposals, financials, GA4 analytics, settings

## DB Models
`Submission`, `Admin`, `Client`, `ClientDocument`, `ProjectScope`, `KanbanTask`,
`ClientStanding`, `PaymentEntry`, `Proposal`, `Invoice`, `AdminSettings`, `Expense`

AdminSettings: PayPal creds, GA4 (gaPropertyId, gaCredentials, gaMeasurementId), SMTP config

## Architecture Rules
- Sub-components at **module level** (not inside parent) — prevents remount/focus bugs
- Buttons in forms: always `type="button"`
- Axios errors: read `e?.response?.data?.error`
- SMTP: Office 365 (smtp.office365.com:587), reads DB first then .env fallback
