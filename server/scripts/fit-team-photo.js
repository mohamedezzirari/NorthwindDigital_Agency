/**
 * Crop a portrait photo down to the square used by the team grid.
 *
 * The team cards expect a square (matching assets/photo1-4.jpg), and the page
 * crops with object-fit anyway — so we pre-crop to keep the face well placed
 * and the file small instead of shipping the original phone photo.
 *
 *   node scripts/fit-team-photo.js <input> <output> [focusY] [focusX] [zoom] [size] [quality]
 *
 * focusY / focusX are the face position as a fraction of the image
 * (0 = top/left, 1 = bottom/right). zoom < 1 crops tighter than the full square,
 * which removes distracting background and makes the face larger.
 * size defaults to 480 (the 1x card size); pass 960 for retina displays.
 * Defaults: focusY 0.34, focusX 0.5, zoom 1, size 480, quality 82.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [, , input, output, ...rest] = process.argv;
if (!input || !output) {
  console.error(
    "usage: node scripts/fit-team-photo.js <input> <output> [focusY] [focusX] [zoom] [size] [quality]"
  );
  process.exit(1);
}

const num = (v, d) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : d);
const focusY = num(rest[0], 0.34);
const focusX = num(rest[1], 0.5);
const zoom = Math.min(Math.max(num(rest[2], 1), 0.3), 1);
const SIZE = Math.round(Math.min(Math.max(num(rest[3], 480), 64), 2000));
const QUALITY = Math.round(Math.min(Math.max(num(rest[4], 82), 40), 100));

const meta = await sharp(input).metadata();
const { width: w, height: h } = meta;

// Start from the largest centred square, then tighten by `zoom`.
let side = Math.min(w, h) * zoom;
let left = Math.round(w * focusX - side / 2);
let top = Math.round(h * focusY - (side * focusY) / zoom);

// Keep the crop inside the image; shrink it if the focus point is near an edge.
if (left < 0) { side += left * 2; left = 0; }
if (top < 0) { side += top * 2; top = 0; }
side = Math.round(Math.min(side, w - left, h - top));
left = Math.min(left, w - side);
top = Math.min(top, h - side);

await sharp(input)
  .extract({ left, top, width: Math.round(side), height: Math.round(side) })
  // lanczos3 keeps edges clean when the crop is scaled up to the target size.
  .resize(SIZE, SIZE, { fit: "cover", kernel: "lanczos3" })
  .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(output);

const out = fs.statSync(output);
console.log(
  `${path.basename(input)} ${w}x${h} -> ${path.basename(output)} ${SIZE}x${SIZE} ` +
  `(crop ${Math.round(side)}px at ${left},${top}; focus ${focusX},${focusY}; zoom ${zoom}; q${QUALITY}) ` +
  `${Math.round(out.size / 1024)}KB`
);