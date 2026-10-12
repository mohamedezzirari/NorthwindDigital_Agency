# Northwind Digital — website

A one-page marketing site for a web development & digital marketing agency.

Plain **HTML + CSS + JavaScript** on the front end, with an optional
**Node + Express + SQLite** backend for the contact form and content API. No
build step and no framework.

## Structure

```
index.html          page markup (content/sections)
css/styles.css      all styling (dark cinematic theme, responsive)
js/config.js        EDIT THIS: business info + all content (services, projects, team, FAQs...)
js/main.js          rendering + interactions (menu, project slider, form)
server/             optional backend: contact form API + content API (see server/README.md)
assets/             logo and team photos (extracted from the original single file)
```

## Run it

### With the backend (recommended)

```powershell
cd server
npm install
npm start
```

Then open <http://127.0.0.1:3000>. The contact form posts to the API instead of
opening the visitor's email app, and the page content is served from SQLite.

### Without the backend (plain static)

Just open `index.html` in a browser, or serve the folder statically:

```powershell
npx serve .        # or: npx http-server .
```

The page detects that no API is available and falls back to the content in
`js/config.js`; the contact form reverts to opening the visitor's email app.
Either way the site still works, and it can be deployed to any static host
(Netlify, Vercel, Cloudflare Pages, GitHub Pages) by dragging the folder over.

## Editing content

Almost everything you'd want to change lives in `js/config.js`:

- `CONFIG` — agency name, contact email, WhatsApp number, social links.
- `SERVICES` — services grouped by category.
- `PROJECTS` — work/portfolio cards.
- `TEAM` — team members (grouped automatically by `group`).
- `WHY`, `STEPS`, `TESTS` — "why us" points, process steps, testimonials.
- `API_BASE` — where the backend lives. Defaults to the page's own origin;
  set it to `""` to force purely static mode.

**With the backend running**, that content is copied into SQLite on first boot
and the page reads it from `/api/content`. `js/config.js` stays the source of
truth for the initial copy; after that, update content through the API (see
`server/README.md`) or run `cd server && npm run seed` to reset it from the file.

## Turning the contact form into a real submission

Handled automatically when the backend is running. If you'd rather use a
third-party service (Formspree, Web3Forms), set `FORM_ENDPOINT` in
`js/config.js`:

```js
const FORM_ENDPOINT = "https://formspree.io/f/yourid";
```

It's used only when no backend is reachable.

## Notes

- Colors/theme are defined as CSS variables at the top of `css/styles.css`.
- The backend requires Node 22.5+ (it uses the built-in `node:sqlite`, so
  there is no native module to compile).
- The original single-file version is preserved at `original-single-file.html`.
- See `server/README.md` for the API reference and deployment notes.
