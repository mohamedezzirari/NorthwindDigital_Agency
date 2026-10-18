/*
  Site-wide content — the single source of truth.

  Migrated from the old js/config.js. There is no longer an API to fetch this
  from: `server/` is gone, so this module IS the data. That is what lets the
  build pre-render the page and the client hydrate it with no mismatch.

  Everything here is plain serialisable data. Components import what they need.

  Note on asset paths: images are written as plain relative strings
  ("assets/photo1.jpg"), never as bundler imports. The files live in public/
  and are copied to the build output untouched, so the pre-rendered HTML and the
  client bundle produce byte-identical URLs. Importing them instead hashes the
  filename, and the SSR pass was writing an absolute "/assets/logo-<hash>.png"
  while the client resolved the same file relatively — which 404s on sub-path
  hosts (GitHub Pages project sites, raw.githack previews) whenever JavaScript
  is unavailable. See the longer note in SiteHeader.vue.
*/

/* ---------- contact details ----------
   Still the placeholder values the client asked to ship with. Replace them
   here and the header, footer, contact section, WhatsApp link and the mailto:
   form fallback all follow. */
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
  { label: "Pricing", href: "#pricing" },
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

/* ---------- services ----------
   Two groups, each with its own grid of cards. `icon` is a key into ICONS in
   data/icons.js; the icon is drawn inline so it scales and inherits the card's
   colour through currentColor. */
export const SERVICES = [
  {
    group: "Development",
    items: [
      {
        name: "Website Development",
        desc: "Fast, polished business sites that turn visitors into enquiries.",
        icon: "site",
      },
      {
        name: "Frontend Development",
        desc: "Responsive interfaces that feel smooth on every device.",
        icon: "code",
      },
      {
        name: "Backend Development",
        desc: "Reliable servers, databases and APIs that scale with you.",
        icon: "server",
      },
      {
        name: "E-commerce Websites",
        desc: "Online stores built to make buying simple and increase sales.",
        icon: "cart",
      },
      {
        name: "Landing Pages",
        desc: "Focused pages designed to convert campaign traffic.",
        icon: "flag",
      },
      {
        name: "Redesign & Optimization",
        desc: "Refresh outdated sites and cut load times.",
        icon: "gauge",
      },
      {
        name: "Custom Web Applications",
        desc: "Tools and portals built around how your business works.",
        icon: "grid",
      },
    ],
  },
  {
    group: "Digital Marketing",
    items: [
      {
        name: "Social Media Marketing",
        desc: "Content and campaigns that grow an engaged audience.",
        icon: "people",
      },
      {
        name: "Facebook & Instagram Ads",
        desc: "Targeted ads that reach the right people at the right cost.",
        icon: "megaphone",
      },
      {
        name: "Social Media Management",
        desc: "Consistent posting, community replies and monthly reports.",
        icon: "calendar",
      },
      {
        name: "Paid Advertising Campaigns",
        desc: "Search and social campaigns managed against your target cost per lead.",
        icon: "target",
      },
      {
        name: "SEO Optimization",
        desc: "Rank higher for the searches your customers actually make.",
        icon: "search",
      },
      {
        name: "Content Strategy",
        desc: "A clear plan for content that attracts and persuades.",
        icon: "doc",
      },
      {
        name: "Conversion Rate Optimization",
        desc: "Test and improve pages so more visitors take action.",
        icon: "funnel",
      },
    ],
  },
];

/* Flat list of service names, for the contact form's <select> and the quote
   estimator's checklist. Derived, so the two can never drift apart. */
export const SERVICE_NAMES = SERVICES.flatMap((g) => g.items.map((i) => i.name));

/* ---------- selected projects ----------
   Image-only cards: no names, no descriptions. Every project has just an image
   and alt text, so the card draws nothing but a screenshot. Give an entry a
   title or a description and the card template picks it up. */
export const PROJECTS = [
  { img: "assets/project-1.webp", alt: "Selected project 1" },
  { img: "assets/project-2.webp", alt: "Selected project 2" },
  { img: "assets/project-3.webp", alt: "Selected project 3" },
  { img: "assets/project-4.webp", alt: "Selected project 4" },
  { img: "assets/project-5.webp", alt: "Selected project 5" },
  { img: "assets/project-6.webp", alt: "Selected project 6" },
];

/* ---------- team ----------
   Shown as one clustered "group photo": each person gets a lanyard and an ID
   badge. `group` drives the two headings and the legend, `photo` the portrait.
   A member with no photo falls back to a generated initials avatar (see
   lib/avatar.js) rather than a broken image. */
export const TEAM = [
  {
    group: "Development Team",
    name: "Ghost",
    role: "Full-Stack Developer",
    photo: "assets/photo1.jpg",
    bio: "Builds fast, secure websites and web apps from database to interface. Replace with a short bio.",
    skills: ["React", "Node.js", "APIs"],
    links: {},
  },
  {
    group: "Development Team",
    name: "Pixel",
    role: "Full-Stack Developer",
    photo: "assets/photo2.jpg",
    bio: "Builds complete web products, from clean interfaces to the servers behind them. Replace with a short bio.",
    skills: ["JavaScript", "React", "Databases"],
    links: {},
  },
  {
    group: "Development Team",
    name: "Bolt",
    role: "Full-Stack Developer",
    photo: "assets/photo3.jpg",
    bio: "Delivers reliable websites and apps end to end, with performance and security built in. Replace with a short bio.",
    skills: ["Node.js", "Security", "Integrations"],
    links: {},
  },
  {
    group: "Marketing Team",
    name: "Kimi",
    role: "Digital Marketing Specialist",
    photo: "assets/photo4.jpg",
    bio: "Plans campaigns and SEO that bring in qualified leads. Replace with a short bio.",
    skills: ["SEO", "Strategy", "Analytics"],
    links: {},
  },
  {
    group: "Marketing Team",
    name: "Tirari",
    role: "Social Media Manager",
    photo: "assets/photo5.jpg",
    bio: "Grows engaged audiences with consistent content and community care. Replace with a short bio.",
    skills: ["Content", "Instagram", "Community"],
    links: {},
  },
  {
    group: "Marketing Team",
    name: "Zak",
    role: "Ads Specialist",
    photo: "assets/photo6.jpg",
    bio: "Runs Facebook, Instagram and Google campaigns against clear cost targets. Replace with a short bio.",
    skills: ["Meta Ads", "Google Ads", "CRO"],
    links: {},
  },
];

/* ---------- why choose us ---------- */
export const WHY = [
  { title: "Tailored solutions", body: "Nothing off the shelf. Each project is built around your goals." },
  { title: "One team, two skills", body: "Development and marketing work together under one roof." },
  { title: "Modern technology", body: "Current tools that keep your site fast and secure." },
  { title: "Data-driven marketing", body: "Decisions come from numbers, not guesses." },
  { title: "Clear communication", body: "Regular updates in plain language." },
  { title: "Measurable results", body: "We agree on targets and report against them." },
];

/* ---------- process ----------
   Rendered as an ordered list; the numbering comes from CSS counters, not from
   anything in this data. */
export const STEPS = [
  { title: "Discovery", body: "We learn your business and goals." },
  { title: "Strategy", body: "We plan the right solution." },
  { title: "Design", body: "We create the visual experience." },
  { title: "Development / Execution", body: "We build the site or launch the campaign." },
  { title: "Testing and Launch", body: "We check everything before delivery." },
  { title: "Optimization", body: "We improve performance and results." },
];

/* ---------- testimonials ----------
   Placeholders, and the templates say so out loud so nobody ships them by
   accident. */
export const TESTS = [
  {
    quote: "Sample testimonial text. Replace with real client feedback about working with your agency.",
    name: "Client Name",
    company: "Company",
    stars: 5,
  },
  {
    quote: "Sample testimonial text. Replace with real client feedback about the results you delivered.",
    name: "Client Name",
    company: "Company",
    stars: 5,
  },
  {
    quote: "Sample testimonial text. Replace with real client feedback about communication and process.",
    name: "Client Name",
    company: "Company",
    stars: 4,
  },
];

/* ---------- about section stat strip ----------
   Placeholder figures, hence the "00" values. */
export const STATS = [
  { value: "00+", label: "Projects delivered (placeholder)" },
  { value: "00", label: "Happy clients (placeholder)" },
  { value: "00%", label: "Client retention (placeholder)" },
];

/* ---------- hero ticker ----------
   The scrolling word band under the hero. The component repeats this list once
   to give the loop something to scroll into, so it is not duplicated here. */
export const MARQUEE_WORDS = [
  "Websites",
  "Web apps",
  "E-commerce",
  "SEO",
  "Meta ads",
  "Content",
  "Conversion",
];

/* ---------- contact form budget bands ----------
   USD, so they match the packs and the quote estimator's output — which lets the
   estimator pick a band for the visitor directly. The original markup shipped
   rupee bands (₹50,000 …) next to US-dollar pricing, which was copy-paste
   residue: the number given for the WhatsApp line is a Moroccan +212.
   Agreed with the client: one currency site-wide. */
export const BUDGETS = [
  "Under $2,500",
  "$2,500 – $7,500",
  "$7,500 – $20,000",
  "$20,000+",
];
