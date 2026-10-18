# Northwind Digital — website

A one-page marketing site for a web development & digital marketing agency, built
to be **interactive rather than a brochure**. The centrepiece is an **instant
quote estimator**: a visitor answers five questions about their project and gets
a real price range, a timeline and a pack recommendation before they ever make
contact.

**Live:** <https://mohamedezzirari.github.io/NorthwindDigital_Agency/>

## Stack

| | |
|---|---|
| Framework | Vue 3 |
| Build | Vite + [vite-ssg](https://github.com/antfu/vite-ssg) (static pre-render) |
| Styling | Plain CSS, no framework — `src/styles/main.css` is the design system |
| Backend | **None.** The old Express + SQLite server has been deleted |

Everything ships as static files, so it runs on any free static host. The
contact form falls back to `mailto:`; there is nothing to receive a POST.

## Quick start

```powershell
npm install
npm run dev        # development server
npm run build      # pre-render to dist/
npm run preview    # serve dist/ on http://localhost:4173/index.html
npm test           # 330 assertions against dist/
```

`npm test` inspects the **built** output rather than the sources, so run the
build first. It is the same check the deploy workflow gates on.

> The preview URL needs the `/index.html` path. `vite preview` does directory
> index resolution the same way a static host does, and a bare `/` returns the
> parent directory listing instead.

Requires **Node 22.12+**.

## Structure

```
index.html              document head: meta, social tags, JSON-LD
public/assets/          images, copied to the build untouched
src/
  data/
    content.js          EDIT THIS: services, projects, team, process, testimonials
    pricing.js          the three packs, promos, and the money helpers
    estimator.js        the quote model — and the pure estimate() function
    icons.js            inline SVG for the service cards
  lib/
    quote.js            shared state between the estimator and the contact form
    avatar.js           initials-tile fallback + intrinsic image sizes
    analytics.js        a no-op event shim for an existing tag setup
  components/
    layout/             header, footer
    sections/           one file per section of the page
    ui/                 icons
  pages/HomePage.vue    the section order — the page's shape in one file
  styles/main.css       the design system
test/                   assertion suites (node test/run-all.mjs)
scripts/make-og.mjs     generates the social card
```

### Editing content

Almost everything you would want to change lives in `src/data/`:

- `content.js` — contact details, nav, services, projects, team, "why us",
  process steps, testimonials, stats.
- `pricing.js` — the three packs, their prices and features, plus any promo.
- `estimator.js` — the quote model: project types, add-ons, retainers, speeds
  and the price bands.

Contact details are still the placeholders the site ships with
(`hello@example.com`, WhatsApp `212600000000`, a generic Facebook URL). They are
declared once in `SITE` and every mailto, WhatsApp link and social link follows.

## The quote estimator

The estimator is deliberately **data, not components**. `src/data/estimator.js`
holds the whole model plus a pure `estimate()` function that takes an input
object and returns a price range, a timeline, a budget band and a recommended
pack. There is no DOM access anywhere in it, which is why it can be asserted
directly — `test/test-estimator.mjs` runs 71 cases against the maths with no
build required.

It meets the pricing section only through `recommendPack()`, so the published
packs and the visitor's own number can be compared without either one
hard-coding the other.

The form hands its result to the contact section through a single shared ref in
`src/lib/quote.js`. It pre-fills the service, budget and message — and
deliberately leaves name and email alone, so the visitor is never handed a form
they did not ask for.

Every control is a real `<input>` inside a `<fieldset>`, so the section states a
sensible default price with JavaScript unavailable. That claim is what
`test/check-cp2.mjs` is there to defend.

## The social card

`og:image` points at `public/assets/og.png`, a 1200×630 card generated from the
site's own design tokens. It is produced by `npm run og:build` rather than
hand-made, so it cannot drift from the palette:

```powershell
npm run og:build    # regenerate
npm run og:check    # round-trip decode and verify
```

The generator needs no image library — PNG is zlib with a framing layer, so it
decodes the wordmark and encodes the card with Node's built-ins alone.

## How it deploys

`.github/workflows/deploy-pages.yml` builds, tests and publishes `dist/` to
GitHub Pages on every push to `main`. Pages must be set to **GitHub Actions** as
its source (repo *Settings → Pages*).

Two decisions worth knowing about:

- **No `actions/configure-pages` step.** That step calls the Pages API, which is
  where the `Resource not accessible by integration` error comes from. It is also
  useless here — see the next point.
- **`base: "./"`** in `vite.config.js`, so every asset reference is relative and
  the site works from a sub-path (`/NorthwindDigital_Agency/`) as happily as from
  a domain root. This is also why images are written as plain relative strings in
  `src/data/` rather than imported through the bundler: importing hashes the
  filename, and the pre-rendered HTML and the client bundle then disagree about
  the URL, which breaks images whenever JavaScript is unavailable.

## Why no router

It is a single page whose navigation is fragment links (`#services`), not routes.
`vite-ssg/single-page` pre-renders one document and hydrates it. Adding
vue-router purely to describe one route would add weight and a base-path problem
on sub-path hosts without buying anything. When a second page appears, `App.vue`
is the file that grows.
