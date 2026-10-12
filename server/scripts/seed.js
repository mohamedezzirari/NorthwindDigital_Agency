/**
 * Re-seed every content section from js/config.js, discarding database edits.
 *   node scripts/seed.js
 */
import { seedFromConfigFile, getAllContent } from "../db.js";

seedFromConfigFile();
const content = getAllContent();
console.log("[seed] content sections reset from js/config.js:");
for (const [key, value] of Object.entries(content)) {
  const count = Array.isArray(value)
    ? `${value.length} items`
    : value && typeof value === "object"
      ? `${Object.keys(value).length} keys`
      : "ok";
  console.log(`  - ${key}: ${count}`);
}