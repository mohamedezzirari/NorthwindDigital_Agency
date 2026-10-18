/*
  The quote estimator's model.

  Pure data plus a pure function. Nothing in here touches the DOM or `window`,
  which is what lets `estimate()` run identically during the Node build (so the
  pre-rendered HTML carries the default figures) and again in the browser when
  the visitor changes a control — the two cannot disagree.

  The pricing model is deliberately separate from data/pricing.js. That file is
  the *packs*: published, fixed, third-party-looking numbers that must never move
  on their own. This file is the *estimator*: project scope in, a range out. They
  meet in exactly one place, recommendPack(), which says which published pack the
  configured project would belong to.
*/

import { BUDGETS, SITE } from "./content.js";
import { PLANS } from "./pricing.js";

/* ---------- what is being built ---------- */
export const PROJECT_TYPES = [
  {
    id: "landing",
    label: "Landing page",
    desc: "One page, built to convert a campaign.",
    base: 1400,
    weeks: 2,
    basePages: 1,
    service: "Landing Pages",
  },
  {
    id: "business",
    label: "Business website",
    desc: "The site most companies need first.",
    base: 3400,
    weeks: 5,
    basePages: 5,
    service: "Website Development",
  },
  {
    id: "ecommerce",
    label: "E-commerce store",
    desc: "Catalogue, checkout and payment flow.",
    base: 5600,
    weeks: 8,
    basePages: 8,
    service: "E-commerce Websites",
  },
  {
    id: "webapp",
    label: "Web application",
    desc: "Something custom, with accounts or data.",
    base: 9500,
    weeks: 12,
    basePages: 6,
    service: "Custom Web Applications",
  },
  {
    id: "redesign",
    label: "Redesign & optimisation",
    desc: "You have a site; make it earn more.",
    base: 2600,
    weeks: 4,
    basePages: 5,
    service: "Redesign & Optimization",
  },
];

/* ---------- optional extras ---------- */
export const ADDONS = [
  { id: "seo", label: "SEO foundation", desc: "Metadata, sitemap, speed pass", price: 900, weeks: 1 },
  { id: "content", label: "Content & copywriting", desc: "Written for every page", price: 1200, weeks: 1 },
  { id: "brand", label: "Brand & visual identity", desc: "Logo, type and colour system", price: 1800, weeks: 2 },
  { id: "analytics", label: "Analytics dashboard", desc: "Events and a reporting view", price: 700, weeks: 1 },
  { id: "cro", label: "Conversion optimisation", desc: "A/B tests on key pages", price: 1100, weeks: 1 },
];

/* ---------- what happens after launch ---------- */
export const RETAINERS = [
  { id: "none", label: "Not for now", monthly: 0 },
  { id: "social", label: "Social media", monthly: 450 },
  { id: "search", label: "Search & SEO", monthly: 750 },
  { id: "full", label: "Search, social & CRO", monthly: 1400 },
];

/* ---------- how fast ---------- */
export const SPEEDS = [
  { id: "standard", label: "Standard", desc: "Normal scheduling", multiplier: 1, weekFactor: 1 },
  { id: "fast", label: "Fast-track", desc: "Prioritised start", multiplier: 1.25, weekFactor: 0.7 },
];

/* Pages are included up to each type's own baseline; beyond that they add up. */
export const EXTRA_PAGE_PRICE = 300;
/* Roughly the size of a scope that no longer fits one week of slack. */
export const THREE_ADDON_BUFFER_WEEKS = 1;

/* Every plan these controls start on. Exported so the component's initial state
   and the pre-rendered output are guaranteed to be the same values — a mismatch
   between the two is exactly what hydration errors are made of. */
export const DEFAULT_INPUT = {
  typeId: "business",
  pages: 5,
  addonIds: [],
  retainerId: "none",
  speedId: "standard",
};

/* ---------- the maths ---------- */

function pick(list, id) {
  return list.find((item) => item.id === id) ?? list[0];
}

/* Round outward to the nearest 100 so a range reads like a quote rather than a
   spreadsheet: $4,600 – $5,800, never $4,592.23. */
function roundHundred(n) {
  return Math.round(n / 100) * 100;
}

/*
  Which published pack this project belongs to.

  Two tiers since Starter was removed, so this is a floor plus an escalation:
  anything that is not a serious engagement lands on Growth, and only a web app,
  a four-figure retainer or an $8k+ build escalates to Scale. Scope and
  marketing spend both still decide that — a small site with a full-funnel
  retainer is a bigger engagement than a large site with nothing behind it.

  The thresholds that used to split Growth from Starter went with Starter.
  Keeping them would have been dead code that still read as though the entry
  tier existed.
*/
function recommendPack({ typeId, oneoff, monthly }) {
  if (typeId === "webapp" || monthly >= 1000 || oneoff >= 8000) return "scale";
  return "growth";
}

/* The budget band a price falls into, using the SAME strings the contact form
   renders. Importing BUDGETS rather than repeating the text means the estimator
   can never select an option the <select> does not offer. */
export function budgetBandFor(oneoff) {
  if (oneoff < 2500) return BUDGETS[0];
  if (oneoff < 7500) return BUDGETS[1];
  if (oneoff < 20000) return BUDGETS[2];
  return BUDGETS[3];
}

/*
  Turn the five controls into a quote.

  Returned rather than stored: the component holds `input`, and every figure on
  screen is derived from it in one place, so nothing can drift out of sync with
  what the visitor actually chose.
*/
export function estimate(input) {
  const type = pick(PROJECT_TYPES, input.typeId);
  const speed = pick(SPEEDS, input.speedId);
  const retainer = pick(RETAINERS, input.retainerId);
  const addons = ADDONS.filter((addon) => input.addonIds.includes(addon.id));

  const pages = Math.max(type.basePages, Number(input.pages) || type.basePages);
  const extraPages = Math.max(0, pages - type.basePages);

  const subtotal =
    type.base +
    extraPages * EXTRA_PAGE_PRICE +
    addons.reduce((sum, addon) => sum + addon.price, 0);

  const oneoff = Math.round(subtotal * speed.multiplier);

  const rawWeeks =
    type.weeks +
    Math.ceil(extraPages / 5) +
    addons.reduce((sum, addon) => sum + addon.weeks, 0) +
    (addons.length >= 3 ? THREE_ADDON_BUFFER_WEEKS : 0);

  const weeks = Math.max(1, Math.round(rawWeeks * speed.weekFactor));

  const packId = recommendPack({ typeId: type.id, oneoff, monthly: retainer.monthly });

  return {
    type,
    speed,
    retainer,
    addons,
    pages,
    extraPages,
    oneoff,
    low: roundHundred(oneoff * 0.85),
    high: roundHundred(oneoff * 1.15),
    weeks,
    monthly: retainer.monthly,
    packId,
    /* The published name rather than the id: "Growth" reads on screen, "growth"
       does not. Resolved through PLANS so the label follows any rewording. */
    packName: PLANS.find((plan) => plan.id === packId)?.name ?? packId,
    budget: budgetBandFor(oneoff),
  };
}

/*
  The visitor-facing summary.

  Written for two jobs: the "copy" button, and the enquiry form's message box.
  It is plain text on purpose — it has to paste cleanly into an email.

  Numbered lines rather than prose so the numbers survive being re-read.
*/
export function summaryFor(est) {
  const lines = [
    `Instant estimate from ${SITE.name} — please treat as a starting point, not a quote.`,
    "",
    `Project: ${est.type.label}, ${est.pages} page${est.pages === 1 ? "" : "s"}`,
  ];

  if (est.extraPages) lines.push(`  beyond the ${est.type.basePages} included: ${est.extraPages}`);

  lines.push(`Add-ons: ${est.addons.length ? est.addons.map((a) => a.label).join(", ") : "none"}`);
  lines.push(`Turnaround: ${est.speed.label} (${est.weeks} week${est.weeks === 1 ? "" : "s"})`);
  lines.push(`One-off build: $${est.low.toLocaleString("en-US")} – $${est.high.toLocaleString("en-US")}`);
  lines.push(
    est.monthly
      ? `Marketing after launch: $${est.monthly.toLocaleString("en-US")}/month`
      : "Marketing after launch: none"
  );

  /* Carried through the estimate rather than looked up again here, so the data
     and the copy can never name different packs. */
  lines.push(`Closest pack: ${est.packName}`);
  return lines.join("\n");
}
