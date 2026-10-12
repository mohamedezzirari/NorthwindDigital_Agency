# Northwind Digital — backend

A small Express + SQLite backend for the marketing site. It replaces the
contact form's "open the visitor's email app" behaviour with a real, validated,
stored submission, and lets the page content be served from a database instead
of a hard-coded file.

- **Runtime:** Node 22.5+ (uses the built-in `node:sqlite`, so there is no
  native module to compile)
- **Database:** one SQLite file at `server/data/site.db`
- **Dependencies:** `express`, `express-rate-limit` (plus optional `nodemailer`)

## Run it

```powershell
cd server
npm install
npm start
```

Then open <http://127.0.0.1:3000>. The same server hosts the site *and* the API,
so there is nothing else to configure.

| Script          | What it does                                              |
| --------------- | --------------------------------------------------------- |
| `npm start`     | Run the server (site + API) on `PORT`, default `3000`     |
| `npm run dev`   | Same, restarting on file changes                           |
| `npm test`      | Boot a throwaway server + temp database and run the API suite |
| `npm run seed`  | Reset all content sections from `js/config.js`             |
| `npm run serve:static` | Serve the site with no API, to check the static fallback |

## Configuration

Everything is optional — the server runs with no configuration at all. Copy
`.env.example` to `.env` to change anything (load it with
`node --env-file=.env server.js`, or export the variables another way).

| Variable                 | Default              | Purpose                                  |
| ------------------------ | -------------------- | ---------------------------------------- |
| `PORT`                   | `3000`               | Port to listen on                        |
| `HOST`                   | `127.0.0.1`          | Interface to bind (`0.0.0.0` in a container) |
| `DATA_DIR`               | `server/data`        | Where the SQLite file lives              |
| `RATE_LIMIT_MAX`         | `10`                 | Contact submissions per window, per IP   |
| `RATE_LIMIT_WINDOW_MIN`  | `60`                 | Length of that window in minutes         |
| `RATE_LIMIT_READ_MAX`    | `60`                 | Admin/lead reads per minute, per IP     |
| `SMTP_*`, `NOTIFY_EMAIL` | unset                | Email notification for new leads         |

## How content loading works

`js/config.js` remains the source of truth for the *initial* content. On first
boot the server reads it and copies the seven sections into the database:

`config`, `team`, `services`, `projects`, `why`, `steps`, `testimonials`

(One rename happens in transit: config.js calls the testimonials array `TESTS`;
the API exposes it as `testimonials`.)

After that the database is the live copy — editing `config.js` will **not**
change what the API serves until you run `npm run seed`. The page loads
`/api/content` on startup and falls back to the literals in `config.js` if the
API is not reachable, so the site still renders on a purely static host.

## API

Base URL `/api`.

### Content

| Method | Path                   | Notes                                        |
| ------ | ---------------------- | -------------------------------------------- |
| `GET`  | `/api/content`         | All sections: `{ ok, content: { … } }`       |
| `GET`  | `/api/content/:key`    | One section: `{ ok, key, data }`             |
| `PUT`  | `/api/content/:key`    | Replace one section: body `{ "data": … }`    |

Sections are stored as JSON documents, which keeps them in the same shape the
front-end renderer already expects.

Editing by hand:

```powershell
curl.exe -X PUT http://127.0.0.1:3000/api/content/projects `
  -H "Content-Type: application/json" `
  -d "{\"data\":[{\"name\":\"New project\",\"industry\":\"Retail\",\"services\":\"Website\",\"desc\":\"…\",\"tech\":[\"React\"],\"c\":[\"#111\",\"#0f0\"],\"url\":\"\"}]}"
```

### Leads

| Method   | Path                 | Notes                                              |
| -------- | -------------------- | -------------------------------------------------- |
| `POST`   | `/api/leads`         | Create a submission from the contact form          |
| `GET`    | `/api/leads`         | List newest first. `?status=`, `?limit=`, `?offset=` |
| `GET`    | `/api/leads/stats`   | Counters for a dashboard                           |
| `GET`    | `/api/leads/:id`     | One lead                                           |
| `PATCH`  | `/api/leads/:id`     | Set status: `new`, `contacted`, `won`, `lost`      |

```powershell
curl.exe -X POST http://127.0.0.1:3000/api/leads -H "Content-Type: application/json" `
  -d '{"name":"Priya Sharma","email":"priya@example.com","service":"Website Development",
       "budget":"₹50,000 – ₹2,00,000","msg":"We need a marketing site with a booking flow."}'
```

Responses: `201` on success with `{ ok, id, message }`, `422` with a per-field
`errors` object when validation fails.

The form field for the description is named `msg` in the HTML; the API accepts
either `msg` or `message`.

### Health

`GET /api/health` → `{ ok: true, uptime }`

## Validation and spam protection

- The same rules the browser enforces are re-checked on the server, so the form
  cannot be bypassed by posting directly.
- Every field is length-capped, and the JSON body limit is 100 kb.
- A hidden `website` honeypot field sits in the form. Bots that fill it in get a
  fake success response and nothing is stored.
- Submissions are rate limited per IP.

## Lead notifications

With no SMTP settings, each new lead is printed to the server console. To email
them instead, set `SMTP_*` in `.env` (see `.env.example`) and install the
optional dependency:

```powershell
npm install nodemailer
```

A failed notification is logged but never loses the enquiry — the lead is
already stored by then.

## Securing the API

This is a marketing site, so the read endpoints are intentionally public. Two
things are **not** protected and should be before you put this on the open
internet:

1. **`PUT /api/content/:key`** lets anyone rewrite your services, projects and
   team copy. Add an auth check, or delete the route and edit the database
   through `npm run seed`.
2. **`GET /api/leads`** exposes visitor names, emails and messages. Put it
   behind a login before deploying publicly.

A minimal guard is to require a shared secret header:

```js
// server/routes/content.js
if (req.get("x-admin-token") !== process.env.ADMIN_TOKEN) {
  return res.status(401).json({ ok: false, error: "Unauthorized" });
}
```

## Deploying

The site still works on any static host (it falls back to `config.js`), so this
server is only needed for the contact form and content API. To run it as a real
service:

- Set `HOST=0.0.0.0` and put it behind a reverse proxy (nginx/Caddy) with TLS.
- **Mount `DATA_DIR` on a persistent volume** — the SQLite file is the only
  thing worth backing up. Copying `site.db` is not enough while the server is
  running, because of the WAL files; stop the server or use
  `sqlite3 site.db ".backup out.db"`.
- Persist `RATE_LIMIT_MAX` expectations if you front it with a CDN, since
  in-memory counters reset on restart and are per-instance.

## Tests

`npm test` starts a server on its own port with a temporary database and runs
`tests/api.test.js` against it, so it never touches `server/data/site.db`.

## Asset scripts

One-off helpers for preparing team photos. They are not part of the running
server — run them by hand.

| Script                  | What it does                                                       |
| ----------------------- | ------------------------------------------------------------------ |
| `imginfo.js`            | Print dimensions/aspect ratio of image files (no dependencies)     |
| `fit-team-photo.js`     | Crop any photo to the 480×480 square the team grid expects         |
| `compare-crops.js`      | Render candidate crops side by side, so you can pick the framing    |
| `brand-background.js`   | Cut the person out (remove.bg) and composite onto the brand navy    |

```powershell
# what size are these?
node scripts/imginfo.js ..\assets\photo1.jpg ..\assets\photo5.jpg

# crop to 480x480, centring on the face: focusY focusX zoom
node scripts/fit-team-photo.js portrait.jpg ..\assets\photo5.jpg 0.33 0.52 0.80

# try four framings side by side, then pick one
node scripts/compare-crops.js portrait.jpg ..\assets\_cmp.jpg 0.4,0.33,0.8 0.46,0.33,0.8 0.52,0.33,0.8

# swap the background for the card colour (needs REMOVE_BG_API_KEY)
node --env-file=.env scripts/brand-background.js portrait.jpg ..\assets\photo5.jpg 0.33 0.52 0.80
```

`focusY` / `focusX` are where the face sits, as a fraction of the image
(0 = top/left, 1 = bottom/right). `zoom` below 1 crops tighter than the full
square, which enlarges the face and hides more background.

**On backgrounds:** the site crops with `object-fit`, so any photo looks fine
dimensionally. Swapping the *content* of the background is a different job — it
needs a cut-out. `brand-background.js` uses remove.bg, which is free for 50
low-res calls per month. If you would rather not use an external service, skip
it and just crop tighter; the cards already apply their own colour treatment.