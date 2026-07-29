# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **frontend-only** React + Vite single-page app (Hebrew, RTL). There is no backend in this repository.

### Services
- **Web app (Vite dev server)** — the only service. Standard scripts are in `package.json`:
  - Dev: `npm run dev` (serves at `http://localhost:5173`)
  - Lint: `npm run lint`
  - Build: `npm run build`
  - Preview a production build: `npm run preview`

### Non-obvious notes
- The app talks to an **external, hosted backend** at `https://soroka-server.onrender.com` (hardcoded in `src/api.js`). It is not run locally. Network access to that host is required for staff/schedule data to load; the app still renders and lets you log in without it.
- **Admin login is client-side** (no backend needed): username `admin`, password `soroka`. Non-admin ("guest") users log in by last name (username and password both equal their last name), which requires the external backend to have loaded the staff list.
- The external backend may return empty datasets (e.g. dashboard shows "לא נמצאו נתונים"); this is a data state, not an app failure.
- `npm run lint` currently reports pre-existing errors from newer ESLint 10 / `eslint-plugin-react-hooks` 7 rules (e.g. functions used before declaration inside `useEffect`, unused vars). These are pre-existing in the committed source, not environment issues.
- Avoid write actions (add/edit/delete staff, absences, leave requests) when testing, since they hit the shared production backend.
