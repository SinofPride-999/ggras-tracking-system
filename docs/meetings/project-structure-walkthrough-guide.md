# Project Structure And Technology Script (Read Word For Word)

## How To Use This Document
- Read this script exactly as written.
- Replace bracket placeholders before the meeting.
- Keep this to 35 to 45 minutes.

## Meeting Details
- Date: [Insert Date]
- Time: [Insert Time]
- Facilitator: [Your Name]

## 0:00-0:03 Opening
"In this kickoff session, I will explain our repository structure and our technology stack.

The goal is clarity: every engineer should know where code goes, what technologies we are committed to, and how each repo supports delivery."

## 0:03-0:07 Why This Matters
"Structure and technology decisions are not documentation exercises. They define our delivery speed, quality, and handoff reliability.

If structure is vague, we get overlap, unclear ownership, and merge conflicts.

If structure is explicit, teams can work in parallel and integrate with lower risk."

## 0:07-0:15 Top-Level Repository Map
"At the top level, we currently work with these four repositories.

One: ggras-main. This is the core monorepo for backend, admin, operator portal, ML workspace, shared packages, contracts, infra, and architecture docs.

Two: ggras-tracker. This is the execution tracker for admin overseer views, developer milestone views, and tracker APIs.

Three: ggras-demo-portal. This is the stakeholder-facing demo portal.

Four: ggras-demo. This is an additional demo workspace that includes tracker and milestone tooling.

I will now read the high-level repository map."

### Read This Tree Aloud
```text
GGRASS/
  ggras-main/
    apps/
    packages/
    libs/
    infra/
    docs/
  ggras-tracker/
    src/
    plans/
    data/
    docs/
  ggras-demo-portal/
    src/
    public/
    docs/
    data/
  ggras-demo/
    src/
    plans/
    data/
    docs/
```

## 0:15-0:25 Technology Stack By Repository
"Now I will explain the current technology choices by repository.

For ggras-main:
We use a Turborepo Node workspace model with TypeScript.
The backend app is NestJS version 10.
The admin and operator apps are Next.js 14 with React 18.
The ML workspace is Python 3.11 plus FastAPI, scikit-learn, pandas, and MLflow.
We also maintain shared contracts in libs/contracts with OpenAPI and AsyncAPI starter specs.

For ggras-tracker:
We use Next.js 14 App Router, React 18, and TypeScript.
Tracker APIs are Next.js route handlers under /api/tracker.
Durable persistence is MongoDB when configured, with a local JSON fallback for development.

For ggras-demo-portal:
We use Next.js 14, React 18, TypeScript, Tailwind CSS, and charting and animation libraries for presentation.
This is our stakeholder demonstration surface.

For ggras-demo:
We use Next.js 14, React 18, TypeScript, and MongoDB support for demo and tracker workflows.

These are our active defaults until we deliberately approve changes."

## 0:25-0:32 ggras-main Internal Structure
"I will now walk through ggras-main because it is the architecture anchor.

In ggras-main/apps:
backend contains the NestJS API service.
admin contains the regulator admin portal.
operator-portal contains the operator experience.
ml contains the Python model and serving workspace.

In ggras-main/packages:
ui is shared React UI primitives.
operator-sdk is the TypeScript SDK starter.
api, frontend, and ai-engine hold shared cross-domain utilities.

In ggras-main/libs/contracts:
we store OpenAPI and AsyncAPI artifacts.

In ggras-main/infra:
we keep Docker, Kubernetes, and Helm templates."

### Read This Tree Aloud
```text
ggras-main/
  apps/
    backend/
    admin/
    operator-portal/
    ml/
  packages/
    ui/
    operator-sdk/
    api/
    frontend/
    ai-engine/
  libs/
    contracts/
  infra/
  docs/
```

## 0:32-0:38 ggras-tracker Internal Structure
"Now I will explain ggras-tracker, because this is where sprint execution visibility lives.

In src/app:
we split admin and developer views with route groups.
we place tracker APIs in src/app/api/tracker by domain.

In src/lib/tracker/server:
we keep backend business logic and data access.

In plans:
we keep markdown milestone plans for import.

In data:
we keep the local fallback store.

In docs:
we keep implementation and meeting guides."

### Read This Tree Aloud
```text
ggras-tracker/
  src/
    app/
      (admin)/
      (developer)/
      api/tracker/
        auth/
        admin/
        milestones/
        progress-reports/
        developers/
        health/
    lib/tracker/server/
    types/
  plans/
  data/
  docs/
```

## 0:38-0:42 Placement Rules To Enforce
"From today, we will enforce the following placement rules.

If the change is core platform architecture, place it in ggras-main.
If the change is delivery tracking or milestone governance, place it in ggras-tracker.
If the change is stakeholder demo experience, place it in ggras-demo-portal or ggras-demo.

For tracker APIs, place code under src/app/api/tracker by domain.
For tracker backend logic, place code under src/lib/tracker/server.
For shared tracker contracts, place code under src/types."

## 0:42-0:45 Close
"To close:
our structure is now explicit,
our technology choices are explicit,
and our code placement rules are explicit.

This is the baseline we will use in sprint planning, implementation, and code review."

## Q And A Prompts
- "Is any repository boundary unclear?"
- "Is any technology decision blocked by missing dependencies or environment setup?"
- "Do we need to freeze an API contract this week?"

## Final Checklist
- [ ] Repository boundaries confirmed
- [ ] Technology stack confirmed
- [ ] Placement rules confirmed
- [ ] Sprint tickets mapped to the right repositories
