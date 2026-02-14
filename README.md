# GGRAS Tracker

Developer execution tracker and admin overseer dashboard.

## Scope

- Developer login and first-time password setup flow
- Admin invite flow (email + setup token)
- Weekly milestones and daily checkpoint updates
- Progress reports and team overseer analytics
- Markdown milestone import from `plans/*.md`
- Serverless API via Next.js route handlers under `/api/tracker/*`

## Stack

- Next.js 14 (App Router)
- TypeScript
- MongoDB (recommended for durable serverless persistence)
- Local JSON fallback store for development

## Local Development

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/overseer`
- `http://localhost:3000/my-milestones`

## Environment Variables

Set in `.env.local` and deployment environment:

- `NEXT_PUBLIC_TRACKER_API_URL=/api/tracker`
- `JWT_SECRET=replace-with-strong-secret`
- `JWT_TTL=12h`
- `MONGODB_URI=...`
- `MONGODB_DB=ggras_tracker`

## API Endpoints

- `POST /api/tracker/auth/login`
- `POST /api/tracker/auth/setup-password`
- `GET /api/tracker/auth/me`
- `GET /api/tracker/admin/overview`
- `POST /api/tracker/admin/developers/invite`
- `POST /api/tracker/admin/import-md`
- `GET/POST /api/tracker/milestones`
- `PATCH /api/tracker/milestones/[milestoneId]/daily/[dailyId]`
- `GET/POST /api/tracker/progress-reports`
- `GET /api/tracker/developer/overview`
- `GET /api/tracker/developers`
- `GET /api/tracker/health`

## Deployment

Configured for Vercel serverless.

```bash
npm run build
```

