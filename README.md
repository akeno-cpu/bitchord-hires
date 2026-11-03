# Amazon Music [Akeno]

This project is a working BitChord-compatible music addon. It exposes the BitChord addon manifest and search/stream endpoints, while falling back to a local demo catalogue when an Amazon provider is not configured.

## Run locally

```bash
npm install
npm start
```

Then open:

- http://localhost:8787/manifest.json
- http://localhost:8787/health
- http://localhost:8787/search?q=midnight

## Environment variables

Copy `.env.example` to `.env` and adjust values as needed:

```env
PORT=8787
BASE_URL=http://localhost:8787
AMAZON_MUSIC_ENABLED=false
AMAZON_CLIENT_ID=
AMAZON_CLIENT_SECRET=
```

If `AMAZON_MUSIC_ENABLED=true` and either the legacy Amazon credentials or the API credentials are present, the addon resolves in Amazon mode. For the live API-backed flow, set one of these combinations:

```env
AMAZON_API_URL=https://your-api-host.example
AMAZON_API_TOKEN=your-token
```

or the equivalent `AMAZON_ACCESS_TOKEN` / `API_URL` / `API_TOKEN` variables. Otherwise it stays in mock mode and serves the built-in demo catalogue and stream.

## Test

```bash
npm test
```
