# Public dashboard on Vercel

This repository now includes a separate `dashboard/` Next.js app that can be deployed to Vercel.

## What runs on Vercel
- Public report list (`/`)
- Public request/queue detail pages (`/requests/[requestId]`)
- Public report pages (`/reports/[reportId]`)
- Admin submission page (`/simulationadmin`)

## What does **not** run on Vercel
The full MiroFish simulation pipeline itself.

The Vercel app only queues work and publishes report artifacts. A **local worker** (running from this repository on a machine that already has MiroFish + Codex/Gemini OAuth + Zep working) pulls queued requests and processes them.

## Storage model
The recommended setup is to point `DASHBOARD_BRANCH` at a dedicated writable branch such as `dashboard-data`, while keeping the application code on `main`. This avoids branch-protection rules on `main` and keeps queue/report artifacts isolated.

The dashboard uses the GitHub repository itself as a lightweight persistence layer:
- `dashboard-data/requests/` stores queued jobs and uploaded source files
- `dashboard-data/reports/` stores published report metadata and markdown

That means this version does **not** need Supabase just to launch the first public dashboard.

## Required env vars for the dashboard
- `DASHBOARD_ADMIN_PASSWORD`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `DASHBOARD_BRANCH` (optional, defaults to `dashboard-data`)

## Required env vars for the local worker
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `MIROFISH_BACKEND_BASE_URL` (default `http://127.0.0.1:5001`)
- `DASHBOARD_MAX_ROUNDS` (default `16`)
- `DASHBOARD_SIMULATION_PLATFORM` (default `parallel`)

## Local commands
```bash
# install dashboard deps
npm run dashboard:install

# run the dashboard locally
npm run dashboard:dev

# publish an already generated local report into dashboard-data/
cd dashboard
npm run publish-report -- --source-dir /absolute/path/to/backend/uploads/reports/report_xxxx

# process queued requests using the local MiroFish backend
cd dashboard
npm run worker
```

## Flow
1. Admin opens `/simulationadmin`
2. Admin enters password, uploads files, and pastes a prompt
3. The Vercel app writes a queued request into `dashboard-data/requests/`
4. A local worker reads the request, runs MiroFish through the existing backend APIs, and generates a report
5. The worker publishes the finished report into `dashboard-data/reports/`
6. The public dashboard immediately shows the new report
