# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run start    # Start production server
```

No test suite is configured.

## Architecture Overview

**The School of Encounter** is an online spiritual/Bible-based learning platform built with Next.js 15 App Router.

### Tech Stack
- **Next.js 15** with App Router and React 19
- **Sanity** — primary CMS and database (content at `/studio`, schemas in `sanity/schemas/`)
- **Firebase** — authentication only (Google + email/password)
- **Stripe** — one-time course payments
- **Resend** — email notifications
- **Tailwind CSS** + **Shadcn UI** (`src/components/ui/`) for styling

### User Roles
Three roles defined in Sanity `userProfile`: `student`, `teacher`, `admin`. Role is fetched from Sanity after Firebase auth and stored in `AuthContext`.

### Authentication Flow
1. Firebase handles auth (Google Sign-In or email/password)
2. `AuthContext` (`src/contexts/AuthContext.tsx`) fetches the user's role from Sanity `userProfile` by matching `firebaseUID`
3. Middleware (`src/middleware.ts`) checks for a user cookie to protect `/dashboard/*` and `/teacher-dashboard/*`; redirects auth pages if already logged in

### Routing Structure
- `/` — public homepage
- `/courses` — public course listing
- `/courses/[courseId]` — public course detail
- `/courses/[courseId]/manage` — instructor course management (student list, email students)
- `/learn/[courseId]` — course player (client-side auth-gated; enrollment checked at runtime)
- `/auth/*` — login, signup, forgot-password
- `/dashboard` — student dashboard (middleware-protected)
- `/teacher-dashboard` — instructor dashboard (middleware-protected)
- `/admin/*` — admin pages (role-checked client-side only, not middleware)
- `/calendar` — public calendar
- `/teacher-dashboard/calendar` — teacher Q&A calendar
- `/admin/calendar`, `/admin/courses`, `/admin/users` — admin sub-pages
- `/studio/[[...tool]]` — Sanity CMS (mounted at base path `/studio`)

### Layout
`ConditionalLayout` (`src/components/ConditionalLayout.tsx`) wraps all pages. It hides the `Header` and `Footer` on `/studio` and `/learn` routes. The desktop layout shifts content right by `md:ml-60` to accommodate the sidebar nav in `Header`.

### Data Layer
All content lives in Sanity. Key document types:
- `userProfile` — links Firebase UID to role, enrolled courses
- `course` — has modules → lessons hierarchy
- `enrollment` — joins student + course with status
- `lessonProgress` — tracks per-lesson completion and notes
- `qaEvent` — live Q&A sessions tied to a course + instructor
- `instructor`, `testimonial` — supporting content types

Sanity schemas are defined in `sanity/schemas/` (root-level, used by the Sanity Studio config), not in `src/`. The `src/sanity/schemaTypes/index.ts` is a stub.

Two Sanity clients are exported from `src/lib/sanity.ts`:
- `client` — read-only, safe to use client-side
- `serverClient` — write-enabled (uses `SANITY_API_TOKEN`), server-side only

Server mutations go through Next.js Server Actions (`src/app/actions/`) or API routes (`src/app/api/`). The Sanity write token (`SANITY_API_TOKEN`) is server-side only.

### API Routes
- `POST /api/create-checkout-session` — initiates Stripe checkout
- `POST /api/webhook` — Stripe webhook (handles payment completion → enrollment creation)
- `GET /api/payment-success` — post-payment redirect handler
- `POST /api/contact` — contact form → Resend email
- `PUT /api/update-lesson-progress` — mark lesson complete
- `PUT /api/update-lesson-notes` — save student notes
- `POST /api/send-course-email` — bulk email to enrolled students via Resend (used by instructors from the manage page)
- `GET /api/qa-events` — fetch Q&A events

## Required Environment Variables

```
# Firebase (public)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET
NEXT_PUBLIC_SANITY_API_VERSION   # defaults to '2025-01-14'
SANITY_API_TOKEN                 # server-side write access

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY

# App
NEXT_PUBLIC_BASE_URL             # used for payment redirect URLs

# Optional
RESEND_API_KEY                   # email notifications
```

## Key Conventions

- Path alias `@/*` maps to `./src/*`
- ESLint is configured to allow `any` types, unused variables, unescaped entities, and empty interfaces — don't fight these rules
- Sanity image URLs come from `cdn.sanity.io` (configured in `next.config.ts` for `next/image`)
- Fonts: Inter (body) and Montserrat (headings) via CSS variables `--font-sans` / `--font-heading`
- Lesson `videoId` supports both YouTube (11-char alphanumeric ID) and Vimeo (numeric ID). `getEmbedUrl` in the learn page auto-detects the platform.
- The middleware only protects `/dashboard` and `/teacher-dashboard`. The `/learn` and `/admin` routes do client-side auth/role checks.
