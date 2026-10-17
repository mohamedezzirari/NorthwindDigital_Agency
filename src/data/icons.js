/*
  Inline SVG art.

  Two families live here:

    ICONS     the service-grid glyphs. Each value is the INNER markup of a
              24x24 SVG; SvcIcon.vue supplies the surrounding <svg> (viewBox,
              stroke, currentColor), so every icon picks up the colour of the
              card it sits in.

    PR_ICONS  the three glyphs the pricing section needs: the feature tick, the
              "most popular" star and the promo tag. These need different
              fill/stroke settings from each other, so the attributes travel
              with the markup. PrIcon.vue renders them.

  Migrated from the ICONS object in the old js/config.js. A service that names a
  key which is missing here falls back to rendering the key as text
  (see SvcIcon.vue), so a typo degrades to a letter instead of an empty box.
*/

export const ICONS = {
  site: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 9h19"/><path d="M6 6.5h.01M8.5 6.5h.01"/>',
  code: '<path d="M9 7l-5 5 5 5"/><path d="M15 7l5 5-5 5"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1.6"/><rect x="3" y="14" width="18" height="6" rx="1.6"/><path d="M7 7h.01M7 17h.01"/>',
  cart: '<circle cx="9.5" cy="20" r="1.2"/><circle cx="17.5" cy="20" r="1.2"/><path d="M2.5 3h2.3l2.4 11.6a1.6 1.6 0 0 0 1.6 1.3h8.8a1.6 1.6 0 0 0 1.6-1.3L21 7.5H6.2"/>',
  flag: '<path d="M5.5 21.5V3"/><path d="M5.5 4.5h11.5l-2.2 3.8 2.2 3.8H5.5"/>',
  gauge: '<path d="M3.5 17.5a8.5 8.5 0 1 1 17 0"/><path d="M12 17.5l4-5.2"/><circle cx="12" cy="17.5" r="1.2"/>',
  grid: '<rect x="3" y="3" width="7.6" height="7.6" rx="1.6"/><rect x="13.4" y="3" width="7.6" height="7.6" rx="1.6"/><rect x="3" y="13.4" width="7.6" height="7.6" rx="1.6"/><rect x="13.4" y="13.4" width="7.6" height="7.6" rx="1.6"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M16.4 5.3a3.2 3.2 0 0 1 0 6.1"/><path d="M17.6 14.5a6.2 6.2 0 0 1 3.6 5.5"/>',
  megaphone: '<path d="M4 9.5v5a1.5 1.5 0 0 0 1.5 1.5h2L18 20V4L7.5 8H5.5A1.5 1.5 0 0 0 4 9.5z"/><path d="M18 9.2a4 4 0 0 1 0 5.6"/><path d="M7.5 16v4.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="M7.5 14h2.5M14 14h2.5M7.5 17.5h2.5M14 17.5h2.5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L20.5 20.5"/>',
  doc: '<path d="M6 2.5h7.5L18.5 7.5V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"/><path d="M13.5 2.5V8h5"/><path d="M8.5 12.5h7M8.5 16h5"/>',
  funnel: '<path d="M3.5 4.5h17l-6.6 7.9v6.1l-3.8 2.3v-8.4z"/>',
};

/*
  Pricing glyphs. `inner` is what goes inside the <svg>; `attrs` are the
  presentation attributes that differ between them (the tick is stroked, the
  star is filled, the tag is stroked except for its dot).
*/
export const PR_ICONS = {
  check: {
    inner: '<path d="M20 6 9 17l-5-5"/>',
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
  },
  star: {
    inner: '<path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.35 6.2 20.4l1.1-6.45-4.7-4.6 6.5-.95L12 2.5z"/>',
    attrs: { fill: "currentColor" },
  },
  tag: {
    inner:
      '<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/>' +
      '<circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/>',
    attrs: {
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linejoin": "round",
    },
  },
};
