# Local and Hosted Access

The frontend API resolver supports three setups:

1. **Local machine**: with Vite (`npm run dev`), requests go to `http://<current-browser-hostname>:5000/api`. This works at `localhost:5173` and from another device opening the Vite machine's LAN address, as long as the backend is listening on `0.0.0.0:5000` and the firewall permits the port.
2. **Same-origin hosting**: production builds default to `/api`. Use this when a reverse proxy or hosting rewrite serves the frontend and backend under the same origin.
3. **Separate hosted frontend/backend**: set `VITE_API_URL` in the frontend host's build environment to the public API base URL, including `/api`, for example `https://api.example.com/api`. Do not commit provider-specific hostnames or secrets in frontend source; Vite variables are public in the generated bundle.

## Backend Environment

Set these in the backend host configuration:

```env
FRONTEND_URL=https://helpdesk.example.com
CORS_ORIGINS=https://helpdesk.example.com,https://helpdesk-preview.example.com
```

`FRONTEND_URL` and `CORS_ORIGINS` accept comma-separated origins. Include scheme and hostname, but no path. Localhost and private LAN origins are allowed for development automatically. Other hosted origins must be listed explicitly; do not use wildcard CORS for authenticated APIs.

Keep `DATABASE_URL` and `JWT_SECRET` only in backend environment variables. Never add them to frontend variables or commit them.

## Run Locally

Start the API and UI in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. For LAN testing, open the Vite server's LAN URL from another device; use the same machine's LAN hostname/IP and ensure TCP ports `5173` and `5000` are reachable.

## Hosting Notes

The backend has a Vercel entry point in `backend/api/index.js` and a rewrite in `backend/vercel.json`. Deploy it with `backend/` as the Vercel project root, then set the frontend's `VITE_API_URL` to that deployment's `/api` base URL and add the frontend's exact production origin to backend `FRONTEND_URL` or `CORS_ORIGINS`. The Vercel environment must also contain the backend database and JWT settings.
