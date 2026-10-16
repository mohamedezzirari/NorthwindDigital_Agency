/*
  Site-wide content — the single source of truth.

  Migrated from js/config.js. There is no longer an API to fetch this from:
  `server/` has been removed, so the module IS the data. That is what lets the
  build pre-render the page and the client hydrate it with no mismatch.

  Everything here is plain data. Components import what they need.
*/

/* ---------- contact details ----------
   Still the placeholder values the client asked to ship with. Replace them
   here and the header, footer, contact section, WhatsApp link and the
   mailto: form fallback all follow. */
export const SITE = {
  name: "Northwind Digital",
  email: "hello@example.com",
  whatsapp: "212600000000", // digits only, with country code
  socials: { Facebook: "https://facebook.com" },
};

/* The primary call to action, used by both the desktop and mobile nav. */
export const CTA = { label: "Start a Project", href: "#contact" };

/* This is a single page, so navigation targets are fragments, not routes. */
export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Our Team", href: "#team" },
  { label: "About Us", href: "#about" },
  { label: "Contact", href: "#contact" },
];

/* The footer's own "Services" column — a shortlist, all pointing at #services. */
export const FOOTER_SERVICES = [
  { label: "Website development", href: "#services" },
  { label: "E-commerce", href: "#services" },
  { label: "SEO", href: "#services" },
  { label: "Paid ads", href: "#services" },
];
