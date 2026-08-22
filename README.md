# VRF Field Service Guide — One-click hosting build

Mobile PWA for LG Multi V and Daikin VRV Heat Recovery troubleshooting.

## Fastest hosting option: Render Blueprint

This package includes `render.yaml`. Put the unzipped files in the root of a GitHub repository, then create a Render Blueprint from that repository. Render reads `render.yaml` and creates the Node web service automatically.

No environment variables are required for this version.

## Railway

This package also includes `Dockerfile` and `railway.json`. Deploy the repository as a Railway service; it reads Railway's `PORT` automatically through `server.js`.

## iPhone install

After deployment, open the HTTPS site in Safari → Share → Add to Home Screen. The app includes a PWA manifest and service worker for home-screen/offline behavior.

## Local test

Requires Node.js 18+:

```bash
npm start
```

Then open `http://localhost:8788`.

## Important field-use note

Always verify the exact model/generation and current manufacturer service literature before changing service settings, performing compressor/inverter lockout, backup operation, or refrigerant recovery/vacuum procedures.
