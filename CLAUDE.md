# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BulletinBoard2** — full-stack MMORPG guild bulletin board. Players post ads seeking specific roles (tanks, healers, etc.). Others respond and get accepted/rejected.

## Development Setup

### Backend (Django)
```bash
cd backend
source ../venv/bin/activate   # or python -m venv ../venv && pip install -r requirements.txt
cp .env.example .env          # fill in SECRET_KEY, email settings
python manage.py migrate
python manage.py runserver    # http://localhost:8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                   # http://localhost:3000
```

### Tests
```bash
cd backend && pytest                        # all tests
cd backend && pytest ads/tests/             # single app
cd backend && pytest -k "test_create_ad"   # single test by name
```

### Other commands
```bash
cd frontend && npm run lint       # ESLint
cd frontend && npm run build      # production build
python manage.py createsuperuser  # admin user
```

## Architecture

```
frontend (Next.js 14, App Router, TypeScript, Tailwind)
    └── lib/api.ts          — fetch wrapper, auto-refreshes JWT on 401
    └── lib/auth-context.tsx — global auth state (user, login, logout)
    └── components/TipTapEditor.tsx — rich text editor (images, YouTube embeds)

backend (Django 5.1, DRF 3.15, simplejwt)
    ├── apps/users   — custom User model (email-only), email verification
    ├── apps/ads     — Ad, Response models; category choices; image upload
    └── apps/newsletter — Newsletter model for bulk email records
```

## Authentication Flow

1. Register (`POST /api/users/register/`) — sends verification code to email
2. Verify email (`POST /api/users/verify/`) — activates account
3. Login (`POST /api/users/token/`) — returns `access` (60 min) + `refresh` (7 days) JWT
4. `api.ts` stores tokens in cookies, auto-retries on 401 with `POST /api/users/token/refresh/`

Email backend is `console` in dev (tokens print to terminal). Configure SMTP in `.env` for real delivery.

## Data Model

**Ad categories** are hardcoded Django choices (10 MMORPG roles): `TANK`, `HEALER`, `DD`, `TRADER`, `GILDMASTER`, `QUESTGIVER`, `BLACKSMITH`, `SKINNER`, `TANNER`, `POTIONMAKER`.

**Response status** flow: `PENDING` → `ACCEPTED` (only ad author can accept; accepting one auto-rejects others for the same ad).

**Permissions**: only the ad author can edit/delete their ad or accept responses. DRF `IsAuthenticatedOrReadOnly` + custom `IsOwnerOrReadOnly` permission class.

## Key API Endpoints

| Method | URL | Notes |
|--------|-----|-------|
| POST | `/api/users/register/` | creates inactive user |
| POST | `/api/users/verify/` | activates account |
| POST | `/api/users/token/` | JWT login |
| POST | `/api/users/token/refresh/` | refresh access token |
| GET/POST | `/api/ads/` | list (filterable by `category`) / create |
| GET/PUT/DELETE | `/api/ads/<id>/` | detail / owner-only edit/delete |
| POST | `/api/ads/<id>/upload_image/` | TipTap image upload → `/media/uploads/` |
| GET/POST | `/api/ads/<id>/responses/` | list responses / submit response |
| POST | `/api/ads/responses/<id>/accept/` | owner accepts a response |

## Environment Variables

**Backend** (`.env` in `/backend`):
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- `DATABASE_URL` (SQLite default, PostgreSQL for prod)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `FRONTEND_URL` (used in CORS and verification emails)

**Frontend** (`.env.local` in `/frontend`):
- `NEXT_PUBLIC_API_URL` — backend base URL (default: `http://localhost:8000`)

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
