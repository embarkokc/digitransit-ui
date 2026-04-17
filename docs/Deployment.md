# Deployment Guide — EMBARK Trip Planner (digitransit-ui)

Last updated: 2026-04-17

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Environments at a Glance](#environments-at-a-glance)
3. [Architecture Diagram](#architecture-diagram)
4. [Branches and Git Workflow](#branches-and-git-workflow)
5. [Fly.io Deployment](#flyio-deployment)
   - [Staging](#staging-deployment)
   - [Production](#production-deployment)
   - [Manual Deploy](#manual-deploy)
6. [Environment Variables](#environment-variables)
   - [Build-time vs Runtime](#build-time-vs-runtime)
   - [Fly Secrets Reference](#fly-secrets-reference)
   - [Updating Secrets](#updating-secrets)
7. [API Backend (OTP)](#api-backend-otp)
8. [Custom Domains](#custom-domains)
9. [Local Development](#local-development)
10. [Useful Fly Commands](#useful-fly-commands)
11. [Troubleshooting](#troubleshooting)
12. [ARCHIVE: Vultr (Legacy)](#archive-vultr-legacy)

---

## System Overview

The EMBARK Trip Planner is a React-based transit journey planner built on the Digitransit platform. The system has two main parts:

- **Frontend (this repo)** — A Node.js/React SSR application deployed to Fly.io
- **Backend API** — An OpenTripPlanner (OTP) instance hosted by Leonard.io (external provider)

Both the frontend and backend have **dev** and **prod** versions, and they pair up like this:

| Frontend (Fly.io)        | Backend API (Leonard.io)          |
|--------------------------|-----------------------------------|
| Staging / Dev frontend   | Dev OTP API                       |
| Production frontend      | Production OTP API                |

The frontend does not talk to a database directly. It calls the OTP API for routing, geocoding, and transit data, and connects to an MQTT broker for real-time vehicle positions.

---

## Environments at a Glance

| Environment | URL | Fly App Name | Branch | API Backend |
|---|---|---|---|---|
| **Staging** | https://go-test.embarkok.com | `go-test-embarkok-com` | `staging` | `otp.dev.okc.leonard.io` |
| **Production** | https://go.embarkok.com | `go-embarkok-com` | `v3` (see note) | `otp.prod.okc.leonard.io` |
| **Local dev** | http://localhost:8080 | — | any | configurable via `.env` |

Both Fly apps are in the **EMBARK** organization (`embark-396`), region `dfw` (Dallas/Fort Worth).

> **Branch warning:** The GitHub Actions production workflow (`deploy-production.yml`) currently triggers on the `main` branch, **not** `v3`. The `main` and `v3` branches have diverged. See [Branches and Git Workflow](#branches-and-git-workflow) for details and recommended fix.

---

## Architecture Diagram

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                    Leonard.io (External)                │
                        │                                                         │
                        │   ┌─────────────────────┐  ┌─────────────────────────┐  │
                        │   │  Dev OTP API         │  │  Prod OTP API           │  │
                        │   │  otp.dev.okc.        │  │  otp.prod.okc.          │  │
                        │   │     leonard.io       │  │     leonard.io          │  │
                        │   │                      │  │                         │  │
                        │   │  - /otp/  (routing)  │  │  - /otp/  (routing)     │  │
                        │   │  - /geocoder (search)│  │  - /geocoder (search)   │  │
                        │   └──────────▲───────────┘  └──────────▲──────────────┘  │
                        │              │                         │                 │
                        └──────────────┼─────────────────────────┼─────────────────┘
                                       │                         │
                        ┌──────────────┼─────────────────────────┼─────────────────┐
                        │              │        Fly.io            │                 │
                        │   ┌──────────┴───────────┐  ┌──────────┴──────────────┐  │
                        │   │  Staging App          │  │  Production App         │  │
                        │   │  go-test-embarkok-com │  │  go-embarkok-com        │  │
                        │   │                       │  │                         │  │
                        │   │  shared-cpu-2x / 1GB  │  │  shared-cpu-2x / 2GB   │  │
                        │   │  auto-stop when idle  │  │  always running (min 1) │  │
                        │   └──────────▲────────────┘  └──────────▲─────────────┘  │
                        │              │                          │                │
                        └──────────────┼──────────────────────────┼────────────────┘
                                       │                          │
                        ┌──────────────┼──────────────────────────┼────────────────┐
                        │              │     Custom Domains        │                │
                        │   go-test.embarkok.com          go.embarkok.com          │
                        └──────────────┼──────────────────────────┼────────────────┘
                                       │                          │
                        ┌──────────────┼──────────────────────────┼────────────────┐
                        │              │       GitHub              │                │
                        │              │                          │                │
                        │   push to `staging`            push to `main`/`v3`       │
                        │   ──► deploy-staging.yml       ──► deploy-production.yml │
                        └──────────────┼──────────────────────────┼────────────────┘
                                       │                          │
                        ┌──────────────┼──────────────────────────┼────────────────┐
                        │              │    MQTT (Real-time)       │                │
                        │   wss://mqtt.dev.okc.         wss://mqtt.prod.okc.       │
                        │        leonard.io/                 leonard.io/           │
                        └─────────────────────────────────────────────────────────┘
```

---

## Branches and Git Workflow

### Current branch layout

| Branch | Purpose | Auto-deploys to |
|---|---|---|
| `staging` | Active development & testing | Staging (Fly) |
| `v3` | Production code | **None currently** (see warning below) |
| `main` | Unclear / diverged from v3 | Production (Fly) per workflow |
| `feat/*` | Feature branches | — |

### Intended workflow

```
feat/my-feature ──► PR to staging ──► merge ──► auto-deploy to staging
                                                       │
                                            (test & verify)
                                                       │
                                        staging ──► merge to v3 ──► deploy to production
```

### Commit message format (commitlint)

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/) via a `commitlint` pre-commit hook. If your commit message doesn't follow the format, the push will be rejected:

```
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

**Required format:**

```
<type>: <subject>
```

Common types:

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Maintenance, config changes, dependencies |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, whitespace, missing semicolons (no code change) |
| `test` | Adding or updating tests |
| `revert` | Reverting a previous commit |

**Examples:**

```bash
# Good
git commit -m "feat: add fare breakdown to itinerary summary"
git commit -m "fix: resolve map tile 404 on staging"
git commit -m "chore: update fly.staging.toml memory limit"
git commit -m "docs: add deployment guide"

# Bad — will be rejected
git commit -m "add docs for deployment"
git commit -m "fixed the bug"
git commit -m "WIP"
```

The type must be lowercase. The subject should not end with a period.

### Known issue: `main` vs `v3` branch mismatch

The production deploy workflow (`.github/workflows/deploy-production.yml`) triggers on pushes to `main`, but the intended production branch is `v3`. These two branches have **diverged** — neither is an ancestor of the other.

**Impact:** Pushing to `v3` does NOT trigger a production deploy. The last production deploy would have come from a push to `main`.

**Recommended fix (pick one):**
1. Update `deploy-production.yml` to trigger on `v3` instead of `main`
2. Or reconcile `main` and `v3` and decide on a single production branch

---

## Fly.io Deployment

All deployment is handled via Fly.io. Both environments use the same Dockerfile with different Fly config files.

### Staging Deployment

**Automatic:** Push or merge to the `staging` branch. GitHub Actions builds and deploys.

```
push to staging → .github/workflows/deploy-staging.yml → fly deploy --config fly.staging.toml
```

The workflow:
- Checks out the code
- Installs the Fly CLI
- Runs `flyctl deploy --config fly.staging.toml --remote-only`
- Authenticates via the `FLY_API_TOKEN` GitHub secret

**Config file:** `fly.staging.toml`
- App: `go-test-embarkok-com`
- VM: `shared-cpu-2x`, 1GB RAM
- Auto-stop when idle, auto-start on requests
- Min machines: 0 (can scale to zero)

### Production Deployment

**Automatic:** Push to `main` triggers `.github/workflows/deploy-production.yml`.

> **Remember:** `v3` pushes do NOT trigger this? See the [branch mismatch issue](#known-issue-main-vs-v3-branch-mismatch).

```
push to main → .github/workflows/deploy-production.yml → fly deploy --config fly.production.toml
```

**Config file:** `fly.production.toml`
- App: `go-embarkok-com`
- VM: `shared-cpu-2x`, 2GB RAM
- Auto-stop: **off** (always running)
- Min machines: 1

### Manual Deploy

If GitHub Actions is unavailable, or you need to deploy locally:

1. Install the [Fly CLI](https://fly.io/docs/flyctl/install/) and authenticate: `fly auth login`
2. Install and start Docker Desktop
3. Run:

```bash
# Staging
fly deploy --local-only --config fly.staging.toml

# Production
fly deploy --local-only --config fly.production.toml
```

> On Apple Silicon Macs, Docker must build for amd64: `docker build --platform linux/amd64 ...`

---

## Environment Variables

### Build-time vs Runtime

This is the most important distinction for this project. Variables are consumed at two different times:

| Type | When consumed | How to set | Change takes effect |
|---|---|---|---|
| **Build-time** | During `docker build` / webpack bundling | `[build.args]` in fly.toml | Requires full redeploy (new build) |
| **Runtime** | When the Node.js server starts | Fly secrets | Requires app restart (automatic on secret change) |

**Build-time variables** are baked into the JavaScript bundle by webpack. The most notable one is:

- **`MAPTILER_KEY`** — read by webpack at build, embedded in the client-side JS bundle. Changing the Fly secret alone is not enough; you must trigger a new build (push to branch or `fly deploy`).

**Runtime variables** are injected by Fly as environment variables when the container starts. Most API URLs fall into this category.

### How variables flow through the system

```
fly.toml [build.args]          Fly secrets (runtime)
        │                              │
        ▼                              ▼
   Dockerfile ARG                process.env.*
        │                              │
        ▼                              ▼
   webpack build               Node.js server starts
   (bundles into JS)           (reads at startup)
        │                              │
        ▼                              ▼
   Client-side code            Server-side rendering
   (cannot change              (changes on restart)
    without rebuild)
```

### Fly Secrets Reference

All env vars are defined as Fly secrets. The `fly.toml` files set only a few non-sensitive values in `[env]`.

#### Values set in `fly.toml` [env] (both staging and production)

| Variable | Staging | Production | Notes |
|---|---|---|---|
| `PORT` | `8080` | `8080` | Internal container port |
| `NODE_ENV` | `production` | `production` | Always production (even staging) |
| `CONFIG` | `okc` | `okc` | Theme selection |
| `EMBARK_BASE_URL` | `https://staging.embarkok.com` | `https://www.embarkok.com` | Link to main Embark website |
| `ROOTLINK` | `https://go-test.embarkok.com` | `https://go.embarkok.com` | Self-referential URL |

#### Values set as Fly secrets

| Variable | Staging value | Production value | Purpose |
|---|---|---|---|
| `API_URL` | `https://otp.dev.okc.leonard.io` | `https://otp.prod.okc.leonard.io` | Base API URL for OTP backend |
| `OTP_URL` | `https://otp.dev.okc.leonard.io/otp/` | `https://otp.prod.okc.leonard.io/otp/` | OTP routing endpoint |
| `GEOCODING_BASE_URL` | `https://otp.dev.okc.leonard.io/geocoder` | `https://otp.prod.okc.leonard.io/geocoder` | Address search / geocoding |
| `MQTT_URL` | `wss://mqtt.dev.okc.leonard.io/` | `wss://mqtt.prod.okc.leonard.io/` | Real-time vehicle positions (WebSocket) |
| `MAPTILER_KEY` | *(secret)* | *(secret)* | Map tile API key (**build-time**) |
| `MAPTILER_STYLE` | *(secret)* | *(secret)* | MapTiler style ID |
| `EMBARK_ALERTS_URL` | `https://mna.mecatran.com/...` | *(confirm value)* | Service alerts endpoint |
| `OKC_SYSTEM_MAP_URL` | `https://www.embarkok.com/system-map/` | *(confirm value)* | System map link |

> **Note:** Some of these secrets (like `EMBARK_BASE_URL`, `ROOTLINK`) may also appear in `fly.toml` `[env]`. The Fly secret takes precedence over `[env]` at runtime.

### Updating Secrets

```bash
# List current secrets
fly secrets list --app go-test-embarkok-com     # staging
fly secrets list --app go-embarkok-com          # production

# Set a secret (triggers automatic restart)
fly secrets set API_URL="https://otp.dev.okc.leonard.io" --app go-test-embarkok-com

# Set multiple at once
fly secrets set \
  API_URL="https://otp.prod.okc.leonard.io" \
  OTP_URL="https://otp.prod.okc.leonard.io/otp/" \
  --app go-embarkok-com

# Unset a secret
fly secrets unset VARIABLE_NAME --app go-test-embarkok-com
```

**After changing `MAPTILER_KEY` or `MAPTILER_STYLE`:** You must also trigger a rebuild. Either push a commit to the deploy branch or run `fly deploy`.

---

## API Backend (OTP)

The OpenTripPlanner (OTP) backend is hosted and managed by **Leonard.io** as an external service. They provide both dev and prod instances.

| Environment | Base URL | Services |
|---|---|---|
| **Dev** | `https://otp.dev.okc.leonard.io` | OTP routing, geocoding, vector tiles |
| **Prod** | `https://otp.prod.okc.leonard.io` | OTP routing, geocoding, vector tiles |

### Services on each OTP instance

| Path | Service | Used for |
|---|---|---|
| `/otp/` | OpenTripPlanner routing | Journey planning, itineraries, fares |
| `/geocoder/search` | Pelias geocoder (search) | Address / place search |
| `/geocoder/reverse` | Pelias geocoder (reverse) | Coordinates to address |
| `/geocoder/place` | Pelias geocoder (place) | Place details lookup |
| `/otp/routers/default/vectorTiles/stops/` | Vector tiles | Stop markers on map |
| `/otp/routers/default/vectorTiles/rentalStations/` | Vector tiles | Bike rental stations on map |

### MQTT (Real-time vehicle positions)

| Environment | URL |
|---|---|
| **Dev** | `wss://mqtt.dev.okc.leonard.io/` |
| **Prod** | `wss://mqtt.prod.okc.leonard.io/` |

Real-time vehicle positions are delivered over WebSocket via MQTT. The frontend subscribes to topics for the `embark` feed.

### What Leonard.io manages (not us)

- OTP server updates and GTFS data refreshes
- Geocoder index updates
- MQTT broker availability
- SSL certificates on their domains

If routing data is stale or geocoding returns wrong results, contact Leonard.io.

---

## Custom Domains

| Domain | Points to | Fly App |
|---|---|---|
| `go.embarkok.com` | Fly production app | `go-embarkok-com` |
| `go-test.embarkok.com` | Fly staging app | `go-test-embarkok-com` |

The Fly apps also have their default `.fly.dev` URLs:
- Staging: `https://go-test-embarkok-com.fly.dev`
- Production: `https://go-embarkok-com.fly.dev`

### MapTiler allowed origins

The `MAPTILER_KEY` must have the following HTTP origins allowed in the [MapTiler console](https://cloud.maptiler.com/):
- `go.embarkok.com` (production)
- `go-test.embarkok.com` (staging)
- `go-test-embarkok-com.fly.dev` (staging fallback)
- `localhost:8080` (local development)

---

## Local Development

Digitransit does **not** use the `dotenv` npm package. Env vars must be exported before starting the dev server.

```bash
# 1. Use Node 16
export PATH="$HOME/.nvm/versions/node/v16.20.2/bin:$PATH"

# 2. Load env vars from .env file
set -a && source .env && set +a

# 3. Set the theme
export CONFIG=okc

# 4. Start dev server
yarn dev
```

Your `.env` file should contain at minimum:

```bash
API_URL=https://otp.dev.okc.leonard.io
OTP_URL=https://otp.dev.okc.leonard.io/otp/
GEOCODING_BASE_URL=https://otp.dev.okc.leonard.io/geocoder
MQTT_URL=wss://mqtt.dev.okc.leonard.io/
MAPTILER_KEY=your-key-here
MAPTILER_STYLE=e8203d24-1fd9-4a3f-b301-4135cbc11b04
EMBARK_BASE_URL=https://staging.embarkok.com
ROOTLINK=http://localhost:8080
EMBARK_ALERTS_URL=https://mna.mecatran.com/utw/ws/alerts/active/okc?apiKey=...
OKC_SYSTEM_MAP_URL=https://www.embarkok.com/system-map/
HOT_LOAD_PORT=9001
```

> `HOT_LOAD_PORT=9001` avoids a conflict with DDEV's php-fpm on port 9000.

---

## Useful Fly Commands

```bash
# View app status
fly status --app go-test-embarkok-com        # staging
fly status --app go-embarkok-com             # production

# View logs (live tail)
fly logs --app go-test-embarkok-com

# SSH into running machine
fly ssh console --app go-test-embarkok-com

# Restart the app (applies secret changes without rebuild)
fly apps restart go-test-embarkok-com

# Scale VM resources
fly scale vm shared-cpu-2x --memory 1024 --app go-test-embarkok-com

# View current secrets
fly secrets list --app go-test-embarkok-com

# View deployment history
fly releases --app go-test-embarkok-com
```

---

## Troubleshooting

### Map tiles not loading
- Check `MAPTILER_KEY` is set as a Fly secret
- Verify the key has the correct allowed HTTP origins in MapTiler console
- Remember: `MAPTILER_KEY` is **build-time** — changing the secret requires a redeploy, not just a restart

### API/routing errors or stale data
- Check if OTP is responding: `curl https://otp.dev.okc.leonard.io/otp/`
- If OTP is down or returning stale GTFS data, contact Leonard.io
- Verify `API_URL` and `OTP_URL` secrets are correct: `fly secrets list --app <app-name>`

### Staging deploy not triggering
- Ensure you pushed to the `staging` branch (not a feature branch)
- Check GitHub Actions: https://github.com/embarkokc/digitransit-ui/actions
- Verify the `FLY_API_TOKEN` GitHub secret is valid

### Production deploy not triggering
- The workflow triggers on `main`, **not** `v3`. See [branch mismatch issue](#known-issue-main-vs-v3-branch-mismatch).

### App crashes or OOM
- Check logs: `fly logs --app <app-name>`
- Consider scaling memory: `fly scale vm shared-cpu-2x --memory 2048 --app <app-name>`

### Real-time vehicles not showing
- Check MQTT WebSocket connectivity to `mqtt.dev.okc.leonard.io` or `mqtt.prod.okc.leonard.io`
- Verify `MQTT_URL` secret is set correctly

---

## ARCHIVE: Vultr (Legacy)

> **Status: ARCHIVED** — Production was previously hosted on a Vultr VPS managed via CloudPanel. As of 2026, production has been migrated to Fly.io. This section is retained for historical reference only.

| Environment | URL | Infrastructure |
|---|---|---|
| Production (legacy) | `https://go.embarkok.com` | Vultr server (CloudPanel) |

The Vultr setup used:
- A VPS running Node.js directly (no containers)
- CloudPanel for server management and SSL
- Manual deployments (SSH + git pull + rebuild)
- Environment variables set in the shell profile or a systemd service file

**This infrastructure is no longer in use.** The `go.embarkok.com` domain now points to the Fly.io production app.
