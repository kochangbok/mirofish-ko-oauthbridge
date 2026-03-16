# Dashboard app

This Next.js app is the Vercel-deployable public control plane for published MiroFish reports.

## Routes
- `/` public report list + public queue view
- `/reports/[reportId]` public report detail
- `/requests/[requestId]` public queued/request detail
- `/simulationadmin` password-protected submission form

## Required env vars
- `DASHBOARD_ADMIN_PASSWORD`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `DASHBOARD_BRANCH` (optional, defaults to `dashboard-data`)

## Local worker env vars
- `MIROFISH_BACKEND_BASE_URL` (default `http://127.0.0.1:5001`)
- `DASHBOARD_MAX_ROUNDS` (default `16`)
- `DASHBOARD_SIMULATION_PLATFORM` (default `parallel`)

## Recommended worker startup

From the repo root you can start the worker with GitHub CLI token fallback:

```bash
npm run dashboard:worker:auto
```

This helper:
- derives `GITHUB_TOKEN` from `gh auth token` when possible
- defaults to `kochangbok/mirofish-ko-oauthbridge`
- targets the `dashboard-data` branch
- points to the local backend at `http://127.0.0.1:5001`
