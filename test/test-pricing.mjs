/* Exercise the pure pricing maths directly, in Node, with no DOM.
   These are the numbers a client reads, so they are worth pinning down: if a
   price, a percentage or a rounding rule changes, this fails loudly.

   The import is RELATIVE rather than an absolute file URL, so the suite runs on
   any machine and not just the one it was written on. */
import {
  PLANS,
  PROMOS,
  QUICK_COMPARE,
  TRIAL_DAYS,
  billingNote,
  money,
  priceFor,
  savingsPct,
} from "../src/data/pricing.js";

let pass = 0;
let fail = 0;
function eq(label, actual, expected) {
  if (actual === expected) {
    pass++;
    console.log(`  ok   ${label} = ${JSON.stringify(actual)}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}\n         actual   ${JSON.stringify(actual)}\n         expected ${JSON.stringify(expected)}`);
  }
}

const byId = Object.fromEntries(PLANS.map((p) => [p.id, p]));

console.log("\n-- formatting --");
eq("money(390)", money(390), "$390");
eq("money(1490)", money(1490), "$1,490");
eq("money(14304)", money(14304), "$14,304");
eq("money(280.8) keeps cents", money(280.8), "$280.80");
eq("money(1192)", money(1192), "$1,192");

console.log("\n-- annual discount is exactly 20% on every plan --");
for (const plan of PLANS) {
  eq(`savingsPct(${plan.id})`, savingsPct(plan), 20);
}

console.log("\n-- monthly equivalents of the annual prices --");
eq("growth  annual/12", priceFor(byId.growth, "annual").grossMonthly, 632);
eq("scale   annual/12", priceFor(byId.scale, "annual").grossMonthly, 1192);

console.log("\n-- monthly pricing, no promo --");
eq("growth netMonthly", priceFor(byId.growth, "monthly").netMonthly, 790);
eq("growth netTotal", priceFor(byId.growth, "monthly").netTotal, 790);
eq(
  "growth note",
  billingNote(byId.growth, "monthly", priceFor(byId.growth, "monthly"), 0, null),
  "Billed $790 monthly, cancel anytime · 14-day free trial"
);

console.log("\n-- annual pricing, no promo --");
eq("growth annual netTotal", priceFor(byId.growth, "annual").netTotal, 7584);
eq(
  "growth annual note",
  billingNote(byId.growth, "annual", priceFor(byId.growth, "annual"), 0, null),
  "Billed $7,584 once a year (save 20%) · 14-day free trial"
);
eq(
  "scale annual note",
  billingNote(byId.scale, "annual", priceFor(byId.scale, "annual"), 0, null),
  "Billed $14,304 once a year (save 20%) · 14-day free trial"
);

console.log("\n-- promo --");
eq("NORTHWIND10 rate", PROMOS.NORTHWIND10, 0.1);
eq("LAUNCH15 rate", PROMOS.LAUNCH15, 0.15);
const promoPrice = priceFor(byId.growth, "monthly", PROMOS.NORTHWIND10);
eq("growth with NORTHWIND10 netMonthly", promoPrice.netMonthly, 711);
eq(
  "growth promo note",
  billingNote(byId.growth, "monthly", promoPrice, PROMOS.NORTHWIND10, "NORTHWIND10"),
  "Billed $711 monthly, cancel anytime · promo NORTHWIND10 applied · 14-day free trial"
);
eq(
  "no promo mentioned when rate is 0",
  billingNote(byId.growth, "monthly", priceFor(byId.growth, "monthly"), 0, "NORTHWIND10").includes("promo"),
  false
);

console.log("\n-- shape / invariants --");
eq("two plans", PLANS.length, 2);
eq("the removed starter pack is really gone", "starter" in byId, false);
/* A compare row missing a plan's key would render as a silent ✕ in the strip —
   mark() turns anything falsy into a cross — so the absence has to be loud here. */
eq(
  "every compare row carries a key per plan",
  QUICK_COMPARE.every((row) => PLANS.every((plan) => plan.id in row)),
  true
);
eq("exactly one recommended", PLANS.filter((p) => p.recommended).length, 1);
eq("recommended is growth", PLANS.find((p) => p.recommended).id, "growth");
eq("one badge", PLANS.filter((p) => p.badge).length, 1);
eq("trial days", TRIAL_DAYS, 14);
eq("compare rows", QUICK_COMPARE.length, 3);

/* The "was" price is shown only when a promo applies, and it must never be
   LOWER than the net price — that would read as a price increase. */
console.log("\n-- gross is always >= net --");
for (const plan of PLANS) {
  for (const cycle of ["monthly", "annual"]) {
    for (const rate of [0, PROMOS.NORTHWIND10, PROMOS.LAUNCH15]) {
      const p = priceFor(plan, cycle, rate);
      eq(`${plan.id}/${cycle}/${rate} gross>=net`, p.grossMonthly >= p.netMonthly - 1e-9, true);
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
