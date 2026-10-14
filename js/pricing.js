/* pricing.js — Packs & Pricing section. No dependencies, no build step.
   Progressive enhancement: index.html already renders monthly prices, so with
   JS disabled the section still reads correctly. This file only updates prices,
   wires the billing toggle, the promo code and analytics. */
(function () {
    "use strict";

    /* ─────────── config ─────────── */
    const LOCALE = "en-US";
    const CURRENCY = "USD";
    const TRIAL_DAYS = 14;
    const PROMOS = { NORTHWIND10: 0.10, LAUNCH15: 0.15 };

    /* ─────────── data ───────────
       Single source of truth for the dynamic bits. The static markup in
       index.html must agree with this; renderCards() can rebuild it from here. */
    const PLANS = [
        {
            id: "starter",
            name: "Starter",
            tagline: "Get online fast with the essentials.",
            monthly: 390,
            annual: 3744,
            recommended: false,
            badge: null,
            accent: "#555a7a",
            cta: "Choose Starter",
            limits: ["2 seats", "10 GB storage", "100k requests/mo"],
            features: [
                "Custom 5-page website",
                "Mobile-responsive design",
                "Basic on-page SEO",
                "Monthly performance report"
            ]
        },
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
            features: [
                "Everything in Starter",
                "Up to 15 pages + CMS",
                "Conversion copywriting",
                "SEO & content strategy",
                "A/B testing & landing pages"
            ]
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
                "Quarterly growth roadmap"
            ]
        }
    ];

    /* ─────────── state ─────────── */
    const state = { cycle: "monthly", promo: null };

    /* ─────────── helpers ─────────── */
    function money(n) {
        const whole = Math.abs(n % 1) < 1e-9;
        return new Intl.NumberFormat(LOCALE, {
            style: "currency",
            currency: CURRENCY,
            minimumFractionDigits: 0,
            maximumFractionDigits: whole ? 0 : 2
        }).format(n);
    }

    function savingsPct(plan) {
        return Math.round((1 - (plan.annual / 12) / plan.monthly) * 100);
    }

    function priceFor(plan, rate) {
        const annual = state.cycle === "annual";
        const grossMonthly = annual ? plan.annual / 12 : plan.monthly;
        const grossTotal = annual ? plan.annual : plan.monthly;
        return {
            grossMonthly: grossMonthly,
            netMonthly: grossMonthly * (1 - rate),
            grossTotal: grossTotal,
            netTotal: grossTotal * (1 - rate)
        };
    }

    function billingNote(plan, price, rate) {
        const parts = [];
        if (state.cycle === "annual") {
            parts.push("Billed " + money(price.netTotal) + " once a year (save " + savingsPct(plan) + "%)");
        } else {
            parts.push("Billed " + money(price.netTotal) + " monthly, cancel anytime");
        }
        if (rate > 0 && state.promo) parts.push("promo " + state.promo + " applied");
        parts.push(TRIAL_DAYS + "-day free trial");
        return parts.join(" \u00b7 ");
    }

    function track(name, payload) {
        const body = Object.assign({ event: name, currency: CURRENCY }, payload || {});
        (window.dataLayer = window.dataLayer || []).push(body);
        if (typeof window.gtag === "function") window.gtag("event", name, payload);
    }

    function announce(text) {
        const live = document.querySelector("[data-pricing-live]");
        if (live) live.textContent = text;
    }

    /* ─────────── hydrate the static markup ─────────── */
    function hydrate() {
        const rate = state.promo ? PROMOS[state.promo] : 0;

        PLANS.forEach(function (plan) {
            const price = priceFor(plan, rate);

            document.querySelectorAll('[data-price-for="' + plan.id + '"]').forEach(function (el) {
                el.textContent = money(price.netMonthly);
            });

            document.querySelectorAll('[data-gross-for="' + plan.id + '"]').forEach(function (el) {
                el.textContent = money(price.grossMonthly);
                el.hidden = rate === 0;
            });

            document.querySelectorAll('[data-note-for="' + plan.id + '"]').forEach(function (el) {
                el.textContent = billingNote(plan, price, rate);
            });

            document.querySelectorAll('[data-cta-for="' + plan.id + '"]').forEach(function (el) {
                el.dataset.price = String(Math.round(price.netMonthly));
                el.dataset.billing = state.cycle;
            });
        });

        const sw = document.querySelector("[data-billing]");
        if (sw) {
            sw.querySelectorAll("[data-cycle]").forEach(function (btn) {
                btn.setAttribute("aria-pressed", String(btn.dataset.cycle === state.cycle));
            });
        }

        const next = document.querySelector("[data-next-billing]");
        if (next) {
            next.textContent = state.cycle === "annual"
                ? "Showing the monthly equivalent \u2014 you pay once a year."
                : "Prices billed monthly. Switch to annual and save 20%.";
        }
    }

    /* ─────────── optional: build the cards from data ─────────── */
    function icon(kind) {
        if (kind === "check") {
            return '<svg class="pr-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        return '<svg class="pr-ico pr-ico--best" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.35 6.2 20.4l1.1-6.45-4.7-4.6 6.5-.95L12 2.5z" fill="currentColor"/></svg>';
    }

    function esc(value) {
        return String(value).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    function cardHTML(plan) {
        const rate = state.promo ? PROMOS[state.promo] : 0;
        const price = priceFor(plan, rate);
        const best = plan.recommended;

        const badge = plan.badge
            ? '<p class="plan__badge">' + icon("badge") + esc(plan.badge) +
              '<span class="hp"> \u2014 recommended plan</span></p>'
            : "";

        const features = plan.features.map(function (f) {
            return "<li>" + icon("check") + "<span>" + esc(f) + "</span></li>";
        }).join("");

        const limits = plan.limits.map(function (l) {
            return "<li>" + esc(l) + "</li>";
        }).join("");

        const cls = "btn" + (best ? "" : " ghost") + " plan__cta";

        return '<li class="plan' + (best ? " plan--best" : "") + '" data-plan-id="' + esc(plan.id) + '"' +
            (best ? ' data-recommended' : "") +
            ' style="--plan-accent:' + esc(plan.accent) + '">' +
            badge +
            '<h3 class="plan__name">' + esc(plan.name) + "</h3>" +
            '<p class="plan__tag">' + esc(plan.tagline) + "</p>" +
            '<p class="plan__price">' +
              '<span class="plan__was" data-gross-for="' + esc(plan.id) + '"' + (rate === 0 ? " hidden" : "") + ">" +
                money(price.grossMonthly) + "</span>" +
              '<span class="plan__amount" data-price-for="' + esc(plan.id) + '">' + money(price.netMonthly) + "</span>" +
              '<span class="plan__period">/ month</span>' +
            "</p>" +
            '<p class="plan__note" data-note-for="' + esc(plan.id) + '">' + esc(billingNote(plan, price, rate)) + "</p>" +
            '<ul class="plan__features">' + features + "</ul>" +
            '<ul class="plan__limits" aria-label="' + esc(plan.name) + ' limits">' + limits + "</ul>" +
            '<a class="' + cls + '" href="#contact" data-cta-for="' + esc(plan.id) + '" data-plan-cta' +
              (best ? " data-recommended-cta" : "") +
              ' data-plan-id="' + esc(plan.id) + '" data-plan-name="' + esc(plan.name) + '">' + esc(plan.cta) + "</a>" +
            "</li>";
    }

    function renderCards(plans, mount) {
        const list = mount || document.querySelector("[data-plans]");
        if (!list) return;
        list.innerHTML = plans.map(cardHTML).join("");
        hydrate();
    }

    /* ─────────── interaction ─────────── */
    document.addEventListener("click", function (e) {
        const target = e.target;

        const cycleBtn = target.closest("[data-cycle]");
        if (cycleBtn) {
            const cycle = cycleBtn.dataset.cycle;
            if (cycle === state.cycle) return;
            state.cycle = cycle;
            hydrate();
            track("pricing_toggle", { billing_period: cycle, promo_code: state.promo });
            announce(cycle === "annual"
                ? "Showing annual prices \u2014 you save " + savingsPct(PLANS[0]) + " percent."
                : "Showing monthly prices.");
            return;
        }

        const reveal = target.closest("[data-promo-reveal]");
        if (reveal) {
            const panel = document.getElementById(reveal.getAttribute("aria-controls"));
            const open = reveal.getAttribute("aria-expanded") === "true";
            reveal.setAttribute("aria-expanded", String(!open));
            if (panel) panel.hidden = open;
            if (!open) {
                const input = panel && panel.querySelector("input");
                if (input) input.focus();
                track("promo_reveal", {});
            }
            return;
        }

        const clear = target.closest("[data-promo-clear]");
        if (clear) {
            const form = clear.closest("[data-promo]");
            const input = form.querySelector("input");
            const previous = state.promo;
            state.promo = null;
            input.value = "";
            input.setAttribute("aria-invalid", "false");
            form.querySelector("[role=status]").textContent = "";
            clear.hidden = true;
            hydrate();
            track("promo_removed", { code: previous });
            return;
        }

        const cta = target.closest("[data-plan-cta]");
        if (cta) {
            const card = cta.closest(".plan");
            const order = card ? Array.prototype.indexOf.call(card.parentNode.children, card) + 1 : null;
            track("plan_selected", {
                plan_id: cta.dataset.planId,
                plan_name: cta.dataset.planName,
                billing_period: state.cycle,
                price: Number(cta.dataset.price),
                promo_code: state.promo || null,
                recommended: cta.hasAttribute("data-recommended-cta"),
                position: order
            });
        }
    });

    document.addEventListener("submit", function (e) {
        const form = e.target.closest("[data-promo]");
        if (!form) return;
        e.preventDefault();

        const input = form.querySelector("input");
        const msg = form.querySelector("[role=status]");
        const clear = form.querySelector("[data-promo-clear]");
        const code = (input.value || "").trim().toUpperCase();

        if (PROMOS[code] === undefined) {
            input.setAttribute("aria-invalid", "true");
            msg.dataset.state = "error";
            msg.textContent = "That code isn\u2019t valid. Check the spelling and try again.";
            track("promo_failed", { code_entered: code });
            return;
        }

        const pct = Math.round(PROMOS[code] * 100);
        state.promo = code;
        input.setAttribute("aria-invalid", "false");
        msg.dataset.state = "ok";
        msg.textContent = "Promo " + code + " applied \u2014 " + pct + "% off every pack below.";
        if (clear) clear.hidden = false;
        hydrate();
        track("promo_applied", { code: code, discount_pct: pct });
    });

    /* ─────────── view tracking ─────────── */
    function trackView() {
        const section = document.getElementById("pricing");
        if (!section || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                track("pricing_view", { section: "pricing", plans_count: PLANS.length, default_cycle: "monthly" });
                io.disconnect();
            });
        }, { threshold: 0.35 });
        io.observe(section);
    }

    /* ─────────── boot ─────────── */
    function boot() {
        hydrate();
        trackView();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

    window.PricingSection = { hydrate: hydrate, renderCards: renderCards, state: state, PLANS: PLANS };
})();
