/*
  Unit tests for the instant quote estimator's model.

  The point of these is the property that makes pre-rendering safe: estimate()
  is pure. Same input, same output, in Node and in the browser, every time.
  A hydration mismatch would show up as a console error and a flicker, and the
  only defence is that there is one source of truth for "what the defaults
  cost".

  Run:  npm test        (or: node test/test-estimator.mjs, from anywhere)

  The imports below are RELATIVE on purpose. They were absolute file URLs naming
  one machine's path, which works locally and fails on any other machine —
  including the CI runner, where it surfaced as ERR_MODULE_NOT_FOUND. See the
  portability pre-flight in run-all.mjs, which now guards against exactly this.
*/
import {
  ADDONS,
  DEFAULT_INPUT,
  EXTRA_PAGE_PRICE,
  PROJECT_TYPES,
  RETAINERS,
  SPEEDS,
  budgetBandFor,
  estimate,
  summaryFor,
} from "../src/data/estimator.js";
import { BUDGETS, SERVICE_NAMES } from "../src/data/content.js";
import { PLANS } from "../src/data/pricing.js";

let pass = 0;
const fails = [];

function check(name, cond, detail = "") {
  if (cond) {
    pass += 1;
  } else {
    fails.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function eq(name, actual, expected) {
  check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

const def = estimate(DEFAULT_INPUT);

/* ---------- defaults ---------- */

eq("default: business website", def.type.id, "business");
eq("default: pages stay at the baseline", def.pages, 5);
eq("default: no extra pages billed", def.extraPages, 0);
eq("default: no add-ons", def.addons.length, 0);
eq("default: standard speed", def.speed.id, "standard");
eq("default: no retainer", def.monthly, 0);

/* business = 3400, standard = x1 => oneoff 3400; low = round(2890)=2900,
   high = round(3910)=3900 */
eq("default: one-off", def.oneoff, 3400);
eq("default: low bound", def.low, 2900);
eq("default: high bound", def.high, 3900);
eq("default: timeline", def.weeks, 5);
eq("default: recommended pack", def.packId, "growth");
eq("default: pack display name", def.packName, "Growth");
eq("default: budget band", def.budget, BUDGETS[1]);

/* ---------- purity: identical input, identical output ---------- */
const again = estimate({ ...DEFAULT_INPUT, addonIds: [] });
eq("pure: repeat is identical", JSON.stringify(again), JSON.stringify(def));

const frozen = estimate(Object.freeze({ ...DEFAULT_INPUT, addonIds: [] }));
eq("pure: does not mutate its input", frozen.oneoff, 3400);

/* ---------- extra pages ---------- */
const morePages = estimate({ ...DEFAULT_INPUT, pages: 12 });
eq("pages: 12 pages bills 7 extra", morePages.extraPages, 7);
eq("pages: extra priced at $300 each", morePages.oneoff, 3400 + 7 * EXTRA_PAGE_PRICE);
eq("pages: weeks grow with scope", morePages.weeks, 5 + Math.ceil(7 / 5));

const fewerPages = estimate({ ...DEFAULT_INPUT, pages: 2, typeId: "business" });
eq("pages: below baseline still bills baseline", fewerPages.oneoff, 3400);
eq("pages: below baseline reports 0 extra", fewerPages.extraPages, 0);

/* ---------- add-ons ---------- */
const withAddons = estimate({ ...DEFAULT_INPUT, addonIds: ["seo", "analytics"] });
eq("addons: sum added", withAddons.oneoff, 3400 + 900 + 700);
eq("addons: weeks added", withAddons.weeks, 5 + 1 + 1);
eq("addons: count", withAddons.addons.length, 2);

/* 5 base + 1+1+1 for the three add-ons, plus one week of coordination slack
   that only appears once three separate workstreams overlap. */
const threeAddons = estimate({ ...DEFAULT_INPUT, addonIds: ["seo", "analytics", "cro"] });
eq("addons: three clear the coordination buffer", threeAddons.weeks, 5 + 1 + 1 + 1 + 1);

/* the buffer is genuinely extra: three add-ons take longer than the sum of
   their individual estimates */
const twoAddons = estimate({ ...DEFAULT_INPUT, addonIds: ["seo", "analytics"] });
check(
  "addons: buffer only starts at three",
  threeAddons.weeks > twoAddons.weeks + 1
);

const unknownAddon = estimate({ ...DEFAULT_INPUT, addonIds: ["not-real"] });
eq("addons: unknown ids are ignored, not crashed", unknownAddon.oneoff, 3400);

/* ---------- speed ---------- */
const fast = estimate({ ...DEFAULT_INPUT, speedId: "fast" });
eq("fast: +25% on the price", fast.oneoff, Math.round(3400 * 1.25));
eq("fast: weeks multiplied by 0.7", fast.weeks, Math.round(5 * 0.7));

/* ---------- retainers ---------- */
const social = estimate({ ...DEFAULT_INPUT, retainerId: "social" });
eq("retainer: monthly carried through", social.monthly, 450);
eq("retainer: monthly does not touch the one-off", social.oneoff, 3400);

const fullFunnel = estimate({ ...DEFAULT_INPUT, retainerId: "full" });
eq("retainer: full funnel escalates the pack", fullFunnel.packId, "scale");

/* ---------- pack recommendation ---------- */
const landing = estimate({ ...DEFAULT_INPUT, typeId: "landing" });
eq("pack: landing page is small enough for starter", landing.packId, "starter");

const app = estimate({ ...DEFAULT_INPUT, typeId: "webapp" });
eq("pack: web app always scales", app.packId, "scale");

/* every pack name must be a real published plan name */
for (const id of ["starter", "growth", "scale"]) {
  const name = PLANS.find((p) => p.id === id)?.name;
  check(`pack: ${id} resolves to a published plan`, typeof name === "string" && name.length > 0);
}

/* ---------- budget bands ---------- */
eq("band: exact 2500 boundary is the second band", budgetBandFor(2500), BUDGETS[1]);
eq("band: exact 7500 boundary is the third band", budgetBandFor(7500), BUDGETS[2]);
eq("band: exact 20000 boundary is the top band", budgetBandFor(20000), BUDGETS[3]);
eq("band: just under 2500 is the first band", budgetBandFor(2499), BUDGETS[0]);
eq("band: just under 7500 is the second band", budgetBandFor(7499), BUDGETS[1]);
eq("band: just under 20000 is the third band", budgetBandFor(19999), BUDGETS[2]);

/* the estimator must only ever pick a band the contact form actually offers */
eq("band: four bands exist", BUDGETS.length, 4);
for (const band of [budgetBandFor(0), budgetBandFor(5000), budgetBandFor(30000)]) {
  check("band: value is one of the form's options", BUDGETS.includes(band), band);
}

/* ---------- every service name must be a real <option> ---------- */
for (const type of PROJECT_TYPES) {
  check(
    `service: "${type.service}" is offered by the contact form`,
    SERVICE_NAMES.includes(type.service)
  );
}

/* ---------- summary text ---------- */
const summary = summaryFor(def);
check("summary: names the company", summary.includes("Northwind Digital"));
check("summary: says it is not a quote", summary.includes("not a quote"));
check("summary: states the project type", summary.includes("Business website"));
check("summary: states the page count", summary.includes("5 pages"));
check("summary: says no add-ons", summary.includes("Add-ons: none"));
check("summary: states the timeline", summary.includes("5 weeks"));
check("summary: states the price range", summary.includes("$2,900 – $3,900"));
check("summary: states no marketing", summary.includes("Marketing after launch: none"));
check("summary: names the pack", summary.includes("Closest pack: Growth"));
check("summary: ends without a trailing newline", !summary.endsWith("\n"));

const summaryAddons = summaryFor(withAddons);
check("summary: lists chosen add-ons", summaryAddons.includes("SEO foundation, Analytics dashboard"));
check("summary: drops the extra-page line when there are none", !summaryFor(def).includes("beyond the"));

/* ---------- formatting ---------- */
eq("format: extra page price is a round $300", EXTRA_PAGE_PRICE, 300);
check(
  "format: every range is rounded to a whole hundred",
  [def, morePages, fast, app].every((e) => e.low % 100 === 0 && e.high % 100 === 0)
);
check(
  "format: low is always below high",
  [def, morePages, fast, app, social].every((e) => e.low < e.high)
);

/* ---------- model sanity ---------- */
eq("model: five project types", PROJECT_TYPES.length, 5);
eq("model: five add-ons", ADDONS.length, 5);
eq("model: four retainers", RETAINERS.length, 4);
eq("model: two speed tiers", SPEEDS.length, 2);
check("model: defaults are a complete input", typeof estimate(DEFAULT_INPUT).packName === "string");

/* ---------- report ---------- */
if (fails.length) {
  console.error(`FAIL  ${fails.length} assertion(s) failed, ${pass} passed\n`);
  for (const f of fails) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`OK  ${pass} estimator assertions passed`);
