/*
  Packs & Pricing — data plus the pure maths on top of it.

  Migrated from js/pricing.js, which split into two halves: the numbers and the
  formatting/summary helpers were pure and portable, while the rest of that file
  was imperative DOM plumbing (querySelectorAll, delegated click handlers,
  innerHTML card building). Vue replaces the plumbing entirely, so only the pure
  part survives here.

  Everything in this module is deterministic and side-effect free, which is what
  lets the same code run during pre-render in Node and again on hydration in the
  browser without the two disagreeing.
*/

export const LOCALE = "en-US";
export const CURRENCY = "USD";
export const TRIAL_DAYS = 14;

/* Code -> fraction off. The promo form upper-cases what it is given before
   looking it up, so these keys must stay upper-case. */
export const PROMOS = { NORTHWIND10: 0.1, LAUNCH15: 0.15 };

export const PLANS = [
  {
    id: "growth",
    name: "Growth",
    tagline: "The pack most clients choose.",
    monthly: 790,
    annual: 7584,
    recommended: true,
    badge: "Most popular",
    accent: "#3D4BFF",
    cta: "Start with Growth",
    limits: ["5 seats", "50 GB storage", "1M requests/mo"],
    /* Growth is the entry pack now that Starter is gone, so it carries the
       baseline promises Starter used to make (the monthly report) alongside its
       own. The old "Everything in Starter" bullet went with it — naming a pack
       that no longer exists is worse than either keeping or dropping it. */
    features: [
      "Up to 15 pages & CMS",
      "Conversion copywriting",
      "SEO & content strategy",
      "A/B testing & landing pages",
      "Monthly performance report",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For teams running serious traffic.",
    monthly: 1490,
    annual: 14304,
    recommended: false,
    badge: null,
    accent: "#0E9E7E",
    cta: "Talk to sales",
    limits: ["20 seats", "250 GB storage", "10M requests/mo"],
    features: [
      "Everything in Growth",
      "Unlimited pages & CMS",
      "Dedicated strategist",
      "Priority support (4h response)",
      "Advanced analytics & dashboards",
      "Quarterly growth roadmap",
    ],
  },
];

/* The three rows in the "at a glance" strip, as booleans per plan id so the
   template can render ticks and crosses without duplicating the copy. */
export const QUICK_COMPARE = [
  { label: "Priority support", growth: false, scale: true },
  { label: "Dedicated strategist", growth: false, scale: true },
  { label: "A/B testing", growth: true, scale: true },
];

/*
  Whole dollars lose their decimals; anything else keeps exactly two.

  The minimum matters as much as the maximum here. The original set
  minimumFractionDigits to 0 and maximumFractionDigits to 2, which lets Intl
  emit as many digits as it needs and no more — so a promo applied to annual
  billing produced "$280.8" rather than "$280.80". Pinning the minimum to 2 for
  non-whole amounts fixes that; whole amounts still render without ".00".

  The epsilon keeps binary floating-point noise (351.00000000000006) from being
  mistaken for a fractional amount.
*/
export function money(n) {
  const whole = Math.abs(n % 1) < 1e-9;
  const digits = whole ? 0 : 2;
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/* Annual is a straight 20% off, so this always returns 20 for the current data
   — but it is derived rather than hard-coded, so changing a plan's annual price
   updates every "save N%" label at once. */
export function savingsPct(plan) {
  return Math.round((1 - plan.annual / 12 / plan.monthly) * 100);
}

/*
  Price a plan for a billing cycle and a discount rate.

  gross* is the sticker price, net* is what the client pays after the promo.
  Annual figures are divided by twelve for the "per month" display; the real
  charge is netTotal, once a year.
*/
export function priceFor(plan, cycle, rate = 0) {
  const annual = cycle === "annual";
  const grossMonthly = annual ? plan.annual / 12 : plan.monthly;
  const grossTotal = annual ? plan.annual : plan.monthly;
  return {
    grossMonthly,
    netMonthly: grossMonthly * (1 - rate),
    grossTotal,
    netTotal: grossTotal * (1 - rate),
  };
}

/* The small print under each price. */
export function billingNote(plan, cycle, price, rate, promo) {
  const parts = [];
  if (cycle === "annual") {
    parts.push(
      `Billed ${money(price.netTotal)} once a year (save ${savingsPct(plan)}%)`
    );
  } else {
    parts.push(`Billed ${money(price.netTotal)} monthly, cancel anytime`);
  }
  if (rate > 0 && promo) parts.push(`promo ${promo} applied`);
  parts.push(`${TRIAL_DAYS}-day free trial`);
  return parts.join(" · ");
}
