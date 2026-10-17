<script setup>
/*
  The instant quote estimator.

  This is the section the whole rebuild was aimed at: not a business card, but a
  thing that actually works. Pick a scope and the price, timeline and closest
  published pack are derived on the spot.

  How it fits together:
    - each control is a small primitive ref;
    - `input` is a computed view of them;
    - `est` is one call to estimate() in data/estimator.js;
    - every figure on screen reads from `est`, so no number can get out of step
      with what the visitor actually chose.

  The default values are DEFAULT_INPUT from the data module, not literals written
  here. Pre-rendering renders these controls at build time and the client renders
  them again on hydration; if the two disagreed you would get a hydration
  mismatch, and having one source for "initial" removes that possibility.

  Progressive enhancement: the markup is real radios, checkboxes and a range
  input inside fieldsets, so with no JavaScript the form still shows a
  meaningful default estimate. Only the live updating is lost.
*/
import { computed, ref } from "vue";
import {
  ADDONS,
  DEFAULT_INPUT,
  EXTRA_PAGE_PRICE,
  PROJECT_TYPES,
  RETAINERS,
  SPEEDS,
  estimate,
  summaryFor,
} from "../../data/estimator.js";
import { pendingEstimate } from "../../lib/quote.js";

const typeId = ref(DEFAULT_INPUT.typeId);
const pages = ref(DEFAULT_INPUT.pages);
const addonIds = ref([...DEFAULT_INPUT.addonIds]);
const retainerId = ref(DEFAULT_INPUT.retainerId);
const speedId = ref(DEFAULT_INPUT.speedId);

const input = computed(() => ({
  typeId: typeId.value,
  pages: pages.value,
  addonIds: addonIds.value,
  retainerId: retainerId.value,
  speedId: speedId.value,
}));

const est = computed(() => estimate(input.value));
const summary = computed(() => summaryFor(est.value));

function toggleAddon(id) {
  const at = addonIds.value.indexOf(id);
  if (at === -1) addonIds.value.push(id);
  else addonIds.value.splice(at, 1);
}

function reset() {
  typeId.value = DEFAULT_INPUT.typeId;
  pages.value = DEFAULT_INPUT.pages;
  addonIds.value = [...DEFAULT_INPUT.addonIds];
  retainerId.value = DEFAULT_INPUT.retainerId;
  speedId.value = DEFAULT_INPUT.speedId;
}

/* Clipboard API is only available in a secure context, so it can be missing on
   plain http. The summary is on screen in a textarea either way, so failure
   degrades to "select and copy by hand" rather than losing the result. */
const summaryBox = ref(null);
const copied = ref(false);

async function copySummary() {
  try {
    await navigator.clipboard.writeText(summary.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 2400);
  } catch {
    copied.value = false;
    summaryBox.value?.select();
  }
}

/*
  Hand the estimate to the contact form: its service, its budget band, and the
  written summary as the message. The button is a real <a href="#contact">, so
  scrolling still works with JavaScript off — this only adds the prefill.
*/
function handOver() {
  pendingEstimate.value = {
    service: est.value.type.service,
    budget: est.value.budget,
    message: summary.value,
  };
}

const pagesHint = computed(() => {
  const extra = est.value.extraPages;
  if (!extra) return `${est.value.pages} pages, all included.`;
  const dollars = (extra * EXTRA_PAGE_PRICE).toLocaleString("en-US");
  return `${est.value.pages} pages — ${extra} beyond the ${est.value.type.basePages} included, adding $${dollars}.`;
});
</script>

<template>
  <section id="quote" class="dark" aria-labelledby="quote-title">
    <div class="wrap">
      <p class="qz-eyebrow">Instant estimate</p>
      <h2 id="quote-title">Price your project in under a minute</h2>
      <p class="lead">Not a brochure — a working tool. Answer five questions and get the figure
        straight away. It is an honest starting point, and the estimate comes with you when you
        send the enquiry.</p>

      <div class="qz">
        <form class="qz-controls" novalidate @submit.prevent>
          <fieldset class="qz-group">
            <legend class="qz-legend">1 · What are we building?</legend>
            <div class="qz-chips">
              <label v-for="type in PROJECT_TYPES" :key="type.id" class="qz-chip">
                <input type="radio" name="qz-type" :value="type.id" v-model="typeId">
                <span class="qz-chip-label">{{ type.label }}</span>
                <span class="qz-chip-desc">{{ type.desc }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="qz-group">
            <legend class="qz-legend">2 · How many pages?</legend>
            <p class="qz-hint" id="qz-pages-hint">{{ pagesHint }}</p>
            <input id="qz-pages" class="qz-range" type="range" min="1" max="30" step="1"
              v-model.number="pages" aria-describedby="qz-pages-hint">
            <div class="qz-range-ends"><span>1</span><strong>{{ pages }}</strong><span>30</span></div>
          </fieldset>

          <fieldset class="qz-group">
            <legend class="qz-legend">3 · What should we add?</legend>
            <p class="qz-hint">Optional. Each one adds scope — and time.</p>
            <div class="qz-chips">
              <label v-for="addon in ADDONS" :key="addon.id" class="qz-chip qz-chip--addon">
                <input type="checkbox" :value="addon.id" v-model="addonIds">
                <span class="qz-chip-label">{{ addon.label }}</span>
                <span class="qz-chip-desc">{{ addon.desc }}</span>
                <span class="qz-chip-price">+${{ addon.price.toLocaleString("en-US") }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset class="qz-group">
            <legend class="qz-legend">4 · Marketing after launch?</legend>
            <div class="qz-chips qz-chips--narrow">
              <label v-for="retainer in RETAINERS" :key="retainer.id" class="qz-chip">
                <input type="radio" name="qz-retainer" :value="retainer.id" v-model="retainerId">
                <span class="qz-chip-label">{{ retainer.label }}</span>
                <span class="qz-chip-price">
                  {{ retainer.monthly ? "$" + retainer.monthly.toLocaleString("en-US") + "/mo" : "—" }}
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset class="qz-group">
            <legend class="qz-legend">5 · How fast?</legend>
            <div class="qz-chips qz-chips--narrow">
              <label v-for="speed in SPEEDS" :key="speed.id" class="qz-chip">
                <input type="radio" name="qz-speed" :value="speed.id" v-model="speedId">
                <span class="qz-chip-label">{{ speed.label }}</span>
                <span class="qz-chip-desc">{{ speed.desc }}</span>
              </label>
            </div>
          </fieldset>
        </form>

        <aside class="qz-out">
          <p class="qz-out__label">Your estimate</p>

          <!--
            Live region sits on the price line only, not on the whole card. On the
            card it would re-read the pack recommendation, the disclaimer and the
            textarea every time a single checkbox changed; announcing the number
            the visitor is actually watching for is the useful part.
          -->
          <p class="qz-total" aria-live="polite" aria-atomic="true">
            <span class="qz-total__range">${{ est.low.toLocaleString("en-US") }} – ${{ est.high.toLocaleString("en-US") }}</span>
            <span class="qz-total__unit">one-off</span>
          </p>

          <ul class="qz-facts">
            <li><span>Timeline</span><strong>{{ est.weeks }} week{{ est.weeks === 1 ? "" : "s" }}</strong></li>
            <li>
              <span>Marketing</span>
              <strong>{{ est.monthly ? "$" + est.monthly.toLocaleString("en-US") + "/mo" : "none" }}</strong>
            </li>
            <li v-if="est.speed.id === 'fast'"><span>Fast-track</span><strong>+25%</strong></li>
            <li>
              <span>Pages</span><strong>{{ est.pages }}<template v-if="est.extraPages"> (+{{ est.extraPages }})</template></strong>
            </li>
          </ul>

          <div class="qz-pack">
            <p class="qz-pack__label">Closest pack</p>
            <p class="qz-pack__name">{{ est.packName }}</p>
            <p class="qz-pack__note">Your answers line up with the {{ est.packName }} pack. See it
              <a href="#pricing">in pricing</a>.</p>
          </div>

          <label class="qz-summary-label" for="qz-summary">Copy or edit</label>
          <textarea id="qz-summary" ref="summaryBox" class="qz-summary" readonly rows="7"
            :value="summary"></textarea>

          <div class="qz-actions">
            <button type="button" class="btn" @click="copySummary">
              {{ copied ? "Copied" : "Copy summary" }}
            </button>
            <a class="btn ghost" href="#contact" @click="handOver">Send to the team</a>
            <button type="button" class="qz-reset" @click="reset">Reset</button>
          </div>

          <p class="qz-disclaimer">A starting point, not a quote. Final figures depend on what we
            scope together.</p>
        </aside>
      </div>
    </div>
  </section>
</template>
