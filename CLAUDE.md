# DTA - Designs By TA — Portfolio Site + Admin Dashboard

## Project Overview
A full-stack web application: a 6-page freelance agency portfolio site (SEO-optimized for Boston MA) with a multi-step contact form, and a full admin dashboard for managing submissions, clients, proposals, financials, and analytics.

## Tech Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Framer Motion + react-helmet-async
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via Prisma ORM
- **Auth**: JWT-based admin authentication (stored in memory, not localStorage)

## Project Structure
```
/dta
├── client/                       # React frontend (Vite, port 5173)
│   ├── public/
│   │   ├── fonts/                # Satoshi WOFF2 (Black, Bold, Medium, Regular, Light)
│   │   ├── imgs/                 # hero-desk.png, tablet-landscape.png, beach-hero.jpg, villa-palms.jpg, villa-room.jpg, villa-pool.jpg
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Navbar, Footer, CTASection, PageWrapper, SectionLabel, TabletPreview
│   │   │   ├── form/             # FormPanel, Step1-3, SuccessMessage
│   │   │   ├── admin/            # Full admin UI (see Admin section below)
│   │   │   └── ui/               # HoverBorderGradient, shimmer-button, button
│   │   ├── pages/
│   │   │   ├── Home.tsx          # / — hero parallax, stats, services, case study
│   │   │   ├── WhyChooseMe.tsx   # /why-choose-me
│   │   │   ├── About.tsx         # /about
│   │   │   ├── Services.tsx      # /services
│   │   │   ├── Portfolio.tsx     # /portfolio
│   │   │   ├── CaseStudies.tsx   # /case-studies
│   │   │   ├── Admin.tsx         # /admin
│   │   │   ├── SignProposal.tsx  # /sign/:token
│   │   │   └── demos/            # FintechDemo, RestaurantDemo, ProductDemo
│   │   ├── context/              # AuthContext.tsx (JWT in memory)
│   │   └── lib/                  # api.ts (Axios), utils.ts, addSignatureField.ts
│   ├── index.html                # SEO meta, OG tags, JSON-LD LocalBusiness, font preloads
│   ├── tailwind.config.js        # Obsidian Prestige design tokens
│   └── package.json
├── server/                       # Express backend (port 3001)
│   ├── src/
│   │   ├── routes/               # submissions, auth, admin, proposals, settings,
│   │   │                         #   paypal, expenses, financials, analytics
│   │   ├── middleware/           # auth.ts (JWT verification)
│   │   └── index.ts
│   └── package.json
├── prisma/
│   ├── schema.prisma             # Full schema (see Database Models below)
│   ├── seed.ts                   # Creates admin user
│   └── dev.db                    # SQLite database
└── .env                          # SMTP + DB + secrets
```

## Running the Application

### Prerequisites
- Node.js 18+

### Setup (first time)
```bash
cd client && npm install
cd ../server && npm install
cd .. && npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma
npx tsx prisma/seed.ts
```

### Start Development Servers
```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

### Access
- Site: http://localhost:5173
- Admin: http://localhost:5173/admin — `admin` / `admin123`

## Site Routes

| Route | File | SEO Target |
|-------|------|------------|
| `/` | pages/Home.tsx | "web design agency Boston MA" |
| `/why-choose-me` | pages/WhyChooseMe.tsx | "best freelance web designer Boston" |
| `/about` | pages/About.tsx | "Designs By TA Terrence Adderley" |
| `/services` | pages/Services.tsx | "web design services Boston MA" |
| `/portfolio` | pages/Portfolio.tsx | "web design portfolio Boston" |
| `/case-studies` | pages/CaseStudies.tsx | "web design case studies results" |
| `/admin` | pages/Admin.tsx | (admin only) |
| `/sign/:token` | pages/SignProposal.tsx | (proposal signing) |
| `/demo/fintech` | demos/FintechDemo.tsx | NexaBank demo |
| `/demo/restaurant` | demos/RestaurantDemo.tsx | Chez Laurent demo |
| `/demo/product` | demos/ProductDemo.tsx | Apex Audio demo |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/submissions` | No | Create form submission |
| POST | `/api/auth/login` | No | Admin login → JWT |
| GET | `/api/admin/submissions` | JWT | List submissions |
| GET | `/api/admin/submissions/:id` | JWT | Single submission |
| GET/POST | `/api/admin/clients` | JWT | Clients CRUD |
| GET | `/api/admin/:id/documents` | JWT | Client documents |
| GET/POST | `/api/admin/proposals` | JWT | Proposals |
| POST | `/api/admin/proposals/:id/send-email` | JWT | Email proposal |
| GET/POST | `/api/admin/settings` | JWT | AdminSettings |
| GET/POST | `/api/admin/expenses` | JWT | Expenses |
| GET | `/api/admin/financials/summary` | JWT | Financial summary |
| GET | `/api/admin/analytics/gtag-id` | No | GA4 measurement ID |
| GET | `/api/admin/analytics/*` | JWT | GA4 data endpoints |

## Database Models (Prisma)
`Submission`, `Admin`, `Client`, `ClientDocument`, `ProjectScope`, `KanbanTask`,
`ClientStanding`, `PaymentEntry`, `Proposal`, `Invoice`, `AdminSettings`, `Expense`

**AdminSettings** stores: PayPal credentials, GA4 credentials (gaPropertyId, gaCredentials, gaMeasurementId), SMTP config (smtpHost/Port/User/Pass/From/Secure)

## Design System — Obsidian Prestige

```js
// tailwind.config.js
colors: {
  background:       '#08090D',
  surface:          'rgba(255,255,255,0.03)',
  border:           'rgba(255,255,255,0.07)',
  accent:           '#C6A84B',   // warm gold
  'accent-dim':     '#8A6F2E',   // muted gold (hover)
  'text-primary':   '#F5F0E8',   // warm white
  'text-muted':     '#6B6560',   // warm grey
  'gold-glow':      'rgba(198,168,75,0.12)',
}
fontFamily: {
  sans:    ['Satoshi', 'sans-serif'],
  display: ['Satoshi', 'sans-serif'],
}
```

**Satoshi font** — served locally from `client/public/fonts/` (no CDN).
Weights available: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold), 900 (Black).

## Layout Components (all pages use these)
- **`Navbar`** — sticky, transparent on hero → solid on scroll, hamburger mobile menu, active link gold
- **`Footer`** — 4-column dark footer, internal links to all pages
- **`CTASection`** — wraps `FormPanel` (3-step form), shown above footer on every public page
- **`PageWrapper`** — renders `<Helmet>` tags (title, description, canonical, OG, Twitter) + page container
- **`SectionLabel`** — gold eyebrow label: `<SectionLabel number="01" label="Services" />`

## Key Features
- Hero parallax on Home: `useScroll` + `useTransform` (Framer Motion), "DESIGN POWER" ghost text behind image
- **Tablet showcase on Home**: 300vh sticky scroll section with 3 phases:
  - Phase 1 (0–35%): tablet tilts from flat (62°) to upright using `rotateX` + perspective
  - Phase 2 (35–75%): `TabletPreview` component (luxury vacation rental mini-site) scrolls inside the screen via `previewScrollY` translate
  - Phase 3 (auto-trigger): when `stickyProgress >= 0.74`, `useMotionValueEvent` fires `useAnimation` controls — tablet jets off screen right (0.5s easeIn), "See, I told ya." text reveals (fade + scale + y)
  - Tablet image: `/imgs/tablet-landscape.png` (2481×1748, landscape, no rotation)
  - Screen bounds: `top: 4.6%, left: 6.5%, right: 4.5%, bottom: 5%`
  - Scale: `window.innerWidth * 0.60 * 0.89 / 1024` (math-based, no DOM measurement)
  - `TabletPreview`: purpose-built React component at `src/components/layout/TabletPreview.tsx`, vw-based font sizing, tropical palette (turquoise `#00C4A7`, amber `#F5A623`, green `#3DD68C`, bg `#071C1F`)
  - CRITICAL: sticky section must NOT be inside any `overflow-hidden` ancestor — lives outside the hero `<section>` tag
  - iframe scaling lesson: use `transform: scale` (not CSS `zoom`) to preserve 1024px internal viewport; `getBoundingClientRect()` is unreliable inside 3D-transformed parents — use math instead
- Per-page SEO: react-helmet-async, unique title/description/canonical on every route
- JSON-LD: `LocalBusiness` schema on index.html, `ProfessionalService` on /services
- FAQ accordion on /services (AnimatePresence height animation)
- Portfolio filter: All / Branding / Web App / E-Commerce
- Multi-step form (FormPanel) with validation → submits to `/api/submissions`
- Full admin dashboard: submissions, clients, kanban, proposals, financials, analytics, settings
- GA4 analytics integration (credentials stored in AdminSettings DB)
- PayPal integration (client-filtered transaction sync)
- SMTP email (Office 365, reads from DB first then .env fallback)

## Architecture Patterns
- All sub-components defined at **module level** (not inside parent) — prevents focus loss / remount bugs
- All buttons inside forms use `type="button"` to prevent accidental submission
- Axios errors: always read `e?.response?.data?.error` not just `e.message`
- JWT stored in React context (memory), never localStorage

## SMTP Notes
- Provider: Office 365 (smtp.office365.com:587)
- Requires "Authenticated SMTP" enabled in Microsoft 365 Admin Center for the user
- Config readable from AdminSettings DB via /admin/settings UI
