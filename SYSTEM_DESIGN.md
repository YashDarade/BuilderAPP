# BuildTrack — System Design Document

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser / PWA)                        │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Next.js 16  │  │   Zustand    │  │  IndexedDB   │  │  Service   │  │
│  │  React App   │  │    Store     │  │   (Offline)  │  │  Worker    │  │
│  │  (Turbopack) │  │  (State Mgmt)│  │              │  │  (Caching) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                 │                 │          │
│         └────────┬────────┴────────┬────────┘                 │          │
│                  │                 │                          │          │
│            ┌─────▼─────┐   ┌──────▼──────┐            ┌──────▼──────┐  │
│            │  Recharts  │   │   shadcn    │            │   Cache     │  │
│            │  (Charts)  │   │     /ui     │            │   Layer     │  │
│            └───────────┘   └─────────────┘            └─────────────┘  │
│                                                                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                        HTTPS / REST
                               │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                         SERVER (Next.js API)                            │
│                                                                         │
│  ┌──────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │
│  │  Next.js Proxy    │  │  API Routes       │  │  Middleware          │  │
│  │  (proxy.ts)       │  │  /api/team/add    │  │  (Auth, Cookies)    │  │
│  │                   │  │  /api/auth/signout│  │                     │  │
│  └────────┬──────────┘  └────────┬──────────┘  └──────────┬──────────┘  │
│           │                      │                        │             │
│           └──────────────┬───────┘────────────────────────┘             │
│                          │                                              │
│                ┌─────────▼──────────┐                                   │
│                │  Supabase Client   │                                   │
│                │  (anon key / RPC)  │                                   │
│                └─────────┬──────────┘                                   │
│                          │                                              │
└──────────────────────────┼──────────────────────────────────────────────┘
                           │
                    HTTPS / REST + WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────────────────┐
│                      SUPABASE (Backend-as-a-Service)                     │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐    │
│  │  Auth Service   │  │  PostgreSQL    │  │  Storage               │    │
│  │                 │  │  Database      │  │                        │    │
│  │  • Email/Pass   │  │                │  │  Buckets:              │    │
│  │  • Sessions     │  │  • 14 tables   │  │  • site-photos (10MB)  │    │
│  │  • JWT tokens   │  │  • 30+ indexes │  │  • bill-scans (10MB)   │    │
│  │  • RLS policies │  │  • 10 enums    │  │  • Public read access  │    │
│  │                 │  │  • 30+ SECDEF  │  │                        │    │
│  │                 │  │    functions   │  │                        │    │
│  └────────────────┘  └────────────────┘  └────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Edge Functions (Optional)                     │   │
│  │                    OpenAI API Integration                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECHNOLOGY STACK                          │
├─────────────────┬───────────────────────────────────────────────┤
│  FRONTEND       │  Next.js 16 (Turbopack), React 19, TypeScript │
│  UI LIBRARY     │  shadcn/ui (@base-ui/react v4), Tailwind CSS │
│  CHARTS         │  Recharts v3.8                               │
│  STATE          │  Zustand (global store)                       │
│  FORMS          │  React Hook Form + Zod validation             │
│  PWA            │  @ducanh2912/next-pwa + manual sw.js          │
│  OFFLINE DB     │  IndexedDB (via idb library)                  │
│  ICONS          │  Lucide React + custom PNG icons              │
├─────────────────┼───────────────────────────────────────────────┤
│  BACKEND        │  Next.js API Routes (server-side)             │
│  DATABASE       │  Supabase (PostgreSQL 15)                     │
│  AUTH           │  Supabase Auth (email/password, JWT)          │
│  STORAGE        │  Supabase Storage (file uploads)              │
│  SECURITY       │  SECURITY DEFINER functions, RLS policies     │
├─────────────────┼───────────────────────────────────────────────┤
│  DEPLOYMENT     │  Vercel / Node.js server                      │
│  CI/CD          │  GitHub Actions (optional)                    │
│  TESTING        │  Playwright (E2E), 39 tests                   │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## 3. Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION STRUCTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  src/                                                           │
│  ├── app/                                                       │
│  │   ├── (auth)/                  # Auth pages (no sidebar)     │
│  │   │   ├── sign-in/             # Login page                  │
│  │   │   ├── sign-up/             # Registration page           │
│  │   │   └── forgot-password/     # Password reset              │
│  │   │                                                         │
│  │   ├── (dashboard)/             # Dashboard pages (sidebar)   │
│  │   │   ├── dashboard/           # Main dashboard              │
│  │   │   ├── projects/            # Project management          │
│  │   │   ├── projects/[id]/       # Project detail              │
│  │   │   ├── budget/              # Budget tracking             │
│  │   │   ├── expenses/            # Expense management          │
│  │   │   ├── materials/           # Material inventory          │
│  │   │   ├── photos/              # Site photos                 │
│  │   │   ├── reports/             # Progress reports            │
│  │   │   ├── roadmap/             # Project roadmaps            │
│  │   │   ├── team/                # Team management (owner)     │
│  │   │   ├── client-portal/       # Client view                 │
│  │   │   ├── ai-tools/            # AI features                 │
│  │   │   ├── notifications/       # Notifications               │
│  │   │   ├── activity/            # Activity logs               │
│  │   │   └── profile/             # User profile                │
│  │   │                                                         │
│  │   ├── api/                     # Server-side API routes      │
│  │   │   ├── team/add/            # Add team members            │
│  │   │   └── auth/signout/        # Server-side sign out        │
│  │   │                                                         │
│  │   ├── layout.tsx               # Root layout                 │
│  │   ├── page.tsx                 # Landing page                │
│  │   └── globals.css              # Global styles + theme       │
│  │                                                         │
│  ├── components/                    # Reusable components        │
│  │   ├── auth/                      # Auth components            │
│  │   │   ├── auth-guard.tsx         # Session protection         │
│  │   │   └── auth-provider.tsx      # Auth context               │
│  │   ├── layout/                    # Layout components          │
│  │   │   ├── sidebar.tsx            # Navigation sidebar         │
│  │   │   └── header.tsx             # Top header bar             │
│  │   ├── ui/                        # shadcn/ui primitives       │
│  │   ├── role-guard.tsx             # Role-based page access     │
│  │   ├── project-selector.tsx       # Project dropdown           │
│  │   ├── offline-banner.tsx         # Offline indicator          │
│  │   ├── error-state.tsx            # Error display              │
│  │   ├── empty-state.tsx            # Empty state display        │
│  │   └── page-skeletons.tsx         # Loading skeletons          │
│  │                                                         │
│  ├── lib/                         # Utilities & configurations  │
│  │   ├── hooks/                     # Custom React hooks         │
│  │   │   └── use-data.ts            # All data fetching hooks    │
│  │   ├── supabase/                  # Supabase configuration     │
│  │   │   ├── config.ts              # Browser client singleton   │
│  │   │   ├── server.ts              # Server client              │
│  │   │   └── auth.ts                # Auth helpers               │
│  │   ├── offline/                   # Offline support            │
│  │   │   ├── db.ts                  # IndexedDB setup            │
│  │   │   └── cache.ts               # Cache layer                │
│  │   ├── store/                     # Zustand state              │
│  │   │   └── index.ts               # Global store               │
│  │   ├── types/                     # TypeScript types           │
│  │   │   └── index.ts               # All interfaces             │
│  │   ├── validation-schemas.ts      # Zod schemas                │
│  │   ├── chart-theme.ts             # Chart styling constants    │
│  │   ├── mock-data.ts               # Demo seed data             │
│  │   └── utils.ts                   # Utility functions          │
│  │                                                         │
│  ├── proxy.ts                     # Next.js proxy (middleware)  │
│  └── providers.tsx                # Root providers (PWA, etc.)  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  supabase/                                                      │
│  └── migrations/                    # 25 SQL migration files     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  public/                                                        │
│  ├── icon-192.png, icon-512.png     # PWA icons                 │
│  ├── manifest.json                  # PWA manifest              │
│  └── sw.js                          # Service worker            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  e2e/                           # Playwright E2E tests (39)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐         ┌──────────┐         ┌──────────────┐    │
│  │  User     │         │  Next.js │         │  Supabase    │    │
│  │  Browser  │         │  Server  │         │  Auth        │    │
│  └────┬─────┘         └────┬─────┘         └──────┬───────┘    │
│       │                    │                      │             │
│       │  1. POST /sign-in  │                      │             │
│       │  (email, password) │                      │             │
│       │───────────────────►│                      │             │
│       │                    │  2. signInWithPassword              │
│       │                    │─────────────────────►│             │
│       │                    │                      │             │
│       │                    │  3. JWT + Session     │             │
│       │                    │◄─────────────────────│             │
│       │                    │                      │             │
│       │                    │  4. GET /users?auth_id=             │
│       │                    │     (get_user_profile RPC)         │
│       │                    │─────────────────────►│             │
│       │                    │                      │             │
│       │                    │  5. User profile + org_id           │
│       │                    │◄─────────────────────│             │
│       │                    │                      │             │
│       │  6. Set HttpOnly cookies:               │             │
│       │     - bt_session (JWT)                   │             │
│       │     - bt_user (profile JSON)             │             │
│       │     - bt_org (org_id)                    │             │
│       │     - bt_role (role)                     │             │
│       │◄───────────────────│                      │             │
│       │                    │                      │             │
│       │  7. Redirect to /dashboard               │             │
│       │◄───────────────────│                      │             │
│       │                    │                      │             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  REMEMBER ME LOGIC (proxy.ts)                           │    │
│  │                                                         │    │
│  │  • bt_no_persist=1 → cookies expire on browser close   │    │
│  │  • bt_no_persist=0 → cookies persist (30 days)         │    │
│  │  • Proxy strips maxAge when bt_no_persist=1            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  AUTHORIZATION (RBAC)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ROLES:                                                         │
│  ┌─────────────┬─────────────────────────────────────────────┐  │
│  │  owner       │  Full access. Manages org, team, projects. │  │
│  │  (Builder)   │  Can add/remove team members.              │  │
│  ├─────────────┼─────────────────────────────────────────────┤  │
│  │  site_engineer│  Manages assigned projects. Creates       │  │
│  │  (Engineer)  │  reports, uploads photos, tracks materials.│  │
│  ├─────────────┼─────────────────────────────────────────────┤  │
│  │  client      │  Read-only view of assigned projects.      │  │
│  │  (Client)    │  Views budget, progress, reports.          │  │
│  └─────────────┴─────────────────────────────────────────────┘  │
│                                                                 │
│  PAGE ACCESS:                                                   │
│  ┌──────────────────┬──────────┬───────────────┬─────────────┐  │
│  │  Page             │  Owner   │  Site Engineer │  Client     │  │
│  ├──────────────────┼──────────┼───────────────┼─────────────┤  │
│  │  Dashboard        │  ✅      │  ✅ (own)     │  ✅ (own)   │  │
│  │  Projects         │  ✅      │  ✅ (assigned)│  ✅ (view)  │  │
│  │  Budget           │  ✅      │  ❌           │  ❌         │  │
│  │  Expenses         │  ✅      │  ✅ (create)  │  ✅ (view)  │  │
│  │  Materials        │  ✅      │  ✅ (create)  │  ✅ (view)  │  │
│  │  Photos           │  ✅      │  ✅ (upload)  │  ✅ (view)  │  │
│  │  Reports          │  ✅      │  ✅ (create)  │  ✅ (view)  │  │
│  │  Roadmap          │  ✅      │  ✅           │  ✅ (view)  │  │
│  │  Team             │  ✅      │  ❌           │  ❌         │  │
│  │  Client Portal    │  ❌      │  ❌           │  ✅         │  │
│  │  AI Tools         │  ✅      │  ✅           │  ❌         │  │
│  │  Notifications    │  ✅      │  ✅           │  ✅         │  │
│  │  Activity         │  ✅      │  ❌           │  ❌         │  │
│  │  Profile          │  ✅      │  ✅           │  ✅         │  │
│  └──────────────────┴──────────┴───────────────┴─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE ENTITY RELATIONSHIP                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐                                           │
│  │  auth.users       │  ← Supabase Auth (managed)               │
│  │  (id, email)      │                                          │
│  └────────┬─────────┘                                           │
│           │ auth.uid()                                          │
│           ▼                                                     │
│  ┌──────────────────┐       ┌──────────────────┐               │
│  │  organizations    │◄──────│  users            │               │
│  │                   │       │                   │               │
│  │  id (PK)          │       │  id (PK)          │               │
│  │  name             │◄──────│  org_id (FK)      │               │
│  │  owner_id (FK)    │       │  auth_id (FK→auth)│               │
│  │  plan             │       │  email            │               │
│  │  logo_url         │       │  full_name        │               │
│  └────────┬─────────┘       │  role (enum)      │               │
│           │                  │  phone            │               │
│           │                  │  avatar_url       │               │
│           │                  └──────────────────┘               │
│           │                                                     │
│           │  org_id (FK) on ALL tables                          │
│           │                                                     │
│  ┌────────▼─────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  ┌──────────────────┐     ┌──────────────────┐           │   │
│  │  │  projects         │────►│  site_photos      │           │   │
│  │  │                   │     │                   │           │   │
│  │  │  id (PK)          │     │  id (PK)          │           │   │
│  │  │  org_id (FK)      │     │  project_id (FK)  │           │   │
│  │  │  name             │     │  org_id (FK)      │           │   │
│  │  │  client_name      │     │  url              │           │   │
│  │  │  client_id (FK)   │     │  category (enum)  │           │   │
│  │  │  engineer_id (FK) │     │  uploaded_by (FK) │           │   │
│  │  │  budget           │     │  gps_lat, gps_lng │           │   │
│  │  │  spent            │     └──────────────────┘           │   │
│  │  │  status (enum)    │                                    │   │
│  │  │  progress (0-100) │     ┌──────────────────┐           │   │
│  │  └────────┬─────────┘     │  materials        │           │   │
│  │           │                │                   │           │   │
│  │           │                │  id (PK)          │           │   │
│  │           ├───────────────►│  project_id (FK)  │           │   │
│  │           │                │  org_id (FK)      │           │   │
│  │           │                │  name             │           │   │
│  │           │                │  category (enum)  │           │   │
│  │           │                │  qty_purchased    │           │   │
│  │           │                │  qty_used         │           │   │
│  │           │                │  qty_remaining    │◄─ GENERATED│   │
│  │           │                │  cost_per_unit    │           │   │
│  │           │                │  total_cost       │◄─ GENERATED│   │
│  │           │                │  reorder_level    │           │   │
│  │           │                └──────────────────┘           │   │
│  │           │                                               │   │
│  │           ├───────────────►┌──────────────────┐           │   │
│  │           │                │  expenses         │           │   │
│  │           │                │                   │           │   │
│  │           │                │  id (PK)          │           │   │
│  │           │                │  project_id (FK)  │           │   │
│  │           │                │  org_id (FK)      │           │   │
│  │           │                │  amount           │           │   │
│  │           │                │  category (enum)  │           │   │
│  │           │                │  vendor           │           │   │
│  │           │                │  date             │           │   │
│  │           │                │  bill_url         │           │   │
│  │           │                └──────────────────┘           │   │
│  │           │                                               │   │
│  │           ├───────────────►┌──────────────────┐           │   │
│  │           │                │  progress_reports  │           │   │
│  │           │                │                   │           │   │
│  │           │                │  id (PK)          │           │   │
│  │           │                │  project_id (FK)  │           │   │
│  │           │                │  org_id (FK)      │           │   │
│  │           │                │  work_completed   │           │   │
│  │           │                │  material_used    │           │   │
│  │           │                │  issues, delays   │           │   │
│  │           │                │  tomorrow_plan    │           │   │
│  │           │                │  photos[]         │           │   │
│  │           │                └──────────────────┘           │   │
│  │           │                                               │   │
│  │           ├───────────────►┌──────────────────┐           │   │
│  │           │                │  budget_alerts     │           │   │
│  │           │                │                   │           │   │
│  │           │                │  id (PK)          │           │   │
│  │           │                │  project_id (FK)  │           │   │
│  │           │                │  org_id (FK)      │           │   │
│  │           │                │  alert_type (enum)│           │   │
│  │           │                │  threshold_pct    │           │   │
│  │           │                │  message          │           │   │
│  │           │                └──────────────────┘           │   │
│  │           │                                               │   │
│  │           ├───────────────►┌──────────────────┐           │   │
│  │           │                │  ai_insights       │           │   │
│  │           │                │                   │           │   │
│  │           │                │  id (PK)          │           │   │
│  │           │                │  project_id (FK)  │           │   │
│  │           │                │  org_id (FK)      │           │   │
│  │           │                │  insight_type     │           │   │
│  │           │                │  title, desc      │           │   │
│  │           │                │  severity (enum)  │           │   │
│  │           │                │  recommendations[]│           │   │
│  │           │                └──────────────────┘           │   │
│  │           │                                               │   │
│  │           └───────────────►┌──────────────────┐           │   │
│  │                            │  roadmaps          │           │   │
│  │                            │                   │           │   │
│  │                            │  id (PK)          │           │   │
│  │                            │  project_id (FK)  │           │   │
│  │                            │  org_id (FK)      │           │   │
│  │                            │  title            │           │   │
│  │                            │  phases (JSONB)   │           │   │
│  │                            └──────────────────┘           │   │
│  │                                                           │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────┐     ┌──────────────────┐                  │
│  │  notifications    │     │  activity_logs    │                  │
│  │                   │     │                   │                  │
│  │  id (PK)          │     │  id (PK)          │                  │
│  │  user_id (FK)     │     │  org_id (FK)      │                  │
│  │  org_id (FK)      │     │  user_id (FK)     │                  │
│  │  title, message   │     │  action           │                  │
│  │  type (enum)      │     │  entity_type      │                  │
│  │  is_read          │     │  entity_id        │                  │
│  └──────────────────┘     │  entity_name      │                  │
│                            │  details (JSONB)  │                  │
│  ┌──────────────────┐     └──────────────────┘                  │
│  │  bill_scans       │                                          │
│  │                   │     ┌──────────────────┐                  │
│  │  id (PK)          │     │material_detections│                  │
│  │  expense_id (FK)  │     │                   │                  │
│  │  org_id (FK)      │     │  id (PK)          │                  │
│  │  image_url        │     │  photo_id (FK)    │                  │
│  │  vendor_name      │     │  object_type      │                  │
│  │  amount           │     │  count            │                  │
│  │  gst_number       │     │  confidence_score │                  │
│  │  confidence_score │     └──────────────────┘                  │
│  │  status (enum)    │                                          │
│  └──────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: Next.js Proxy (proxy.ts)                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Strips maxAge from cookies when bt_no_persist=1      │    │
│  │  • Excludes /manifest.json, /sw.js from auth            │    │
│  │  • Redirects unauthenticated users to /sign-in          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  LAYER 2: Client-Side Auth Guard                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Reads bt_session, bt_user, bt_org, bt_role cookies   │    │
│  │  • Validates session on every page load                 │    │
│  │  • Redirects to /sign-in if invalid                     │    │
│  │  • Populates Zustand store with user data               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  LAYER 3: Role-Based Page Access (role-guard.tsx)               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Checks user.role against allowedRoles per page       │    │
│  │  • Owner: full access                                   │    │
│  │  • Site Engineer: limited to assigned projects          │    │
│  │  • Client: read-only view                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  LAYER 4: Supabase Row Level Security (RLS)                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • Enabled on ALL 14 tables                             │    │
│  │  • Policies enforce org_id isolation                    │    │
│  │  • Role-based: owner=all, engineer=manage, client=view  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  LAYER 5: SECURITY DEFINER Functions (Bypass RLS)              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • 30+ PostgreSQL functions execute as postgres         │    │
│  │  • Validate caller's org_id via auth.uid()              │    │
│  │  • NEVER trust client-supplied org_id                   │    │
│  │  • All access goes through supabase.rpc()               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  LAYER 6: Storage RLS                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  • site-photos bucket: org-scoped folder paths          │    │
│  │  • bill-scans bucket: org-scoped folder paths           │    │
│  │  • 10MB file size limit                                 │    │
│  │  • MIME type restrictions (JPEG, PNG, WebP, HEIC)       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              SECURITY DEFINER FUNCTION PATTERN                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Example: get_all_projects(p_org_id UUID)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  CREATE OR REPLACE FUNCTION get_all_projects(...)        │    │
│  │  RETURNS SETOF projects                                  │    │
│  │  LANGUAGE sql SECURITY DEFINER STABLE                    │    │
│  │  AS $$                                                   │    │
│  │    SELECT * FROM projects                                │    │
│  │    WHERE org_id = get_current_user_org_id()  -- ← KEY   │    │
│  │  $$;                                                     │    │
│  │                                                          │    │
│  │  • SECURITY DEFINER: runs as postgres (owner)           │    │
│  │  • Bypasses RLS entirely                                 │    │
│  │  • Validates org_id from auth token (not client)        │    │
│  │  • p_org_id parameter is IGNORED for security           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Client calls:                                                 │
│    supabase.rpc('get_all_projects', { p_org_id: '...' })       │
│                                                                 │
│  The function ignores p_org_id and uses:                        │
│    get_current_user_org_id() → auth.uid() → users.auth_id      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW (Online Mode)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  React   │    │  Zustand │    │  Supabase│    │PostgreSQL│ │
│  │  Component│───►│  Store   │───►│  Client  │───►│  Database│ │
│  │          │    │          │    │  (.rpc())│    │          │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│       │                              │                │        │
│       │  1. useProjects()            │                │        │
│       │──────►                       │                │        │
│       │         2. Check cache       │                │        │
│       │         3. If miss → RPC     │                │        │
│       │─────────────────────────────►│                │        │
│       │                              │  4. SQL query  │        │
│       │                              │───────────────►│        │
│       │                              │                │        │
│       │                              │  5. Result set │        │
│       │                              │◄───────────────│        │
│       │  6. Update store + cache     │                │        │
│       │◄─────────────────────────────│                │        │
│       │                              │                │        │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  CACHE LAYER (IndexedDB)                            │        │
│  │                                                     │        │
│  │  • 9 stores: projects, expenses, materials, etc.   │        │
│  │  • TTL-based expiry (5 min default)                 │        │
│  │  • Read-through: check cache first, then network   │        │
│  │  • Write-through: update cache on mutations         │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                  DATA FLOW (Offline Mode)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │  React   │    │  Zustand │    │ IndexedDB│                  │
│  │  Component│───►│  Store   │───►│ (Cache)  │                  │
│  │          │    │          │    │          │                  │
│  └──────────┘    └──────────┘    └──────────┘                  │
│       │                              │                          │
│       │  1. useProjects()            │                          │
│       │──────►                       │                          │
│       │         2. Check cache       │                          │
│       │─────────────────────────────►│                          │
│       │                              │                          │
│       │         3. Return cached     │                          │
│       │◄─────────────────────────────│                          │
│       │                              │                          │
│       │  4. Show Offline Banner      │                          │
│       │──────► (offline-banner.tsx)  │                          │
│       │                              │                          │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  SERVICE WORKER (sw.js)                             │        │
│  │                                                     │        │
│  │  • Caches static assets (HTML, CSS, JS, icons)     │        │
│  │  • Network-first for API calls                     │        │
│  │  • Cache-first for static assets                    │        │
│  │  • Offline fallback page                           │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    MUTATION FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  Form    │    │  Hook    │    │  Supabase│    │PostgreSQL│ │
│  │  Submit  │───►│  mutate()│───►│  .rpc()  │───►│  SECDEF  │ │
│  │          │    │          │    │          │    │ Function │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│       │                              │                │        │
│       │  1. onSubmit(data)           │                │        │
│       │──────►                       │                │        │
│       │         2. Zod validate      │                │        │
│       │         3. RPC call          │                │        │
│       │─────────────────────────────►│                │        │
│       │                              │  4. Validate   │        │
│       │                              │     org_id     │        │
│       │                              │───────────────►│        │
│       │                              │                │        │
│       │                              │  5. INSERT     │        │
│       │                              │───────────────►│        │
│       │                              │                │        │
│       │                              │  6. Return row │        │
│       │                              │◄───────────────│        │
│       │  7. Update cache + UI        │                │        │
│       │◄─────────────────────────────│                │        │
│       │                              │                │        │
│       │  8. Trigger budget alerts    │                │        │
│       │     (PostgreSQL trigger)     │                │        │
│       │                              │  9. AFTER INSERT        │
│       │                              │     check_budget_alerts()│
│       │                              │───────────────►│        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Multi-Tenancy Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Supabase Auth (auth.users)                          │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │  id: uuid (PK)                                 │  │      │
│  │  │  email: text                                   │  │      │
│  │  │  encrypted_password: text                      │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  └──────────────────────────┬───────────────────────────┘      │
│                             │                                   │
│                    auth.uid() │                                   │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Public Users (users)                                │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │  id: uuid (PK)                                 │  │      │
│  │  │  auth_id: uuid (FK → auth.users)               │  │      │
│  │  │  org_id: uuid (FK → organizations)             │  │      │
│  │  │  role: user_role enum                           │  │      │
│  │  │  email, full_name, phone, avatar_url           │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  └──────────────────────────┬───────────────────────────┘      │
│                             │                                   │
│                    org_id │                                       │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Organizations                                       │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │  id: uuid (PK)                                 │  │      │
│  │  │  name: text                                    │  │      │
│  │  │  owner_id: uuid (FK → auth.users)              │  │      │
│  │  │  plan: text (free/pro/enterprise)              │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  └──────────────────────────┬───────────────────────────┘      │
│                             │                                   │
│                    org_id (ON DELETE CASCADE)                    │
│                             ▼                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  ALL DATA TABLES                                     │      │
│  │                                                      │      │
│  │  projects ──► site_photos                            │      │
│  │          ──► materials                               │      │
│  │          ──► expenses ──► bill_scans                 │      │
│  │          ──► progress_reports                        │      │
│  │          ──► budget_alerts                           │      │
│  │          ──► ai_insights                             │      │
│  │          ──► roadmaps                                │      │
│  │                                                      │      │
│  │  notifications (user_id FK)                          │      │
│  │  activity_logs (org_id FK)                           │      │
│  │                                                      │      │
│  │  Every table has: org_id UUID NOT NULL               │      │
│  │  ON DELETE CASCADE → org deletion removes all data   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  DATA ISOLATION:                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  User A (org_1) ──► can ONLY see org_1 data         │      │
│  │  User B (org_2) ──► can ONLY see org_2 data         │      │
│  │  User C (no org) ──► sees nothing                    │      │
│  │                                                      │      │
│  │  Enforced by:                                        │      │
│  │  1. SECURITY DEFINER functions validate auth.uid()   │      │
│  │  2. RLS policies check org_id = user's org_id       │      │
│  │  3. Client never sends org_id (server derives it)   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. PWA & Offline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PWA ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  manifest.json                                        │      │
│  │  • name: "BuildTrack"                                │      │
│  │  • short_name: "BuildTrack"                          │      │
│  │  • display: standalone                                │      │
│  │  • theme_color: #f97316 (orange)                     │      │
│  │  • icons: icon-192.png, icon-512.png                 │      │
│  │  • start_url: /dashboard                             │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Service Worker (public/sw.js)                        │      │
│  │                                                      │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │  CACHE STRATEGY:                               │  │      │
│  │  │                                                │  │      │
│  │  │  Static Assets (HTML, CSS, JS, icons):         │  │      │
│  │  │    → Cache-First (offline fallback)            │  │      │
│  │  │                                                │  │      │
│  │  │  API Calls (Supabase):                         │  │      │
│  │  │    → Network-First (offline → cache fallback)  │  │      │
│  │  │                                                │  │      │
│  │  │  Images (uploaded photos):                      │  │      │
│  │  │    → Cache-First with network update           │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  │                                                      │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │  CACHE STORES (IndexedDB via idb):             │  │      │
│  │  │                                                │  │      │
│  │  │  1. projects        6. bill_scans              │  │      │
│  │  │  2. expenses        7. roadmaps                │  │      │
│  │  │  3. materials       8. notifications           │  │      │
│  │  │  4. site_photos     9. activity_logs           │  │      │
│  │  │  5. progress_reports                           │  │      │
│  │  │                                                │  │      │
│  │  │  Each store:                                    │  │      │
│  │  │  • Key: entity ID (UUID)                       │  │      │
│  │  │  • Value: { data, timestamp, org_id }          │  │      │
│  │  │  • TTL: 5 minutes (configurable)               │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  OFFLINE BANNER (offline-banner.tsx)                  │      │
│  │                                                      │      │
│  │  • Detects navigator.onLine status                   │      │
│  │  • Shows orange banner: "You're offline"             │      │
│  │  • Data served from IndexedDB cache                  │      │
│  │  • Mutations queued for sync when online             │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZUSTAND STORE SHAPE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  useStore = {                                                   │
│    // Auth State                                                │
│    currentUser: {                                               │
│      id: string                                                 │
│      email: string                                              │
│      full_name: string                                          │
│      role: 'owner' | 'site_engineer' | 'client'                │
│      org_id: string                                             │
│      avatar_url: string                                         │
│      phone: string                                              │
│    } | null                                                     │
│                                                                 │
│    // Project Selection                                         │
│    selectedProjectId: string | null                             │
│    setSelectedProjectId: (id: string | null) => void            │
│                                                                 │
│    // UI State                                                  │
│    sidebarOpen: boolean                                         │
│    toggleSidebar: () => void                                    │
│                                                                 │
│    // Theme                                                     │
│    theme: 'light' | 'dark' | 'system'                          │
│    setTheme: (theme: 'light' | 'dark' | 'system') => void      │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. API Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTES                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SERVER-SIDE (Next.js API Routes):                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  POST /api/team/add                                     │    │
│  │  • Creates new team member via Supabase Auth + RPC      │    │
│  │  • Validates owner role                                 │    │
│  │  • Uses insert_team_member() SECURITY DEFINER function  │    │
│  │                                                         │    │
│  │  POST /api/auth/signout                                 │    │
│  │  • Clears all HttpOnly cookies                          │    │
│  │  • Server-side session destruction                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  CLIENT-SIDE (Supabase RPC via use-data.ts):                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  READ OPERATIONS:                                       │    │
│  │    rpc('get_user_profile')     → users                  │    │
│  │    rpc('get_all_projects')     → projects[]             │    │
│  │    rpc('get_project')          → projects               │    │
│  │    rpc('get_all_expenses')     → expenses[]             │    │
│  │    rpc('get_all_materials')    → materials[]            │    │
│  │    rpc('get_project_photos')   → site_photos[]          │    │
│  │    rpc('get_project_progress') → progress_reports[]     │    │
│  │    rpc('get_notifications')    → notifications[]        │    │
│  │    rpc('get_all_budget_alerts')→ budget_alerts[]        │    │
│  │    rpc('get_all_roadmaps')     → roadmaps[]             │    │
│  │    rpc('get_activity_logs')    → activity_logs[]        │    │
│  │    rpc('get_expenses_for_chart')→ {amount, date}[]      │    │
│  │                                                         │    │
│  │  WRITE OPERATIONS:                                      │    │
│  │    rpc('insert_project')       → projects               │    │
│  │    rpc('update_project')       → projects               │    │
│  │    rpc('delete_project')       → void                   │    │
│  │    rpc('insert_expense')       → expenses               │    │
│  │    rpc('update_expense')       → expenses               │    │
│  │    rpc('delete_expense')       → void                   │    │
│  │    rpc('insert_material')      → materials              │    │
│  │    rpc('update_material')      → materials              │    │
│  │    rpc('delete_material')      → void                   │    │
│  │    rpc('insert_photo')         → site_photos            │    │
│  │    rpc('delete_photo')         → void                   │    │
│  │    rpc('insert_report')        → progress_reports       │    │
│  │    rpc('insert_roadmap')       → roadmaps               │    │
│  │    rpc('update_roadmap')       → roadmaps               │    │
│  │    rpc('delete_roadmap')       → void                   │    │
│  │    rpc('insert_activity_log')  → activity_logs          │    │
│  │    rpc('mark_notification_read')→ void                  │    │
│  │    rpc('mark_all_notifications_read')→ void             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │  Vercel / Node   │      │  Supabase Cloud  │                │
│  │  (Next.js App)   │◄────►│  (Managed BaaS)  │                │
│  │                  │      │                  │                │
│  │  • Static assets │      │  • PostgreSQL 15 │                │
│  │  • API routes    │      │  • Auth service  │                │
│  │  • SSR pages     │      │  • File storage  │                │
│  │  • Proxy (edge)  │      │  • Edge functions│                │
│  └──────────────────┘      └──────────────────┘                │
│           │                        │                            │
│           │                        │                            │
│  ┌────────▼──────────┐      ┌──────▼──────────┐                │
│  │  CDN (Vercel)     │      │  Supabase CDN   │                │
│  │  • Global edge    │      │  • File serving  │                │
│  │  • Static cache   │      │  • Image trans.  │                │
│  └───────────────────┘      └─────────────────┘                │
│                                                                 │
│  ENVIRONMENT VARIABLES:                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co      │    │
│  │  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...                   │    │
│  │  SUPABASE_SERVICE_ROLE_KEY=eyJ... (optional)            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Key Design Decisions

| Decision | Rationale |
|---|---|
| **SECURITY DEFINER over RLS** | Supabase has a PostgreSQL bug where `SET ROLE authenticated` fails with `42501`. SECURITY DEFINER functions bypass this entirely. |
| **org_id validated server-side** | Client never sends org_id for reads. Functions derive it from `auth.uid()` to prevent cross-tenant data leaks. |
| **HttpOnly cookies for auth** | Prevents XSS attacks from stealing session tokens. Cookies are not accessible via JavaScript. |
| **Zustand over Context** | Simpler API, no provider nesting, built-in persistence, better TypeScript support. |
| **Recharts over Chart.js** | Better React integration, declarative API, TypeScript-first. |
| **Manual service worker** | `@ducanh2912/next-pwa` generates the base, but `public/sw.js` is maintained manually for full control over caching strategies. |
| **IndexedDB over localStorage** | Structured data storage, larger capacity, async API, better offline support. |
| **INR currency formatting** | All monetary values use Indian Rupee formatting with Lakhs/Crores notation. |

---

## 14. Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Owner (Builder) | `admin@buildtrack.com` | `DEMO1234` | Full access to all features |
| Site Engineer | `site@buildtrack.com` | `DEMO1234` | Assigned projects only |
| Client | `client@buildtrack.com` | `DEMO1234` | Read-only project view |

Demo Organization ID: `00000000-0000-0000-0000-000000000001`

---

*Document generated for BuildTrack v0.1.0 — Construction Management SaaS*
