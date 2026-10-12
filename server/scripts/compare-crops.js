/**
 * Build a contact sheet of candidate crops so you can eyeball which framing is
 * right before committing one.
 *   node scripts/compare-crops.js <input> <out.jpg> <focusX,focusY,zoom> ...
 */
import sharp from "sharp";

const [, , input, output, ...specs] = process.argv;
const SIZE = 320;
const tiles = [];

for (const spec of specs) {
  const [fx, fy, zoom] = spec.split(",").map(Number);
  const meta = await sharp(input).metadata();
  const { width: w, height: h } = meta;

  let side = Math.min(w, h) * zoom;
  let left = Math.round(w * fx - side / 2);
  let top = Math.round(h * fy - (side * fy) / zoom);
  if (left < 0) { side += left * 2; left = 0; }
  if (top < 0) { side += top * 2; top = 0; }
  side = Math.round(Math.min(side, w - left, h - top));
  left = Math.min(left, w - side);
  top = Math.min(top, h - side);

  const buf = await sharp(input)
    .extract({ left, top, width: side, height: side })
    .resize(SIZE, SIZE, { fit: "cover" })
    .composite([{
      input: Buffer.from(
        `<svg width="${SIZE}" height="${SIZE}">
           <rect y="${SIZE - 34}" width="${SIZE}" height="34" fill="rgba(0,0,0,.72)"/>
           <text x="10" y="${SIZE - 11}" font-family="sans-serif" font-size="17" fill="#fff">
             x=${fx} y=${fy} z=${zoom}
           </text>
         </svg>`
      ),
      top: 0, left: 0,
    }])
    .jpeg({ quality: 80 })
    .toBuffer();
  tiles.push(buf);
}

await sharp({
  create: { width: SIZE * tiles.length, height: SIZE, channels: 3, background: "#111" },
})
  .composite(tiles.map((input, i) => ({ input, top: 0, left: i * SIZE })))
  .jpeg({ quality: 85 })
  .toFile(output);

console.log(`wrote ${output} (${tiles.length} variants)`);