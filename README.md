# WA REST API

Public and free API service built with Express. The dashboard is a static HTML/CSS/Vanilla JavaScript frontend served from `public/`.

## Features

- Public access: no account, login, API key, subscription, or premium tier.
- Responsive developer dashboard with Dark, Light, and System appearance preferences.
- API Explorer generated from `public/js/api.js` endpoint definitions.
- API documentation generated from the same endpoint definitions.
- Runtime console and in-session logs.
- Existing Express routes and scraper services remain in `src/`.

## Run locally

```bash
npm install
npm start
```

The server listens on port `3000` outside production. In Vercel, `src/server.js` is exported as the serverless application through `vercel.json`.

## Notes

- Dashboard metrics are based on the existing system-status route and visitor/request counter integration. They are not fabricated sample values.
- System Logs are browser-session logs, not persistent server-side audit logs.
- Endpoint examples in the documentation are illustrative response shapes; use API Explorer for live responses.
- Do not add authentication or API-key requirements unless the project owner explicitly changes the public-access policy.
