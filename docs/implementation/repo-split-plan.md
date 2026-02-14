# Repository Split Implementation Plan

## Goal

Split the current codebase into two independent repositories:

1. `ggras-demo-portal` (commission/admin/operator demo experience)
2. `ggras-tracker` (developer milestone tracker + tracker APIs)

## Current State (Source Repo)

Single Next.js app contains both:
- Demo portal routes (`(commission)`, `(operator)`, admin rules/users/audit/settings, architecture pages)
- Tracker routes (`/overseer`, `/my-milestones`) and serverless tracker APIs (`/api/tracker/*`)

## Target State

### Repo A: `ggras-demo-portal`

Keep:
- `src/app/(commission)/*`
- `src/app/(operator)/*`
- `src/app/(admin)/rules/*`
- `src/app/(admin)/users/*`
- `src/app/(admin)/audit/*`
- `src/app/(admin)/settings/*`
- `src/app/architecture/*`
- `src/lib/mock-data/*`
- Shared UI/layout/util files used by above pages

Remove:
- `src/app/(admin)/overseer/page.tsx`
- `src/app/(developer)/*`
- `src/app/api/tracker/*`
- `src/lib/tracker/*`
- `src/types/tracker.ts`
- `data/tracker-store.json`
- `plans/*.md` (optional in demo repo)

### Repo B: `ggras-tracker`

Keep:
- `src/app/(admin)/overseer/page.tsx`
- `src/app/(developer)/*`
- `src/app/api/tracker/*`
- `src/lib/tracker/*`
- `src/types/tracker.ts`
- `data/tracker-store.json`
- `plans/*.md` (for markdown import flow)

Remove:
- `src/app/(commission)/*`
- `src/app/(operator)/*`
- `src/app/architecture/*`
- `src/app/(admin)/rules/*`
- `src/app/(admin)/users/*`
- `src/app/(admin)/audit/*`
- `src/app/(admin)/settings/*`
- Demo-only mock data not used by tracker

## Execution Strategy

Use a **clone-and-prune** approach to reduce risk:

1. Clone current repo twice.
2. In each clone, delete the unrelated feature set.
3. Fix navigation/layout dependencies.
4. Run lint/typecheck/build.
5. Push each clone to a new remote repo.

This is safer than trying to rewrite history first.

## Phase Plan

## Phase 0: Preparation (0.5 day)

1. Create release branch in source: `split-prep`.
2. Ensure clean baseline:
   - `npm install`
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
3. Tag baseline commit: `pre-split-baseline`.
4. Freeze feature merges during split window.

## Phase 1: Create Demo Repo (1 day)

1. Clone source to new folder:
   - `git clone <source> ggras-demo-portal`
2. Create branch: `split/demo-repo`.
3. Remove tracker-specific files listed above.
4. Update navigation:
   - Remove `developerNav`, `Developer Portal` entry.
   - Change admin default entry from `/overseer` to `/rules`.
5. Remove tracker deps from `package.json` if unused (for example: `bcryptjs`, `jsonwebtoken`, `mongodb`).
6. Update README for demo-only scope.
7. Validate:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
8. Push to new remote: `ggras-demo-portal`.

## Phase 2: Create Tracker Repo (1 day)

1. Clone source to new folder:
   - `git clone <source> ggras-tracker`
2. Create branch: `split/tracker-repo`.
3. Remove demo-specific files listed above.
4. Simplify navigation to tracker-only routes:
   - Admin: `/overseer`
   - Developer: `/my-milestones`
5. Keep `plans/` and `data/` for markdown import and local fallback store.
6. Keep Mongo env config (`MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `JWT_TTL`).
7. Update README for tracker scope and API docs.
8. Validate:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
9. Push to new remote: `ggras-tracker`.

## Phase 3: CI/CD and Deployment Split (0.5 day)

1. Configure separate Vercel projects:
   - `ggras-demo-portal` project
   - `ggras-tracker` project
2. Tracker env vars:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `JWT_SECRET`
   - `JWT_TTL`
3. Demo project should not require tracker env vars.
4. Add independent GitHub Actions pipelines per repo.

## Phase 4: Functional Validation (0.5 day)

### Demo Validation

1. Commission dashboard pages load.
2. Admin rules/users/audit/settings load.
3. Operator portal pages load.
4. No calls to `/api/tracker/*`.

### Tracker Validation

1. Admin login and `/overseer` flow works.
2. Admin invite developer + setup token flow works.
3. Developer first login setup + `/my-milestones` works.
4. Markdown import endpoint works (`/api/tracker/admin/import-md`).
5. Mongo persistence works across restarts/deploys.

## Acceptance Criteria

1. Two independent repos build and deploy successfully.
2. Demo repo has no tracker routes/libs/env requirements.
3. Tracker repo has no commission/operator/rules-demo routes.
4. Both repos pass lint, typecheck, build.
5. READMEs clearly describe scope and deployment.

## Risks and Mitigations

1. Shared component breakage after pruning.
   - Mitigation: remove in small batches; run lint/typecheck after each batch.
2. Hidden dependency on `src/lib/mock-data`.
   - Mitigation: use `rg -n "mock-data|tracker"` sweep after pruning.
3. Navigation dead links.
   - Mitigation: validate every sidebar/portal route manually.
4. Environment drift between repos.
   - Mitigation: add `.env.example` per repo with only required vars.

## Suggested Timeline

1. Day 1: Prep + demo repo extraction.
2. Day 2: tracker repo extraction + CI/CD split.
3. Day 3: QA and production cutover.

## Optional Follow-up

1. Extract shared UI package later (`@ggras/ui`) to reduce duplication.
2. Add API contract tests for tracker endpoints.
3. Add end-to-end smoke tests in each repo.

