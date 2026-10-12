// Read JPEG/PNG dimensions without any dependencies.
import fs from "node:fs";
import path from "node:path";

function dims(file) {
  const buf = fs.readFileSync(file);

  // PNG: 8-byte signature, then IHDR width/height at offsets 16 and 20.
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: "png" };
  }

  // JPEG: walk the marker segments to the SOFn frame header.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0..SOF15, skipping the non-frame markers in that range.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: "jpeg" };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return { w: 0, h: 0, type: "unknown" };
}

const files = process.argv.slice(2);
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`${path.basename(f)}: MISSING`); continue; }
  const { w, h, type } = dims(f);
  const kb = Math.round(fs.statSync(f).size / 1024);
  const ar = h ? (w / h).toFixed(3) : "-";
  console.log(`${path.basename(f).padEnd(46)} ${String(w).padStart(5)}x${String(h).padEnd(5)} ${type}  ar=${ar}  ${kb}KB`);
}