# DTA — Designs By TA

Full-stack portfolio site + admin dashboard. Boston MA freelance agency, SEO-optimized.

## Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + react-helmet-async (port 5173)
- **Backend**: Node.js + Express + TypeScript (port 3001)
- **DB**: PostgreSQL via Supabase + Prisma ORM (schema at `prisma/schema.prisma`, client output `server/node_modules/.prisma/client`)
- **Auth**: JWT in React context (never localStorage) — 15-min access tokens + 7-day refresh tokens, bcrypt-hashed sessions in DB

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
- **Frontend**: Vercel — auto-deploys from GitHub `main` (live at https://dta-puce.vercel.app and https://designsbyta.com)
- **Backend**: Railway (auto-deploys from GitHub `main`) — https://gallant-harmony-production-646a.up.railway.app
- Root `vercel.json` builds from `client/` with `outputDirectory: client/dist`
- Railway env vars required: `DATABASE_URL` (pooler, port 6543), `JWT_SECRET`
- Local `.env` uses `DIRECT_URL` as `DATABASE_URL` (pgbouncer pooler fails locally)
- **Schema changes**: run `npx prisma db push --schema=prisma/schema.prisma --accept-data-loss` locally BEFORE pushing to GitHub. Do NOT add db push to Railway start command (Railway has no DIRECT_URL and pgbouncer blocks DDL)
- Railway `startCommand`: `npx prisma generate --schema=prisma/schema.prisma && cd server && npm start`

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
| `/portal` | ClientPortal.tsx | (client portal — separate auth) |
| `/sign/:token` | SignProposal.tsx | (proposal signing) |
| `/demo/fintech` | demos/FintechDemo.tsx | NexaBank |
| `/demo/restaurant` | demos/RestaurantDemo.tsx | Chez Laurent |
| `/demo/product` | demos/ProductDemo.tsx | Apex Audio |

## API (all under /api)
- `POST /submissions` — contact form (no auth)
- `POST /auth/login` — admin JWT login (returns accessToken + refreshToken)
- `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/sessions`
- `GET /admin/submissions` — active (non-deleted) submissions only
- `GET /admin/submissions/trash` — trashed submissions (auto-purges >7 days old)
- `POST /admin/submissions/trash/:id/restore` — restore from trash
- `DELETE /admin/submissions/trash/:id` — permanent delete
- `DELETE /admin/submissions/:id` — soft delete (moves to trash, sets deletedAt)
- `GET/POST /admin/clients`, `/admin/proposals`, `/admin/settings`, `/admin/expenses`
- `GET /admin/financials/summary`, `/admin/analytics/*`
- `POST /client-auth/login` — client portal login
- `GET /portal/me`, `/portal/invoices`, `/portal/proposals`, `/portal/files`

## Design System

### Public Site — Obsidian Prestige (dark)
```js
background: '#08090D'  surface: 'rgba(255,255,255,0.03)'
accent: '#C6A84B'      accent-dim: '#8A6F2E'
text-primary: '#F5F0E8'  text-muted: '#6B6560'
font: Satoshi (local, client/public/fonts/, weights 300–900)
```

### Admin Dashboard — Agency OS (light)
```js
bg-main: '#f9f9f9'     bg-sidebar: '#f3f3f3'
primary: black         cards: white
font: Inter            icons: Material Symbols Outlined
ring: ring-1 ring-black/[0.06]   shadow: shadow-sm
```

## Navigation
- **`Sidebar.tsx`** is the actual nav (not Navbar.tsx). PublicLayout renders Sidebar.
- Desktop: floating circular icon buttons, vertically centered left sidebar, logo top-left
- Mobile: dark top bar (logo centered, hamburger left, CTA right) + cream dropdown menu
- Logo: `/logo-white.png` with gold filter on public site. Logo click: scrolls to top on `/`, navigates home elsewhere

## Admin Dashboard Views
`dashboard` | `submissions` | `clients` | `client-profile` | `deals` | `projects` (kanban) | `proposals` | `invoices` | `financials` | `files` | `analytics` | `automations` | `settings`
- Default view: `dashboard` (DashboardOverview.tsx)
- Sidebar: w-64, bg-[#f3f3f3], 12 nav items with Material Symbols icons
- Submissions view has **Inbox / Trash** tabs — delete moves to trash, restore brings back

## Client Portal (`/portal`)
- Separate JWT auth — `clientId` claim vs `adminId` for admin tokens
- ClientAuthContext.tsx — in-memory auth, never localStorage
- `portalApi.ts` — Axios instance with client Bearer token
- Admin sets client portal password via ClientProfile → "Portal Access" section
- Shows: project progress (kanban %), invoices, proposals, files

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
- Hero image: `/imgs/hero-desk.png` — grayscale, blur-[2px], dark overlay (bg-black/50)
- Service cards: CSS hover animation disabled on mobile via `@media (max-width: 767px)`
- CaseStudies article tags: vertical rotated label (`writingMode: vertical-rl`, `rotate(180deg)`)
- Portfolio filter: All / Branding / Web App / E-Commerce
- Multi-step form → `/api/submissions`
- Full admin: submissions (with trash bin), clients, kanban, proposals, financials, GA4 analytics, settings

## DB Models
`Submission`, `Admin`, `Session`, `LoginAttempt`, `Client`, `ClientDocument`, `ProjectScope`,
`KanbanTask`, `ClientStanding`, `PaymentEntry`, `Proposal`, `Invoice`, `AdminSettings`, `Expense`

- `Admin`: id, username, passwordHash, role, isActive, lastLoginAt
- `Session`: adminId, refreshToken (hashed), ipAddress, userAgent, expiresAt, revokedAt
- `Client`: passwordHash, portalActive, lastLoginAt for client portal
- `Submission`: has `deletedAt DateTime?` for soft delete / 7-day trash bin
- `AdminSettings`: PayPal creds, GA4 (gaPropertyId, gaCredentials, gaMeasurementId), SMTP config
- `Invoice`: has `paypalInvoiceId`, `paypalInvoiceUrl`, `paypalStatus` for PayPal integration

## Architecture Rules
- Sub-components at **module level** (not inside parent) — prevents remount/focus bugs
- Buttons in forms: always `type="button"`
- Axios errors: read `e?.response?.data?.error`
- SMTP: Resend (smtp.resend.com:2587) — Railway blocks port 587. From address must include email e.g. `Name <email@domain.com>`
- ESM module (`"type": "module"` in server/package.json) — never use `require()`, always top-level `import`
- CORS: manual middleware in `server/src/index.ts` — do NOT use the cors npm package
- `app.set('trust proxy', 1)` required for Railway reverse proxy (rate limiter)
- Admin refresh token stored in localStorage (`admin_refresh_token`, `admin_username`) for session persistence across page refresh — restored via `/auth/refresh` on mount in AuthContext

## PayPal Integration
- Settings → PayPal Account: enter Live Client ID + Secret, set environment to Live, click Save then Test Connection
- Invoices → open invoice → "Send via PayPal": creates invoice in PayPal + emails client with "Pay with PayPal" button
- "Sync PayPal" button on Invoices page updates payment status from PayPal
- `paypalFetch()` in `server/src/lib/paypal.ts` handles all PayPal API calls
- Live URL: `https://api-m.paypal.com` / Sandbox: `https://api-m.sandbox.paypal.com`
