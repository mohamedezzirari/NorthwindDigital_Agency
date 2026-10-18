// Round-trip check on the generated card: inflate it back and probe the pixels
// so a silently corrupt or blank PNG cannot slip through.
import fs from "node:fs";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(ROOT, "public", "assets", "og.png");
const b = fs.readFileSync(file);

const problems = [];

// Signature
const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
if (!sig.every((s, i) => b[i] === s)) problems.push("bad PNG signature");
else console.log("signature   ok");

// Walk chunks
let pos = 8;
let w = 0;
let h = 0;
let type = 0;
let interlace = 1;
const idat = [];
const seen = [];
while (pos < b.length) {
  const len = b.readUInt32BE(pos);
  const name = b.toString("ascii", pos + 4, pos + 8);
  seen.push(name);
  if (name === "IHDR") {
    w = b.readUInt32BE(pos + 8);
    h = b.readUInt32BE(pos + 12);
    type = b[pos + 8 + 9];
    interlace = b[pos + 8 + 12];
  }
  if (name === "IDAT") idat.push(b.subarray(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
console.log("chunks      " + seen.join(", "));

if (w !== 1200 || h !== 630) problems.push(`size ${w}x${h}, expected 1200x630`);
else console.log(`size        ${w}x${h}  ok`);
if (type !== 6) problems.push("colour type " + type + ", expected 6 (RGBA)");
else console.log("colour type 6 (RGBA)  ok");
if (interlace !== 0) problems.push("interlaced output");
else console.log("interlace   none  ok");

const raw = zlib.inflateSync(Buffer.concat(idat));
const stride = w * 4;
if (raw.length !== (stride + 1) * h)
  problems.push(`inflated ${raw.length}, expected ${(stride + 1) * h}`);
else console.log(`inflate     ${raw.length} bytes  ok`);

// Rebuild the pixels (our encoder only ever writes filter 0).
const px = Buffer.alloc(stride * h);
for (let y = 0; y < h; y++) {
  const ft = raw[y * (stride + 1)];
  if (ft !== 0) problems.push("row " + y + " uses filter " + ft);
  raw.copy(px, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
}

const at = (x, y) => {
  const d = (y * w + x) * 4;
  return [px[d], px[d + 1], px[d + 2], px[d + 3]];
};
const hex = (c) => "#" + c.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");

console.log("\nsamples:");
const probes = {
  "left rail (0,300)   expect lime  #d1fe17": [0, 300],
  "ground   (600,60)   expect black #000000": [600, 60],
  "top-left (40,40)    expect black": [40, 40],
  "bottom-r (1180,560) expect black": [1180, 560],
  "centre   (600,280)  expect wordmark ink": [600, 280],
};
for (const [label, [x, y]] of Object.entries(probes)) {
  console.log("  " + label + "  ->  " + hex(at(x, y)));
}

// The rail must actually be the lime accent.
const rail = at(8, 300);
if (!(rail[0] > 180 && rail[1] > 200 && rail[2] < 90))
  problems.push("left rail is not the #D1FE17 accent: " + hex(rail));

// The ground must be the black the hero paints.
const ground = at(600, 60);
if (!(ground[0] < 12 && ground[1] < 12 && ground[2] < 12))
  problems.push("ground is not #000000: " + hex(ground));

// Count distinct colours and check the wordmark band has ink on it.
const distinct = new Set();
let inkPixels = 0;
for (let y = 0; y < h; y += 3) {
  for (let x = 0; x < w; x += 3) {
    const c = at(x, y);
    distinct.add(c[0] + "," + c[1] + "," + c[2]);
    // Bright pixels well above the navy ground == the wordmark.
    if (c[0] > 150 && c[1] > 150 && c[2] > 150) inkPixels++;
  }
}
console.log("\ndistinct colours sampled : " + distinct.size);
console.log("bright (wordmark) pixels : " + inkPixels);

if (distinct.size < 8) problems.push("only " + distinct.size + " colours — looks blank");
if (inkPixels < 200) problems.push("wordmark not visible (" + inkPixels + " bright pixels)");

console.log("\n==========================");
if (problems.length === 0) console.log("og.png VALID");
else {
  console.log("PROBLEMS:");
  for (const p of problems) console.log("  - " + p);
  process.exitCode = 1;
}
