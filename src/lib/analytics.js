/*
  Analytics shim.

  Carried over from the old js/pricing.js so any existing tag setup keeps
  receiving the same event names and payloads. It pushes onto dataLayer (what
  Google Tag Manager reads) and calls gtag when Google Analytics is present.

  With neither loaded these are cheap no-ops, so nothing here is conditional on
  consent or configuration.

  The `window` guard matters: vite-ssg renders this app in Node at build time,
  where `window` does not exist. Nothing calls track() during pre-render today,
  but a missing guard here would be a build-time crash rather than a runtime
  warning, so it is not worth leaving to chance.
*/
export function track(name, payload = {}) {
  if (typeof window === "undefined") return;
  const body = { event: name, ...payload };
  (window.dataLayer = window.dataLayer || []).push(body);
  if (typeof window.gtag === "function") window.gtag("event", name, payload);
}
