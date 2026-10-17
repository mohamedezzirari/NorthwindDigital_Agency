/*
  Portrait fallback.

  Ported from the avatar() helper in the old js/main.js. Every team member in
  content.js currently has a real photo, so this only matters when someone is
  added without one — in which case they get a coloured tile with their initials
  rather than a broken image icon.

  Returned as a data: URI so it needs no network request and no file on disk.
*/

/* Six hues, spread around the wheel, keyed by position so two adjacent people
   without photos never end up the same colour. */
const HUES = [235, 160, 330, 25, 200, 280];

export function avatarFor(member, index) {
  if (member.photo) return member.photo;

  const hue = HUES[index % HUES.length];
  const initials = member.name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  /*
    The initials are interpolated into SVG *text*, so they must be escaped for
    XML rather than for HTML. Only "&", "<" and ">" can break out of a text node
    here, but the quote characters are escaped too so the same value stays safe
    if it is ever moved into an attribute.
  */
  const safe = String(initials).replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},70%,55%)"/>` +
    `<stop offset="1" stop-color="hsl(${hue + 40},70%,30%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="500" fill="url(#g)"/>` +
    `<circle cx="200" cy="200" r="72" fill="rgba(255,255,255,.28)"/>` +
    `<path d="M60 500c0-100 60-160 140-160s140 60 140 160z" fill="rgba(255,255,255,.28)"/>` +
    `<text x="200" y="215" font-family="sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">${safe}</text>` +
    `</svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
