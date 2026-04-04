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

## OG / Social Preview Image
- Preview image shown when sharing the site link via text/social: `client/public/imgs/og-preview.jpg`
- Referenced in `client/index.html` via `og:image` and `twitter:image` meta tags
- Recommended size: 1200×630px, JPG, under 300KB
- To change: replace the file and update both meta tag URLs in `index.html`

## Sitemap
- Static file at `client/public/sitemap.xml` — copied to `dist/` on every build, served at `https://designsbyta.com/sitemap.xml`
- **When adding a new public page**: add a `<url>` entry to `client/public/sitemap.xml` alongside the new route
- Only include public-facing pages — never `/admin`, `/portal`, `/sign/*`
- After pushing, resubmit in Google Search Console → Sitemaps

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
- `GET /portal/custom-package` — returns enabled AdminCustomPackage for client
- `GET/PUT /portal/questionnaire` — discovery questionnaire (draft + submit)
- `GET /portal/onboarding` — onboarding step status
- `PUT /portal/onboarding/step/:step` — mark step complete
- `GET /portal/package`, `PUT /portal/package/draft` — package selection (draft save)
- `POST /portal/package` — save selection + generate proposal + sign token
- `GET /portal/package/proposal` — proposal for signing
- `POST /portal/checkout` — create invoices (fallback, no Stripe)
- `POST /portal/checkout/session` — create Stripe Checkout Session → returns `{ url }`
- `POST /portal/checkout/confirm` — verify Stripe payment + create invoices + complete step 4

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
- `ClientAuthContext.tsx` — stores session in `sessionStorage` under key `client_session` (not localStorage)
- To force logout during dev: `sessionStorage.removeItem('client_session'); location.reload()` in browser console
- `portalApi.ts` — Axios instance with client Bearer token
- Admin sets client portal password via ClientProfile → "Portal Access" section
- Shows: project progress (kanban %), invoices, proposals, files, messages, questionnaire

## Client Onboarding Funnel (`/portal` — 4 steps)
Steps tracked in `ClientOnboarding` DB table. Funnel auto-resumes at the first incomplete step on login.

### Step 1 — Discovery Questionnaire
- Multi-section form (`Q_SECTIONS`, 13 sections)
- Auto-saves on "Next" navigation + explicit "Save & Continue Later" button
- Current section index persisted in `sessionStorage` (`portal_q_step`) — restored on reload
- Submit calls `PUT /portal/questionnaire` with `{ submit: true }`

### Step 2 — Brand Guide
- 20 slides in `client/src/data/brandGuideSlides.ts` — Obsidian Prestige theme, no emojis
- Slide number rendered as large watermark; gold top rule; fluid headline with `clamp()`
- Free back/forward navigation — dots clickable for any visited slide + next unvisited
- `maxReached` tracks furthest slide seen; gold "Continue →" banner appears once all viewed
- Keyboard arrows supported

### Step 3 — Package Selection
- If admin has enabled a custom package (`AdminCustomPackage.enabled = true`) → shows only that package
- Otherwise: standard tier cards (Starter / Growth / Scale / Build Your Own à la carte)
- À la carte: `base_website` auto-required; `standard_page` opens page builder ($150/page with titles)
- Proposal auto-generated on confirm → client signs with draw or type signature
- **Save & Continue Later**: `PUT /portal/package/draft` saves tier + lineItems without generating proposal
- On reload, saved tier + mode (`custom` vs standard) restored from DB; custom pages restored from `standard_page` line item description

### Step 4 — Checkout
- **Option A**: Pay in Full (with optional upfront discount %)
- **Option B**: Split Payment — standard 30% + 3 monthly, OR custom schedule if admin set one
- Custom schedule stored as JSON in `AdminCustomPackage.paymentTerms`:
  `{ upfrontType: 'percent'|'amount', upfront: number, installments: number, frequency: 'weekly'|'biweekly'|'monthly'|'yearly' }`
- Stripe Checkout redirect → returns to `/portal?payment_success=1&plan=X&sid=Y`
- On return: `OnboardingCompleteScreen` shown → auto-enters dashboard after 4 seconds
- Fallback (no Stripe): `POST /portal/checkout` creates invoices directly
- Invoice creation uses `buildSplitInvoices()` helper in `client-portal.ts` — reads custom schedule from DB

## Admin Custom Package (per-client)
- `ClientProfile` → "Package" tab → two sub-tabs: **Custom Package** (catalog) and **Promo Bundle** (freeform)
- Enabling one auto-disables the other — mutual exclusivity enforced in UI and DB via `bundleType`
- **Custom Package Builder**: select services from ALA_CARTE catalog, edit prices, set discount % or manual total
- **Promo Bundle Builder**: freeform — name the bundle, add unlimited categories + items from scratch; supports expiry date (auto-hides after expiry in portal), copy-from-catalog import, live preview panel
- `standard_page` service opens a page builder (add/delete pages with titles, $X/page) — catalog mode only
- **Custom Payment Schedule**: structured builder (upfront % or $, N installments, frequency) — replaces standard Option B at checkout for this client only
- Stored in `AdminCustomPackage` table (one row per client, upserted via `PUT /admin/clients/:id/custom-package`)
  - `bundleType`: `'catalog'` (ALA_CARTE builder) | `'promo'` (freeform builder)
  - `bundleName`: display name shown in portal Step 3 header (promo only)
  - `bundleExpiresAt`: TIMESTAMPTZ — portal hides bundle after this date; countdown badge if ≤ 7 days away
- Server helpers in `client-portal.ts`: `getCustomSchedule()`, `buildSplitInvoices()`, `FREQ_DAYS`, `FREQ_LABEL`
- Portal `GET /portal/custom-package` filters out expired bundles (`bundleExpiresAt > NOW()`)
- Standard package prices and checkout terms are NEVER overridden unless `AdminCustomPackage.enabled = true`

## Skip Onboarding (per-client)
- `ClientProfile` → "Portal Access" panel → "Skip Onboarding" toggle
- When enabled: client lands directly on the dashboard after login — bypasses all 4 funnel steps
- Stored as `Client.skipOnboarding BOOLEAN` — `PUT /admin/clients/:id/skip-onboarding`
- Portal `GET /portal/me` returns `skipOnboarding`; `OnboardingGate` reads it on mount

## Proposal Builder — Grouped Line Items
- Pricing section has a **"Group by category"** toggle button (top-right of section)
- **Flat mode** (default): standard single-table line items — backward compatible with all existing proposals
- **Grouped mode**: category cards each with editable name, items table, per-category subtotal, delete button; "Add item" per category; "Add category" at bottom
- `category` field stored on each `LineItem` in the JSON — on reload, grouped mode auto-restores from saved data
- `renderLineItemsHtml()` in `tokenRegistry.ts` detects `category` fields and renders `<tr class="line-item-category-header">` + `<tr class="line-item-category-subtotal">` rows for email/PDF templates

## DB Models (runtime tables — created via `runMigrations()` in `server/src/index.ts`)
`Submission`, `Admin`, `Session`, `LoginAttempt`, `Client`, `ClientDocument`, `ProjectScope`,
`KanbanTask`, `ClientStanding`, `PaymentEntry`, `Proposal`, `Invoice`, `AdminSettings`, `Expense`,
`ClientOnboarding`, `PackageSelection`, `DiscoveryQuestionnaire`, `AdminCustomPackage`

- `Admin`: id, username, passwordHash, role, isActive, lastLoginAt
- `Session`: adminId, refreshToken (hashed), ipAddress, userAgent, expiresAt, revokedAt
- `Client`: passwordHash, portalActive, lastLoginAt, upfrontDiscountPct, skipOnboarding for client portal
- `Submission`: has `deletedAt DateTime?` for soft delete / 7-day trash bin
- `AdminSettings`: Stripe creds, GA4 (gaPropertyId, gaCredentials, gaMeasurementId), SMTP config
- `Invoice`: has `stripeInvoiceId`, `stripeInvoiceUrl`, `stripeStatus`
- `AdminCustomPackage`: clientId (unique), enabled, lineItems (JSON), subtotal, discountPct, total, notes, paymentTerms (JSON), bundleName, bundleType ('catalog'|'promo'), bundleExpiresAt
- `PackageSelection`: clientId (unique), tier, lineItems (JSON), subtotal, total, notes, proposalId
- `ClientOnboarding`: clientId (unique), step1–step4 booleans, completedAt
- `DiscoveryQuestionnaire`: clientId (unique), section1–section13 (JSON), status, submittedAt

## Architecture Rules
- Sub-components at **module level** (not inside parent) — prevents remount/focus bugs
- Buttons in forms: always `type="button"`
- Axios errors: read `e?.response?.data?.error`
- SMTP: Resend (smtp.resend.com:2587) — Railway blocks port 587. From address must include email e.g. `Name <email@domain.com>`
- ESM module (`"type": "module"` in server/package.json) — never use `require()`, always top-level `import`
- CORS: manual middleware in `server/src/index.ts` — do NOT use the cors npm package
- `app.set('trust proxy', 1)` required for Railway reverse proxy (rate limiter)
- Admin refresh token stored in localStorage (`admin_refresh_token`, `admin_username`) for session persistence across page refresh — restored via `/auth/refresh` on mount in AuthContext
- New DB tables: always add `CREATE TABLE IF NOT EXISTS` to `runMigrations()` in `server/src/index.ts` — Railway cannot run `prisma db push` (pgbouncer blocks DDL)

## Stripe Integration
- Settings → Stripe: enter Secret Key + Webhook Secret
- Client portal checkout: creates Stripe Checkout Session → redirects client → returns to `/portal?payment_success=1`
- `getStripeSettings()` / `getStripeClient()` in `server/src/lib/stripe.ts`
- If Stripe not configured, portal checkout falls back to creating invoices directly (no payment link)
- Invoices page: "Send via Stripe" creates Stripe invoice + emails client
