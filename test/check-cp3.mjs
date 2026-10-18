/*
  Checkpoint 3 — assertions over the PRE-RENDERED dist/index.html.

  Everything here checks the built artefact rather than the source, because that
  is what a visitor (and a social scraper) actually receives. A change that looks
  right in a .vue file but does not survive vite-ssg's render is caught here.
*/
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Resolved from this file so the suite runs identically locally and in CI. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "dist", "index.html");
const ASSETS = path.join(ROOT, "dist", "assets");
const html = fs.readFileSync(FILE, "utf8");

let pass = 0;
let fail = 0;
const failures = [];

function ok(cond, label, detail) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(label + (detail ? "  -> " + detail : ""));
  }
  console.log((cond ? "  ok   " : "  FAIL ") + label + (cond || !detail ? "" : "  (" + detail + ")"));
}

function section(name) {
  console.log("\n" + name);
}

/* ---------------------------------------------------- social preview */
section("Social preview");

const meta = {};
for (const m of html.matchAll(/<meta\s+([^>]+)>/g)) {
  const attrs = {};
  for (const a of m[1].matchAll(/([a-zA-Z:]+)="([^"]*)"/g)) attrs[a[1]] = a[2];
  const key = attrs.property || attrs.name;
  if (key) meta[key] = attrs.content;
}

const SITE = "https://mohamedezzirari.github.io/NorthwindDigital_Agency/";
const IMG = SITE + "assets/og.png";

ok(meta["og:url"] === SITE, "og:url is the canonical host", meta["og:url"]);
ok(meta["og:image"] === IMG, "og:image is ABSOLUTE and points at the card", meta["og:image"]);
ok(meta["og:image:width"] === "1200", "og:image:width", meta["og:image:width"]);
ok(meta["og:image:height"] === "630", "og:image:height", meta["og:image:height"]);
ok(meta["og:image:type"] === "image/png", "og:image:type", meta["og:image:type"]);
ok(!!meta["og:image:alt"], "og:image has alt text");
ok(!!meta["og:site_name"], "og:site_name present");
ok(meta["og:type"] === "website", "og:type is website", meta["og:type"]);
ok(meta["twitter:card"] === "summary_large_image", "twitter:card is summary_large_image", meta["twitter:card"]);
ok(meta["twitter:image"] === IMG, "twitter:image matches og:image", meta["twitter:image"]);
ok(!!meta["twitter:image:alt"], "twitter:image has alt text");
ok(!!meta["twitter:title"], "twitter:title present");
ok(!!meta["twitter:description"], "twitter:description present");

// Scrapers do not follow relative paths — every social URL must be absolute.
for (const key of ["og:url", "og:image", "twitter:image"]) {
  ok(/^https:\/\//.test(meta[key] || ""), key + " is absolute");
}

const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
ok(canonical && canonical[1] === SITE, "canonical link present and correct", canonical && canonical[1]);

/* ---------------------------------------------------------- og.png */
section("The card itself");

const card = ASSETS + "/og.png";
ok(fs.existsSync(card), "dist/assets/og.png was published");
if (fs.existsSync(card)) {
  const b = fs.readFileSync(card);
  const w = b.readUInt32BE(16);
  const h = b.readUInt32BE(20);
  ok(w === 1200 && h === 630, `card is 1200x630 (got ${w}x${h})`);
  ok(b.readUInt8(25) === 6, "card is RGBA");
  const kb = b.length / 1024;
  ok(kb < 300, `card weight ${kb.toFixed(1)} KiB is well under the 300 KiB guidance`);
  ok(kb < 5 * 1024, "card is under the hard 5 MB scrapers enforce");
}

/* ------------------------------------------------------- structured data */
section("Structured data");

const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
ok(ldBlocks.length === 1, `exactly one JSON-LD block (found ${ldBlocks.length})`);

if (ldBlocks.length === 1) {
  let schema = null;
  try {
    schema = JSON.parse(ldBlocks[0][1]);
    ok(true, "JSON-LD parses as valid JSON");
  } catch (e) {
    ok(false, "JSON-LD parses as valid JSON", e.message);
  }

  if (schema) {
    const graph = schema["@graph"] || [schema];
    const types = graph.map((n) => n["@type"]);
    ok(types.includes("Organization"), "declares an Organization");
    ok(types.includes("WebSite"), "declares a WebSite");

    const org = graph.find((n) => n["@type"] === "Organization");
    const site = graph.find((n) => n["@type"] === "WebSite");

    ok(/^https:\/\//.test(org?.logo || ""), "Organization.logo is an ABSOLUTE url", org?.logo);
    ok(org?.email === "hello@example.com", "Organization.email matches content.js", org?.email);
    ok(Array.isArray(org?.sameAs) && org.sameAs.length > 0, "Organization.sameAs present");
    ok(/^https:\/\//.test(org?.url || ""), "Organization.url is absolute", org?.url);

    // The two nodes must reference each other or they describe unrelated things.
    const orgId = org?.["@id"];
    ok(!!orgId, "Organization has an @id");
    ok(site?.isPartOf?.["@id"] === orgId, "WebSite.isPartOf points at the Organization",
      JSON.stringify(site?.isPartOf));

    // Every URL inside the schema must be absolute.
    const urls = JSON.stringify(schema).match(/"https:\/\/[^"]+"/g) || [];
    ok(urls.length >= 6, `schema carries ${urls.length} absolute urls`);
  }
}

/* ------------------------------------------------------------ skip link */
section("Skip link and landmarks");

const skip = html.match(/<a class="skip" href="#([^"]+)">([^<]+)<\/a>/);
ok(!!skip, "skip link is present in the pre-rendered HTML");
if (skip) {
  ok(skip[2].toLowerCase().includes("skip"), "skip link announces itself", skip[2]);
  const targetId = skip[1];
  const target = html.match(new RegExp(`<main id="${targetId}"([^>]*)>`));
  ok(!!target, `skip link target #${targetId} exists`);
  if (target) ok(/tabindex="-1"/.test(target[1]), "skip target is focusable (tabindex=-1)");
}

// It must be the FIRST focusable thing, or the keyboard user cannot reach it
// without walking the nav first.
const firstAnchor = html.indexOf("<a ");
const skipAt = html.indexOf('class="skip"');
ok(skipAt !== -1 && skipAt < firstAnchor + 200, "skip link precedes the other links");

ok(/<header>/.test(html), "<header> landmark present");
ok(/<main id="main"/.test(html), "<main> landmark present");
ok(/<footer>/.test(html), "<footer> landmark present");
ok(/<nav id="links"[^>]*aria-label="Main"/.test(html), "primary <nav> is labelled");

/* ------------------------------------------------------------ headings */
section("Heading order");

const headings = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g)].map((m) => ({
  level: Number(m[1]),
  text: m[2].replace(/<[^>]+>/g, "").trim().slice(0, 42),
}));

ok(headings.length > 0, `${headings.length} headings found`);
ok(headings.filter((h) => h.level === 1).length === 1, "exactly one <h1>");
ok(headings[0]?.level === 1, "the FIRST heading is the <h1>", headings[0] && `h${headings[0].level}`);

let prev = 0;
const skips = [];
for (const h of headings) {
  if (prev && h.level > prev + 1) skips.push(`h${prev} -> h${h.level} at "${h.text}"`);
  prev = h.level;
}
ok(skips.length === 0, "no heading level is skipped", skips.join("; "));

ok(!/<h4/.test(html), "footer column titles are no longer <h4> (was an h2->h4 skip)");
const footerHtml = (html.match(/<footer>[\s\S]*?<\/footer>/) || [""])[0];
const footerH2 = (footerHtml.match(/<h2/g) || []).length;
ok(footerH2 >= 3, `footer columns use <h2> (${footerH2} found)`);

/* -------------------------------------------------------------- images */
section("Images");

const imgs = [...html.matchAll(/<img\s+([^>]+)>/g)].map((m) => m[1]);
ok(imgs.length > 0, `${imgs.length} <img> elements in the rendered page`);

let noAlt = 0;
let noDims = 0;
let lazyBelowFold = 0;
for (const tag of imgs) {
  const src = (tag.match(/src="([^"]*)"/) || [])[1] || "";
  if (!/alt="[^"]*"/.test(tag)) noAlt++;
  if (!/width="/.test(tag) || !/height="/.test(tag)) noDims++;
  // The header logo is the only image that should load eagerly.
  if (/loading="lazy"/.test(tag)) lazyBelowFold++;
}
ok(noAlt === 0, "every <img> has an alt attribute", `${noAlt} missing`);
ok(noDims === 0, "every <img> declares width and height (no layout shift)", `${noDims} missing`);
ok(lazyBelowFold >= 2, `below-the-fold images are lazy (${lazyBelowFold} lazy)`, null);

// The header logo must stay eager — it is above the fold on every screen.
const headerImg = (html.match(/<header>[\s\S]*?<img\s+([^>]+)>/) || [])[1] || "";
ok(!/loading="lazy"/.test(headerImg), "header logo is NOT lazy (it is above the fold)");

/* ------------------------------------------------------------ sub-path */
section("Sub-path safety");

const localRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(#|mailto:|https?:|tel:)/.test(u));
const rootAbs = localRefs.filter((u) => u.startsWith("/"));
ok(rootAbs.length === 0, "no root-absolute src/href (would break under /NorthwindDigital_Agency/)",
  rootAbs.join(", "));

// og.png must be referenced absolutely, so it must NOT appear in the relative set.
ok(!localRefs.some((u) => u.includes("og.png")), "og.png is not referenced relatively");

/* -------------------------------------------------------------- result */
console.log("\n=============================");
console.log(`CP3: ${pass} passed, ${fail} failed`);
if (fail) {
  console.log("\nfailures:");
  for (const f of failures) console.log("  - " + f);
  process.exitCode = 1;
}
