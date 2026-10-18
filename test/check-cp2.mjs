/*
  Checkpoint 2 structural assertions against the pre-rendered dist/index.html.
  Run:  npm test        (or: node test/check-cp2.mjs, from anywhere)
*/
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(ROOT, "dist", "index.html"), "utf8");

const between = (a, b) => {
  const i = html.indexOf(a);
  if (i === -1) return null;
  const j = html.indexOf(b, i);
  return j === -1 ? null : html.slice(i, j);
};

const hero = between('<section id="home"', '<div class="marq"');

let pass = 0;
const fails = [];

function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fails.push(name + (detail ? "  -> " + detail : ""));
    console.log(`  FAIL ${name}`);
  }
}
  if (cond) pass += 1;
  else fails.push(`${name}${detail ? ` — ${detail}` : ""}`);
}
function eq(name, actual, expected) {
  check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function has(name, hay, needle) {
  check(name, hay.includes(needle), `missing ${JSON.stringify(needle)}`);
}
function count(name, hay, needle, expected) {
  const n = hay.split(needle).length - 1;
  eq(name, n, expected);
}

/* ---------- the section exists and is correctly labelled ---------- */
check("skip link and anchors intact", html.includes('id="main"'));

/* ---------- ordering: packs, then estimator, then enquiry ---------- */

check(
  "order: pricing comes before the estimator",
  html.indexOf('id="pricing"') !== -1 &&
    html.indexOf('REMOVEDQUOTE') !== -1 &&
    html.indexOf('id="pricing"') < html.indexOf('REMOVEDQUOTE')
);
check(
  "order: estimator comes before contact",
  html.indexOf('REMOVEDQUOTE') !== -1 &&
    html.indexOf('id="contact"') !== -1 &&
    html.indexOf('REMOVEDQUOTE') < html.indexOf('id="contact"')
);

/* ---------- reachability ---------- */

check("hero links remain", hero !== null);

/* ---------- the five questions are real form controls ---------- */

count("form: five fieldsets", quote, '<fieldset class="qz-group">', 5);
eq("form: five numbered legends", (hay class="qz-legend">[1-5] · /g) || []).length, 5);
for (const n of [1, 2, 3, 4, 5]) {
  check(`form: legend ${n} present`, hay · `));
}

/* group 1: five project types, one checked */
count("types: five radios", quote, 'name="qz-type"', 5);
has("types: default is business", quote, 'name="qz-type" value="business" checked=""');
eq("types: exactly one checked", (hay || []).length, 1);

/* group 2: the page slider */
has("pages: range input", quote, 'id="qz-pages" class="qz-range" type="range"');
has("pages: min 1", quote, 'min="1"');
has("pages: max 30", quote, 'max="30"');
has("pages: step 1", quote, 'step="1"');
has("pages: default value 5", quote, 'type="range" min="1" max="30" step="1" value="5"');
has("pages: hint wired up", quote, 'id="qz-pages-hint"');
has("pages: described by its hint", quote, 'aria-describedby="qz-pages-hint"');
has("pages: hint states the baseline", quote, "5 pages, all included.");

/* group 3: five add-on checkboxes */
count("addons: five checkboxes", quote, '<input type="checkbox" value="', 5);
eq("addons: none pre-checked", (hay type="checkbox" value="[^"]*" checked/g) || []).length, 0);
has("addons: priced on the chip", quote, "+$1,800");
has("addons: marks itself optional", quote, "Optional. Each one adds scope");

/* group 4: four retainers */
count("retainers: four radios", quote, 'name="qz-retainer"', 4);
has("retainers: default is none", quote, 'name="qz-retainer" value="none" checked=""');
has("retainer: full funnel priced", quote, "$1,400/mo");

/* group 5: two speed tiers */
count("speeds: two radios", quote, 'name="qz-speed"', 2);
has("speeds: default is standard", quote, 'name="qz-speed" value="standard" checked=""');
has("speeds: fast-track offered", quote, 'name="qz-speed" value="fast"');

/* ---------- the pre-rendered default figures ---------- */

has("default: price range stated", quote, "$2,900 – $3,900");
has("default: timeline stated", quote, "5 weeks");
has("default: pack stated", quote, 'class="qz-pack__name">Growth');
has("default: marketing stated as none", quote, "<strong>none</strong>");
has("default: eyebrow", quote, "Instant estimate");

/* the textarea carries the same numbers the card shows */
const summary = html.slice(html.indexOf('id="qz-summary"'), html.indexOf("</textarea>", html.indexOf('id="qz-summary"')));
has("summary: pre-filled in the box", summary, "Instant estimate from Northwind Digital");
has("summary: not a quote", summary, "not a quote");
has("summary: project line", summary, "Project: Business website, 5 pages");
has("summary: add-ons line", summary, "Add-ons: none");
has("summary: turnaround line", summary, "Turnaround: Standard (5 weeks)");
has("summary: price line", summary, "One-off build: $2,900 – $3,900");
has("summary: pack line", summary, "Closest pack: Growth");

/* ---------- assistive technology ---------- */

has("a11y: live region on the price", quote, 'class="qz-total" aria-live="polite" aria-atomic="true"');
check(
  "a11y: live region is NOT on the whole card",
  !hay hay summary has a label", quote, 'class="qz-summary-label" for="qz-summary"');
has("a11y: reset says what it does", quote, ">Reset<");
has("a11y: disclaimer present", quote, "A starting point, not a hay ---------- no-JS degradation ---------- */

/* Every control is a native input, so the form still submits-meaningfully and
   still reads correctly with scripting off. */
check("no-js: no inline event handlers", !hay no script tag inside the section", !hay  "no-js: controls are native inputs",
  (hay /g) || []).length === 17
);

/* ---------- relative urls only (sub-path safe) ---------- */

check("urls: no root-absolute href in the estimator", !/(href|src)="\/(?!\/)/.test(quote));
check("urls: no root-absolute url in the estimator css", !/url\(\/(?!\/)/.test(css));

/* ---------- glyph integrity in the new markup ---------- */

has("glyph: en dash in the range", quote, "–");
has("glyph: middle dot in the legends", quote, "·");
has("glyph: em dash in the lead", quote, "—");
has("glyph: copyright untouched", html, "\u00A9");
check("glyph: no mojibake marker in the estimator", !hay no replacement chars", !hay ampersand escaped", quote, "&amp;");

/* ---------- the stylesheet actually covers what the markup uses ---------- */

const used = [...new Set((hay || []).map((m) => m.slice(7, -1)))]
  .flatMap((c) => c.split(/\s+/))
  .filter((c) => c.startsWith("qz-") || c === "qz");
for (const cls of used) {
  check(`css: .${cls} styled`, css.includes(`.${cls}{`) || css.includes(`.${cls},`) || css.includes(`.${cls}:`) || css.includes(`.${cls} `) || css.includes(`.${cls}\n`));
}
has("css: checked-chip styling uses :has()", css, ".qz-chip:has(input:checked)");
has("css: focus styling uses :has()", css, ".qz-chip:has(input:focus-visible)");
/* Every grid in this block must clamp its tracks with minmax(0, ...). A bare
   `1fr` track has an auto minimum, which is exactly what let a long word push
   the page 44px wider than the viewport before. auto-fit grids use
   min(...,100%) ideal widths so they can fall to one column instead of
   squeezing three across. */
const qzRules = (css.match(/\.qz[^{]*\{[^}]*\}/g) || []).join("\n");
const gridTracks = [...qzRules.matchAll(/grid-template-columns:([^;]+)/g)].map((m) => m[1].trim());
check("css: this block declares at least two grid layouts", gridTracks.length >= 2);
for (const track of gridTracks) {
  const safe = track.includes("minmax(0,") || track.includes("repeat(auto-fit,minmax(min(");
  check(`css: clamped grid track — ${track}`, safe);
}

/* ---------- report ---------- */

if (fails.length) {
  console.error(`\nFAIL  ${fails.length} assertion(s) failed, ${pass} passed\n`);
  for (const f of fails) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`OK  ${pass} checkpoint 2 structural assertions passed`);
