/* Checkpoint 1 verification: inspect the PRE-RENDERED dist/index.html.
   Everything here is a claim about what a visitor gets with JavaScript never
   running, which is the interesting case on a static host. */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Resolved from this file rather than from the working directory, so the suite
   behaves identically on a developer machine and on the CI runner no matter
   where the repository was checked out or what the shell's cwd happens to be. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const html = readFileSync(path.join(ROOT, "dist", "index.html"), "utf8");

let pass = 0;
let fail = 0;
function check(label, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  ok   ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}${detail ? "  -> " + detail : ""}`);
  }
}
function count(re) {
  return (html.match(re) || []).length;
}

console.log("\n-- section landmarks --");
for (const id of ["home", "services", "projects", "team", "about", "process", "testimonials", "pricing", "contact"]) {
  check(`#${id} present`, html.includes(`id="${id}"`));
}
check("nav #links present", html.includes('id="links"'));
check("nav #menu present", html.includes('id="menu"'));
check("carousel #proj present", html.includes('id="proj"'));
check("form #status present", html.includes('id="status"'));

console.log("\n-- rendered counts --");
const svcCards = count(/<article class="card">/g);
check("14 service cards", svcCards === 14, `got ${svcCards}`);
const shots = count(/class="shot"/g);
check("6 project cards", shots === 6, `got ${shots}`);
const tp = count(/class="tp"/g);
check("6 team members", tp === 6, `got ${tp}`);
const plans = count(/<li class="plan/g);
check("3 pricing plans", plans === 3, `got ${plans}`);
const steps = count(/<li><h3>/g);
check("6 process steps", steps === 6, `got ${steps}`);
const quotes = count(/<blockquote/g);
check("3 testimonials", quotes === 3, `got ${quotes}`);
const checks = count(/class="pr-ico"/g);
check("15 feature ticks (4+5+6)", checks === 15, `got ${checks}`);
const limitPills = count(/class="plan__limits"/g);
check("3 limit lists", limitPills === 3, `got ${limitPills}`);

console.log("\n-- pricing values (monthly, no promo) --");
for (const price of ["$390", "$790", "$1,490"]) {
  check(`price ${price}`, html.includes(`>${price}<`), "not found");
}
check("all 'was' prices hidden while monthly", count(/class="plan__was" hidden/g) === 3, `got ${count(/class="plan__was" hidden/g)}`);
check("plan accents bound inline", ["#555a7a", "#3D4BFF", "#0E9E7E"].every((c) => html.includes(c)));

console.log("\n-- relative urls only (sub-path safe) --");
const absoluteRefs = [...html.matchAll(/(?:src|href)="(\/[^"]*)"/g)].map((m) => m[1]);
check("no root-absolute src/href", absoluteRefs.length === 0, absoluteRefs.join(", "));
check("favicon is relative", html.includes('href="./favicon.svg"') || html.includes('href="favicon.svg"'));
check("logo is relative", html.includes('src="assets/logo.png"'));
check("project images relative", count(/url\('assets\/project-\d\.webp'\)/g) === 6, `got ${count(/url\('assets\/project-\d\.webp'\)/g)}`);
check("team photos relative", count(/src="assets\/photo\d\.jpg"/g) === 6, `got ${count(/src="assets\/photo\d\.jpg"/g)}`);

console.log("\n-- glyph integrity --");
for (const [name, ch] of [["em dash", "\u2014"], ["en dash", "\u2013"], ["right single quote", "\u2019"], ["middle dot", "\u00B7"], ["copyright", "\u00A9"], ["tick", "\u2713"], ["cross", "\u2715"], ["left arrow", "\u2190"], ["right arrow", "\u2192"], ["menu glyph", "\u2630"]]) {
  check(`${name} U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`, html.includes(ch));
}
check("no mojibake marker (O-circumflex)", !html.includes("\u00D4"));

console.log("\n-- currency consistency --");
check("budget bands are USD", html.includes("Under $2,500") && html.includes("$20,000+"));
check("no rupee sign anywhere in the page", !html.includes("\u20B9"));

console.log("\n-- leftovers from the old build --");
check("no link to css/styles.css", !html.includes("css/styles.css"));
check("no script tag for js/config.js", !html.includes("js/config.js"));
check("no script tag for js/main.js", !html.includes("js/main.js"));
check("no script tag for js/pricing.js", !html.includes("js/pricing.js"));
check("no base64 data: junk in markup", !html.includes("data:image/jpeg;base64"));
check("honeypot field removed", !html.includes('name="website"'));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
