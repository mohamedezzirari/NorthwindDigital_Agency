// Sample the dominant non-white colour in an image.
import sharp from "sharp";

const file = process.argv[2];
const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const counts = new Map();
for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const r = data[o], g = data[o + 1], b = data[o + 2];
  const a = channels === 4 ? data[o + 3] : 255;
  if (a < 128) continue;
  // Skip near-white / near-black
  if (r > 235 && g > 235 && b > 235) continue;
  if (r < 30 && g < 30 && b < 30) continue;
  const key = `${Math.round(r / 8) * 8},${Math.round(g / 8) * 8},${Math.round(b / 8) * 8}`;
  counts.set(key, (counts.get(key) || 0) + 1);
}

const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
for (const [rgb, n] of top) {
  const [r, g, b] = rgb.split(",").map(Number);
  const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  console.log(`${hex}  rgb(${r},${g},${b})  ${n} px`);
}