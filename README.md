# Fuze Ordering — web frontend (GitHub Pages)

A static copy of the Fuze Ordering System UI that runs on GitHub Pages and
talks to the existing **Google Apps Script + Google Sheets** backend over
`fetch()` instead of the Apps Script sandbox. The database and all business
logic stay in Apps Script / Sheets — this repo is only the front door.

## How it works

```
 Browser (this site, GitHub Pages)
   │  index.html / dashboard.html   ← the original HtmlService pages, unchanged
   │  config.js                     ← the one env-specific value (the API URL)
   │  gas-shim.js                   ← re-implements google.script.run over fetch
   ▼  POST {fn, args}  (Content-Type: text/plain → no CORS preflight)
 Apps Script web app  (doPost router in Code.js)
   ▼
 Google Sheet  (unchanged)
```

The pages still call `google.script.run.<fn>(...)` exactly as before. `gas-shim.js`
intercepts those calls and routes them to the Apps Script `doPost` JSON router,
so **no call sites were rewritten** — only two `<script>` tags were injected and
the one server-side dashboard-link scriptlet was replaced with a plain link.

## Files

| File            | Purpose |
|-----------------|---------|
| `index.html`    | Clinic order portal (ported from `Index.html`) |
| `dashboard.html`| Sales dashboard (ported from `DashboardV2.html`) |
| `config.js`     | **The only thing you edit per environment** — the Apps Script `/exec` URL |
| `gas-shim.js`   | `google.script.run` → `fetch` compatibility layer |
| `.nojekyll`     | Tells GitHub Pages to serve files as-is |

## Backend requirement

The Apps Script project must expose the JSON router (`doPost` + `getApiRegistry_()`
in `Code.js`) and be deployed as a web app with access **"Anyone"**. The existing
`doGet` UI is untouched and keeps working, so this can run in parallel until cutover.

## Switch environments

Edit **`config.js`** only:

- **Dev** (default): points at the dev script's `/exec` deployment.
- **Production**: uncomment the production `API_URL` (the `/exec` URL of script `1hP5…`).

## ⚠️ Data isolation (read before write-testing)

The dev Apps Script project is currently container-bound to the **production**
data sheet (`Copy of ORDERING SYSTEM`). Reads are safe; **any write action
(saveOrder, etc.) writes to live data.** Set up a separate test sheet and rebind
the dev script before testing write flows.

## Deploy to GitHub Pages

```bash
cd ~/fuze-ordering-web
git init && git add -A && git commit -m "Fuze ordering web frontend"
# create the repo under your account, then:
git remote add origin git@github.com:ToddStPierre/fuze-ordering-web.git
git push -u origin main
```

Then in the repo: **Settings → Pages → Build from branch → `main` / root**.
The site appears at `https://toddstpierre.github.io/fuze-ordering-web/`.

## Local preview

```bash
cd ~/fuze-ordering-web
python3 -m http.server 8080
# open http://localhost:8080/
```
