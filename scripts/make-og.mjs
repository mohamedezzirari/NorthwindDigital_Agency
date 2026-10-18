/*
  Generates public/assets/og.png — the social preview card.

  There is no image library in this project (and adding one to build a single
  static asset would be a heavy price), so this decodes the logo and encodes
  the card with Node's built-in zlib alone. PNG is just zlib with a framing
  layer: chunks, each with a CRC32, wrapping filtered scanlines.

  Card design follows the site's REAL tokens. src/styles/main.css declares a
  blue/mint palette at :root on line 1, then re-declares the whole set on line
  125 with the black/lime scheme — and because that later rule matches equally
  specific selectors, it is the one that wins in every colour scheme. The live
  site is therefore:

    --deep  #000000  page ground (the hero paints this)
    --brand #D1FE17  primary action
    --mint  #D1FE17  accent / focus ring
    --ink   #F4F4F0  body text

  The bar row at the bottom right echoes the hero's chart, which is a
  lime-to-blue gradient.
*/
import fs from "node:fs";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const W = 1200;
const H = 630;

/* Resolved from this file so the generator works from any working directory
   and on any platform, not just the machine that authored it. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGO = path.join(ROOT, "public", "assets", "logo.png");
const OUT = path.join(ROOT, "public", "assets", "og.png");

const DEEP = [0x00, 0x00, 0x00];
const BRAND = [0xd1, 0xfe, 0x17];
const MINT = [0xd1, 0xfe, 0x17];

/* ------------------------------------------------------------------ CRC32 */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/* ------------------------------------------------------------------ decode */
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function unfilter(buf, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const ft = buf[pos++];
    const row = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const raw = buf[pos + x];
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v;
      if (ft === 0) v = raw;
      else if (ft === 1) v = raw + a;
      else if (ft === 2) v = raw + b;
      else if (ft === 3) v = raw + ((a + b) >> 1);
      else if (ft === 4) v = raw + paeth(a, b, c);
      else throw new Error("unsupported PNG filter " + ft);
      row[x] = v & 0xff;
    }
    pos += stride;
  }
  return out;
}

/** Decode any 8-bit non-interlaced PNG to RGBA. */
function decodePNG(file) {
  const b = fs.readFileSync(file);
  if (!(b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47))
    throw new Error("not a PNG: " + file);

  let pos = 8;
  let w = 0;
  let h = 0;
  let depth = 0;
  let type = 0;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (pos < b.length) {
    const len = b.readUInt32BE(pos);
    const name = b.toString("ascii", pos + 4, pos + 8);
    const data = b.subarray(pos + 8, pos + 8 + len);
    if (name === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      type = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG not supported");
    } else if (name === "PLTE") palette = Buffer.from(data);
    else if (name === "tRNS") transparency = Buffer.from(data);
    else if (name === "IDAT") idat.push(Buffer.from(data));
    else if (name === "IEND") break;
    pos += 12 + len;
  }

  if (depth !== 8) throw new Error("only 8-bit PNGs supported, got " + depth);

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels) throw new Error("unsupported colour type " + type);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rows = unfilter(raw, w, h, channels);

  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const s = i * channels;
    let r;
    let g;
    let bl;
    let a = 255;
    if (type === 6) {
      [r, g, bl, a] = [rows[s], rows[s + 1], rows[s + 2], rows[s + 3]];
    } else if (type === 2) {
      [r, g, bl] = [rows[s], rows[s + 1], rows[s + 2]];
    } else if (type === 0) {
      r = g = bl = rows[s];
    } else if (type === 4) {
      r = g = bl = rows[s];
      a = rows[s + 1];
    } else {
      const p = rows[s] * 3;
      [r, g, bl] = [palette[p], palette[p + 1], palette[p + 2]];
      if (transparency && rows[s] < transparency.length) a = transparency[rows[s]];
    }
    const d = i * 4;
    rgba[d] = r;
    rgba[d + 1] = g;
    rgba[d + 2] = bl;
    rgba[d + 3] = a;
  }
  return { w, h, data: rgba };
}

/* ------------------------------------------------------------------ canvas */
function canvas(w, h, rgb) {
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return { w, h, data };
}

/** Source-over composite of src onto dst at (x, y). */
function draw(dst, src, x, y, alpha = 1) {
  for (let sy = 0; sy < src.h; sy++) {
    const dy = y + sy;
    if (dy < 0 || dy >= dst.h) continue;
    for (let sx = 0; sx < src.w; sx++) {
      const dx = x + sx;
      if (dx < 0 || dx >= dst.w) continue;
      const s = (sy * src.w + sx) * 4;
      const d = (dy * dst.w + dx) * 4;
      const sa = (src.data[s + 3] / 255) * alpha;
      if (sa <= 0) continue;
      const da = dst.data[d + 3] / 255;
      const oa = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        dst.data[d + c] = Math.round(
          (src.data[s + c] * sa + dst.data[d + c] * da * (1 - sa)) / oa
        );
      }
      dst.data[d + 3] = Math.round(oa * 255);
    }
  }
}

/** Filled rectangle, optionally with per-pixel alpha. */
function rect(img, x0, y0, w, h, rgb, alpha = 1) {
  const sub = canvas(w, h, rgb);
  draw(img, sub, x0, y0, alpha);
}

/** Nearest-neighbour rescale — fine for a wordmark, and avoids a filter lib. */
function scale(img, w, h) {
  const out = canvas(w, h, [0, 0, 0]);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.h - 1, Math.floor((y * img.h) / h));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.w - 1, Math.floor((x * img.w) / w));
      const s = (sy * img.w + sx) * 4;
      const d = (y * w + x) * 4;
      out.data[d] = img.data[s];
      out.data[d + 1] = img.data[s + 1];
      out.data[d + 2] = img.data[s + 2];
      out.data[d + 3] = img.data[s + 3];
    }
  }
  return out;
}

/* ------------------------------------------------------------------ encode */
function encodePNG(img) {
  const stride = img.w * 4;
  const raw = Buffer.alloc((stride + 1) * img.h);
  for (let y = 0; y < img.h; y++) {
    raw[y * (stride + 1)] = 0; // filter: None — flat art compresses best unfiltered
    img.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------- build */
const logo = decodePNG(LOGO);

// How visible is the wordmark? Scrubs decide whether it reads on navy.
let lumSum = 0;
let opaque = 0;
let alphaSum = 0;
for (let i = 0; i < logo.w * logo.h; i++) {
  const d = i * 4;
  alphaSum += logo.data[d + 3];
  if (logo.data[d + 3] > 128) {
    lumSum += 0.2126 * logo.data[d] + 0.7152 * logo.data[d + 1] + 0.0722 * logo.data[d + 2];
    opaque++;
  }
}
const luminance = opaque ? lumSum / opaque : 0;
const coverage = alphaSum / (logo.w * logo.h * 255);

console.log(`logo       : ${logo.w}x${logo.h}`);
console.log(`opacity    : ${(coverage * 100).toFixed(1)}% of the box is painted`);
console.log(`luminance  : ${luminance.toFixed(0)} / 255  (${luminance > 128 ? "LIGHT" : "DARK"} ink)`);

const card = canvas(W, H, DEEP);

// Brand rail down the left edge.
rect(card, 0, 0, 16, H, MINT);

// A dimmed echo of the hero chart, bottom right.
const bars = [0.35, 0.5, 0.42, 0.66, 0.58, 0.82, 1];
const barW = 26;
const gap = 14;
const baseY = H - 56;
const startX = W - 60 - (bars.length * barW + (bars.length - 1) * gap);
bars.forEach((f, i) => {
  const h = Math.round(24 + f * 108);
  // The tallest bar is drawn at full strength; the rest sit back.
  rect(card, startX + i * (barW + gap), baseY - h, barW, h, BRAND, i === bars.length - 1 ? 1 : 0.28);
});

// Wordmark, centred slightly above the optical middle.
const targetW = 460;
const targetH = Math.round((logo.h * targetW) / logo.w);
const wordmark = scale(logo, targetW, targetH);
const lx = Math.round((W - targetW) / 2);
const ly = Math.round((H - targetH) / 2) - 34;

if (luminance < 128) {
  // Dark ink would vanish on navy: back it with a soft light plate.
  const padX = 64;
  const padY = 48;
  rect(card, lx - padX, ly - padY, targetW + padX * 2, targetH + padY * 2, [0xff, 0xff, 0xff], 0.94);
}
draw(card, wordmark, lx, ly);

const png = encodePNG(card);
fs.writeFileSync(OUT, png);
console.log(`\nwrote ${OUT}`);
console.log(`      ${W}x${H}, ${(png.length / 1024).toFixed(1)} KiB`);
console.log(`      ratio ${(W / H).toFixed(3)} (og:image wants ~1.91)`);
