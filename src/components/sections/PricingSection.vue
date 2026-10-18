<script setup>
/*
  Packs & Pricing.

  The old js/pricing.js drove this by querying for [data-price-for] style hooks
  and rewriting textContent on every state change. Here the state is two refs and
  the prices are computed from them, so there is nothing to keep in sync by hand
  and no DOM query to go stale.

  The math itself is not reimplemented: it comes from data/pricing.js, unchanged
  from the old file, so the numbers clients see cannot drift.

  Accessibility notes carried over deliberately:
    - the billing switch is a button group with aria-pressed, not a fake toggle;
    - the promo validation message is a role="status" live region;
    - a separate visually-hidden live region announces the cycle change, because
      swapping the prices does not announce itself.
*/
import { computed, nextTick, ref } from "vue";
import {
  PLANS,
  PROMOS,
  QUICK_COMPARE,
  TRIAL_DAYS,
  CURRENCY,
  billingNote,
  money,
  priceFor,
  savingsPct,
} from "../../data/pricing.js";
import { track } from "../../lib/analytics.js";
import PrIcon from "../ui/PrIcon.vue";

const cycle = ref("monthly");
const promo = ref(null);
const promoOpen = ref(false);
const promoDraft = ref("");
const promoMessage = ref("");
const promoState = ref(""); // "" | "ok" | "error"
const live = ref("");
const promoInput = ref(null);

/* The active discount as a fraction: 0.1 for NORTHWIND10, 0 with no code. */
const rate = computed(() => (promo.value ? PROMOS[promo.value] : 0));

/* Everything the cards need, derived once per change of cycle or promo. */
const rows = computed(() =>
  PLANS.map((plan) => {
    const price = priceFor(plan, cycle.value, rate.value);
    return {
      plan,
      price,
      best: plan.recommended,
      note: billingNote(plan, cycle.value, price, rate.value, promo.value),
    };
  })
);

const nextBilling = computed(() =>
  cycle.value === "annual"
    ? "Showing the monthly equivalent — you pay once a year."
    : "Prices billed monthly. Switch to annual and save 20%."
);

function setCycle(next) {
  if (next === cycle.value) return;
  cycle.value = next;
  track("pricing_toggle", {
    billing_period: next,
    promo_code: promo.value,
    currency: CURRENCY,
  });
  live.value =
    next === "annual"
      ? `Showing annual prices — you save ${savingsPct(PLANS[0])} percent.`
      : "Showing monthly prices.";
}

function togglePromo() {
  promoOpen.value = !promoOpen.value;
  if (!promoOpen.value) return;
  /* Opening the panel is a deliberate move toward the input, so send focus
     there — otherwise a keyboard visitor has to tab through to find it. */
  nextTick(() => promoInput.value?.focus());
  track("promo_reveal", {});
}

function applyPromo() {
  const code = promoDraft.value.trim().toUpperCase();

  if (PROMOS[code] === undefined) {
    promoState.value = "error";
    promoMessage.value = "That code isn’t valid. Check the spelling and try again.";
    track("promo_failed", { code_entered: code });
    return;
  }

  const pct = Math.round(PROMOS[code] * 100);
  promo.value = code;
  promoState.value = "ok";
  promoMessage.value = `Promo ${code} applied — ${pct}% off every pack below.`;
  track("promo_applied", { code, discount_pct: pct, currency: CURRENCY });
}

function clearPromo() {
  const previous = promo.value;
  promo.value = null;
  promoDraft.value = "";
  promoState.value = "";
  promoMessage.value = "";
  track("promo_removed", { code: previous });
}

function onPlanCta(row, index) {
  track("plan_selected", {
    plan_id: row.plan.id,
    plan_name: row.plan.name,
    billing_period: cycle.value,
    price: Math.round(row.price.netMonthly),
    promo_code: promo.value || null,
    recommended: row.best,
    position: index + 1,
    currency: CURRENCY,
  });
}

/* The at-a-glance strip: a visual row of ticks and crosses, plus a spoken
   version for anyone who cannot see it.

   Both are derived from PLANS instead of naming the ids literally. The old form
   spelled out all three packs, so removing one left the strip announcing a tier
   that no longer existed. Deriving them means the number of marks, their order
   and the spoken labels all follow the data automatically, and stay in the same
   order as the cards rendered above. */
const mark = (on) => (on ? "✓" : "✕");
const marksFor = (row) => PLANS.map((plan) => mark(row[plan.id])).join(" · ");
const spokenFor = (row) =>
  PLANS.map((plan) => `${plan.name}: ${row[plan.id] ? "yes" : "no"}.`).join(" ");
</script>

<template>
  <section id="pricing" aria-labelledby="pricing-title">
    <div class="wrap pricing">
      <div class="pricing__head">
        <p class="pricing__eyebrow">Packs &amp; Pricing</p>
        <h2 id="pricing-title">Plans that grow with your traffic</h2>
        <p class="lead">Start with a {{ TRIAL_DAYS }}-day free trial — no card, no lock-in. Switch
          packs or billing period whenever you like.</p>
      </div>

      <div class="pricing__controls">
        <div class="switch" role="group" aria-labelledby="billing-label">
          <span id="billing-label" class="hp">Billing period</span>
          <button type="button" class="switch__opt" data-cycle="monthly"
            :aria-pressed="cycle === 'monthly'" @click="setCycle('monthly')">Monthly</button>
          <button type="button" class="switch__opt" data-cycle="annual"
            :aria-pressed="cycle === 'annual'" @click="setCycle('annual')">Annual
            <span class="pill pill--save">Save 20%</span></button>
        </div>
        <p class="pricing__next">{{ nextBilling }}</p>
      </div>

      <ul class="plans" aria-label="Available packs">
        <li v-for="(row, i) in rows" :key="row.plan.id" class="plan"
          :class="{ 'plan--best': row.best }" :data-plan-id="row.plan.id"
          :style="{ '--plan-accent': row.plan.accent }">

          <p v-if="row.plan.badge" class="plan__badge">
            <PrIcon name="star" :size="14" class="pr-ico pr-ico--best" />
            {{ row.plan.badge }}<span class="hp"> — recommended plan</span>
          </p>

          <h3 class="plan__name">{{ row.plan.name }}</h3>
          <p class="plan__tag">{{ row.plan.tagline }}</p>

          <p class="plan__price">
            <span class="plan__was" :hidden="rate === 0">{{ money(row.price.grossMonthly) }}</span>
            <span class="plan__amount">{{ money(row.price.netMonthly) }}</span>
            <span class="plan__period">/ month</span>
          </p>
          <p class="plan__note">{{ row.note }}</p>

          <ul class="plan__features">
            <li v-for="feature in row.plan.features" :key="feature">
              <PrIcon name="check" class="pr-ico" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <ul class="plan__limits" :aria-label="`${row.plan.name} limits`">
            <li v-for="limit in row.plan.limits" :key="limit">{{ limit }}</li>
          </ul>

          <a class="btn plan__cta" :class="{ ghost: !row.best }" href="#contact"
            :data-plan-id="row.plan.id" :data-plan-name="row.plan.name"
            :data-recommended-cta="row.best || undefined" @click="onPlanCta(row, i)">
            {{ row.plan.cta }}
          </a>
        </li>
      </ul>

      <div class="quickcompare" role="group" aria-label="Key differences at a glance">
        <p v-for="row in QUICK_COMPARE" :key="row.label" class="quickcompare__row">
          <span>{{ row.label }}</span>
          <span aria-hidden="true">{{ marksFor(row) }}</span>
          <span class="hp">{{ spokenFor(row) }}</span>
        </p>
      </div>

      <div class="promo">
        <button type="button" class="promo__reveal" :aria-expanded="promoOpen"
          aria-controls="promo-panel" @click="togglePromo">
          <PrIcon name="tag" :size="16" class="pr-ico pr-ico--tag" />
          Have a promo code?
        </button>

        <form id="promo-panel" class="promo__form" novalidate :hidden="!promoOpen"
          @submit.prevent="applyPromo">
          <label for="promo-code">Promo code</label>
          <div class="promo__row">
            <input id="promo-code" ref="promoInput" v-model="promoDraft" type="text"
              autocomplete="off" spellcheck="false" placeholder="NORTHWIND10"
              aria-describedby="promo-msg" :aria-invalid="promoState === 'error'">
            <button type="submit" class="btn">Apply</button>
            <button type="button" class="btn ghost" :hidden="!promo"
              @click="clearPromo">Remove</button>
          </div>
          <p id="promo-msg" class="promo__msg" role="status" aria-live="polite"
            :data-state="promoState || undefined">{{ promoMessage }}</p>
        </form>
      </div>

      <p class="pricing__legal">All prices in US dollars. Taxes may apply and are calculated at
        checkout. Annual packs are billed once for the full year. Cancel anytime before renewal.</p>
      <p class="hp" role="status" aria-live="polite">{{ live }}</p>
    </div>
  </section>
</template>
