/**
 * Brand-background treatment for team photos.
 *
 * Removes the background with remove.bg, then composites the person onto the
 * site's own card colour so the photo blends into the team grid.
 *
 *   node scripts/brand-background.js <input> <output> [focusY] [focusX] [zoom]
 *
 * Requires a remove.bg API key (50 free low-res calls/month):
 *   1. sign in at https://www.remove.bg/api
 *   2. My Account -> API Keys -> + New API Key
 *   3. add it to server/.env as  REMOVE_BG_API_KEY=...
 *
 * The crop is taken from the ORIGINAL image, not the 480px derivative, so
 * remove.bg gets as much detail as possible to work with.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [, , input, output, ...rest] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/brand-background.js <input> <output> [focusY] [focusX] [zoom]");
  process.exit(1);
}

const API_KEY = process.env.REMOVE_BG_API_KEY;
if (!API_KEY) {
  console.error(
    "REMOVE_BG_API_KEY is not set.\n" +
      "  1. create a key at https://www.remove.bg/api (free, 50 calls/month)\n" +
      "  2. add  REMOVE_BG_API_KEY=<key>  to server/.env\n" +
      "  3. re-run with:  node --env-file=.env scripts/brand-background.js <in> <out>"
  );
  process.exit(1);
}

const SIZE = 480;
const num = (v, d) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : d);
const focusY = num(rest[0], 0.34);
const focusX = num(rest[1], 0.5);
const zoom = Math.min(Math.max(num(rest[2], 1), 0.3), 1);

// The card colour behind team photos, from .member in css/styles.css.
const TOP = "#232a70";
const BOTTOM = "#12153a";

/* ---------- 1. crop the square region from the original ---------- */

const meta = await sharp(input).metadata();
const { width: w, height: h } = meta;

let side = Math.min(w, h) * zoom;
let left = Math.round(w * focusX - side / 2);
let top = Math.round(h * focusY - (side * focusY) / zoom);
if (left < 0) { side += left * 2; left = 0; }
if (top < 0) { side += top * 2; top = 0; }
side = Math.round(Math.min(side, w - left, h - top));
left = Math.min(left, w - side);
top = Math.min(top, h - side);

const cropped = await sharp(input)
  .extract({ left, top, width: side, height: side })
  .png()
  .toBuffer();

/* ---------- 2. remove the background ---------- */

const form = new FormData();
form.append("image_file", new Blob([cropped], { type: "image/png" }), "crop.png");
form.append("size", "preview"); // 0.25 MP — plenty for a 480px card, and free-tier
form.append("type", "person"); // we know these are portraits
form.append("format", "png"); // keep the alpha channel

const res = await fetch("https://api.remove.bg/v1.0/removebg", {
  method: "POST",
  headers: { "X-Api-Key": API_KEY },
  body: form,
});

if (!res.ok) {
  const body = await res.text();
  const hints = {
    401: "Invalid API key — check REMOVE_BG_API_KEY.",
    402: "Out of credits on your remove.bg plan.",
    403: "API key not authorised for this call.",
    429: "Rate limited — wait a moment and retry.",
  };
  console.error(`remove.bg failed (${res.status}): ${hints[res.status] || body.slice(0, 300)}`);
  process.exit(1);
}

const cutout = Buffer.from(await res.arrayBuffer());

// Sanity check: a valid PNG starts with the 8-byte signature.
if (cutout.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
  console.error("remove.bg returned something that is not a PNG.");
  process.exit(1);
}

/* ---------- 3. composite onto the brand background ---------- */

const cut = await sharp(cutout).metadata();
// Scale the cut-out to sit comfortably inside the card, biased slightly low so
// the head has breathing room.
const scale = (SIZE * 0.94) / Math.max(cut.width, cut.height);
const cutW = Math.round(cut.width * scale);
const cutH = Math.round(cut.height * scale);

const backdrop = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}">
     <defs>
       <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
         <stop offset="0%"   stop-color="${TOP}"/>
         <stop offset="100%" stop-color="${BOTTOM}"/>
       </linearGradient>
       <radialGradient id="glow" cx="0.5" cy="0.32" r="0.62">
         <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.10"/>
         <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
       </radialGradient>
     </defs>
     <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
     <rect width="${SIZE}" height="${SIZE}" fill="url(#glow)"/>
   </svg>`
);

await sharp(backdrop)
  .composite([
    {
      input: await sharp(cutout).resize(cutW, cutH).png().toBuffer(),
      left: Math.round((SIZE - cutW) / 2),
      top: Math.round(SIZE * 0.04),
    },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(output);

const kb = Math.round(fs.statSync(output).size / 1024);
console.log(
  `${path.basename(input)} ${w}x${h} -> ${path.basename(output)} ${SIZE}x${SIZE} ` +
  `(cut-out ${cut.width}x${cut.height} scaled to ${cutW}x${cutH}) ${kb}KB`
);