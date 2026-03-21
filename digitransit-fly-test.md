# Digitransit-UI: Test Environment Deployment Guide

This document covers how to deploy updates to the **test** environment on Fly.io.

## Environment

| | URL | Fly App |
|---|---|---|
| **Test** | https://go-test-embarkok-com.fly.dev | `go-test-embarkok-com` |

The app is deployed under the **EMBARK** organization (`embark-396`) on Fly.io.

## Prerequisites

1. Install the Fly.io CLI: https://fly.io/docs/flyctl/install/
2. Authenticate with Fly.io:
   ```bash
   fly auth login
   ```
3. Docker Desktop must be installed and running (used for local builds).
4. You must be a member of the **EMBARK** organization (`embark-396`) on Fly.io. Ask the project owner to add you.

## Deploying to Test

All commands are run from the root of the `digitransit-ui` repository.

1. **Check out the branch you want to deploy:**
   ```bash
   git checkout <your-branch>
   ```

2. **Make sure Docker Desktop is running.**

3. **Deploy:**
   ```bash
   fly deploy --local-only --config fly.staging.toml
   ```
   This builds the Docker image on your machine and pushes it to Fly. The build takes several minutes (webpack, Relay compilation, etc.).

4. **Verify the deployment:**
   - Visit https://go-test-embarkok-com.fly.dev
   - Check the app logs if something looks wrong:
     ```bash
     fly logs --app go-test-embarkok-com
     ```

## Environment Variables

Secrets are managed via Fly and injected at runtime. To view current secrets:
```bash
fly secrets list --app go-test-embarkok-com
```

To update a secret:
```bash
fly secrets set VARIABLE_NAME="value" --app go-test-embarkok-com
```

**Note:** Some env vars (like `MAPTILER_KEY`) are read at build time by webpack and baked into the client bundle. Changing these via `fly secrets set` requires a full redeploy (`fly deploy --local-only --config fly.staging.toml`) to take effect.

`CONFIG=okc` and `NODE_ENV=production` are set in `fly.staging.toml`, not as secrets.

Current Fly secrets:

| Variable | Value |
|---|---|
| `API_URL` | `https://otp.dev.okc.leonard.io` |
| `OTP_URL` | `https://otp.dev.okc.leonard.io/otp/` |
| `GEOCODING_BASE_URL` | `https://otp.dev.okc.leonard.io/geocoder` |
| `MQTT_URL` | `wss://mqtt.dev.okc.leonard.io/` |
| `ROOTLINK` | `https://go-test.embarkok.com` |
| `OKC_SYSTEM_MAP_URL` | `https://www.embarkok.com/system-map/` |
| `EMBARK_BASE_URL` | `https://www.embarkok.com` |
| `MAPTILER_KEY` | *(set as secret — used for map tiles)* |
| `EMBARK_ALERTS_URL` | `https://mna.mecatran.com/utw/ws/alerts/active/okc?apiKey=...` |

## Map Tiles

Map tiles are configured in `app/configurations/config.okc.js` on the `URL.MAP` line. The tile URL is baked into the client bundle at build time, so any change requires a full redeploy.

**Currently using:** MapTiler Streets v2 (`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=MAPTILER_KEY`)

**To use a custom MapTiler style:** Update the style ID in the `MAP` value in `config.okc.js`:
```javascript
MAP: `https://api.maptiler.com/maps/YOUR_CUSTOM_STYLE_ID/{z}/{x}/{y}@2x.png?key=${MAPTILER_KEY}`,
```
Then redeploy:
```bash
fly deploy --local-only --config fly.staging.toml
```

If you also need to change the MapTiler key, update the secret first:
```bash
fly secrets set MAPTILER_KEY="your-key-here" --app go-test-embarkok-com
```

**Important:** The MapTiler key must have `go-test-embarkok-com.fly.dev` listed in its Allowed HTTP Origins, and the key must have access to the map style being used.

## Configuration Files

| File | Purpose |
|---|---|
| `fly.staging.toml` | Fly.io config for the test environment |
| `app/configurations/config.okc.js` | OKC theme configuration (API URLs, map tiles, branding, etc.) |

## Useful Commands

```bash
# View app status
fly status --app go-test-embarkok-com

# View logs (live tail)
fly logs --app go-test-embarkok-com

# SSH into the running machine
fly ssh console --app go-test-embarkok-com

# Restart the app
fly apps restart go-test-embarkok-com

# Scale the VM (if performance issues)
fly scale vm shared-cpu-2x --memory 1024 --app go-test-embarkok-com
```

## Machines & Cost

The test environment runs on `shared-cpu-2x` with 1GB RAM. Machines are configured to **auto-stop when idle** and **auto-start on incoming requests**, so costs are minimal when the site isn't being accessed.
