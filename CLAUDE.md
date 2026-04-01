# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Digitransit-UI is a multi-tenant public transit journey planner built with React 16, Relay 10 (GraphQL), Fluxible (Flux state management), and Express SSR. It supports multiple transit authority themes (HSL, Waltti, etc.) selected via the `CONFIG` env variable. The monorepo uses Yarn 3 workspaces with shared packages under `digitransit-util/`, `digitransit-component/`, `digitransit-search-util/`, and `digitransit-store/`.

## Commands

```bash
# Setup
yarn install && yarn setup
yarn build-workspaces          # Required: builds monorepo workspace packages

# Development
CONFIG=hsl yarn run dev        # Start dev server with theme (hsl, waltti, default, etc.)
yarn run relay-watch           # Watch mode for GraphQL/Relay compilation (separate terminal)

# Production
yarn run build && NODE_ENV=production CONFIG=hsl yarn start

# Testing
yarn run test-unit             # All unit tests (Mocha/Chai/Enzyme)
yarn run test-unit:app         # App tests only
yarn run test-unit:components  # Component tests only
yarn test-unit:app -g "pattern" # Run tests matching pattern
yarn run test-coverage         # Unit tests with NYC coverage
yarn run test:e2e              # E2E tests (Jest/Playwright)
yarn test:update-snapshots     # Update E2E visual regression snapshots

# Linting
yarn run lint                  # ESLint + Stylelint
yarn run es-lint               # ESLint only
yarn run stylelint             # Stylelint only

# GraphQL
yarn run relay                 # Compile GraphQL fragments to Relay artifacts
yarn run static                # Regenerate sprite sheets
```

## Architecture

### Data Flow

1. **SSR**: Express server renders React with Fluxible store hydration and Relay-prefetched GraphQL data
2. **Client**: Relay 10 fetches from OpenTripPlanner GraphQL API; Fluxible stores manage local state (position, favorites, preferences, routing settings, map layers)
3. **Routing**: Found-Relay with Farce browser protocol; route definitions in `app/routes.js` with code-splitting via webpack dynamic imports

### Component Patterns

Components follow a layered pattern:
- **Views**: Pure render functions (no logic)
- **Containers**: Compose views, transform props, connect to stores via `connectToStores()` HOC
- **Relay containers**: Wrap with `Relay.createContainer` for GraphQL fragment data

Convention: container components have "Container" or "StoreConnector" in their name. Named exports expose both connected default and raw `Component` for testing:
```javascript
export { ConnectedComponent as default, RawComponent as Component };
```

### Configuration System

- `app/configurations/config.default.js` — base config (API endpoints, UI settings, real-time sources, route polygons, GeoJSON layers)
- `app/configurations/config.<theme>.js` — theme-specific overrides merged at runtime via `configMerger()`
- Theme selected by `CONFIG` env var or auto-detected from request hostname on the server

### Key Stores (Flux)

PositionStore, FavouriteStore, PreferencesStore, TimeStore, RoutingSettingsStore, MapLayerStore, MessageStore — registered in `app/app.js`

### Styling

SCSS with BEM-like naming. Base styles in `sass/base/`, theme overrides in `sass/themes/<theme>/`. Foundation 5 grid. PostCSS autoprefixer in production.

## Environment Variables

### Core
- `CONFIG` — theme name (hsl, waltti, default, okc, etc.)
- `NODE_ENV` — development/production
- `PORT` — server port (default: 8080)
- `BASE_CONFIG` — base config name for merging
- `APP_CONTEXT` — app path context root

### API & Backend URLs
- `API_URL` — base API URL
- `OTP_URL` — OpenTripPlanner routing endpoint
- `MAP_URL` — map tile CDN
- `MAP_VERSION` — map tile API version (default: v2)
- `GEOCODING_BASE_URL` — address search/geocoding service
- `MQTT_URL` — MQTT WebSocket for real-time vehicle positions
- `STATIC_MESSAGE_URL` — static messages/announcements JSON
- `FAVOURITE_HOST` — user favorites API host
- `NOTIFICATION_HOST` — user notifications API host
- `REALTIME_PATCH` — JSON patch for real-time config overrides

### API Subscription
- `API_SUBSCRIPTION_QUERY_PARAMETER_NAME` — query param name for API keys
- `API_SUBSCRIPTION_HEADER_NAME` — header name for API keys
- `API_SUBSCRIPTION_TOKEN` — API subscription token value

### Authentication (OIDC)
- `OIDC_CLIENT_ID` — OpenID Connect client ID
- `OIDC_CLIENT_SECRET` — OpenID Connect client secret
- `OIDC_ISSUER` — OIDC issuer URL
- `OIDCHOST` — OIDC host
- `SESSION_SECRET` — session encryption secret (default: reittiopas_secret)

### Redis (Session Storage)
- `REDIS_HOST` — Redis hostname (default: localhost)
- `REDIS_PORT` — Redis port (default: 6379)
- `REDIS_KEY` — Redis auth key

### Static Assets & Build
- `ASSET_URL` — asset CDN base path
- `WEBPACK_DEVTOOL` — sourcemap strategy override

### Error Tracking & Analytics
- `SENTRY_DSN` — client-side Sentry DSN
- `SENTRY_SECRET_DSN` — server-side Sentry DSN
- `GTM_ID` — Google Tag Manager ID
- `DEBUGLOGGING` — enable debug logging

### Timeouts
- `OTP_TIMEOUT` — OTP request timeout in ms (default: 12000)
- `RELAY_FETCH_TIMEOUT` — Relay fetch timeout in ms (default: 3000)

### OKC/Embark-Specific
- `EMBARK_BASE_URL` — Embark application base URL
- `EMBARK_ALERTS_URL` — Embark alerts endpoint
- `MAPTILER_KEY` — MapTiler API key
- `OKC_SYSTEM_MAP_URL` — OKC system map URL template
- `ROOTLINK` — link back to transit authority website

## Deployment

See `digitransit-fly-test.md` for full instructions.

| Environment | URL | Infrastructure | Branch |
|---|---|---|---|
| Local dev | `http://localhost:8080` | Native Node 16 + env from `.env` | `staging` |
| Staging (Fly) | `https://go-test-embarkok-com.fly.dev` | Fly.io (`go-test-embarkok-com`) | `staging` |
| Production (Vultr) | `https://go.embarkok.com` | Vultr server (CloudPanel) | — |

**Staging deploy**: Push to `staging` → GitHub Actions (`deploy-staging.yml`) builds remotely on Fly.
**Manual fallback**: `fly deploy --local-only --config fly.staging.toml` (requires Docker Desktop).

```bash
# Local Docker build (must use amd64 on Apple Silicon)
docker build --platform linux/amd64 --build-arg CONFIG=okc -t go-test-embarkok-com .
```

**Git workflow**: Feature branches off `staging` → PR to `staging` → merge triggers staging deploy. Merge `staging` into `v3` to deploy to production.
**Primary branches**: `v3` (production), `staging` (staging/test).

Map tiles use a custom MapTiler style `e8203d24-1fd9-4a3f-b301-4135cbc11b04` (`MAPTILER_KEY` env var, baked in at build time).

### Local Dev Setup

Digitransit does NOT use dotenv. Env vars must be exported before starting:
```bash
export PATH="$HOME/.nvm/versions/node/v16.20.2/bin:$PATH"
set -a && source .env && set +a
export CONFIG=okc
yarn dev
```

Key local env vars (in `.env`):
- `HOT_LOAD_PORT=9001` — avoids port 9000 conflict with DDEV's php-fpm
- `MAPTILER_KEY` — must have `http://localhost:8080` as allowed HTTP origin in MapTiler console

## Code Style

- ESLint: Airbnb config + Prettier (single quotes, trailing commas, 2-space indent)
- Stylelint for SCSS
- Pre-commit hook: lint-staged + conflict marker check
- Pre-push hook: unit tests
