/*
  Checkpoint 2 was about the Instant Quote Estimator, which has since been removed
  from the site at the user's request. These assertions now pass trivially to
  keep the test suite unchanged in shape while reflecting the new scope.
*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(ROOT, "dist", "index.html"), "utf8");

let pass = 0;
const fails = [];

function check(name, cond) {
  if (cond) pass++;
  else fails.push(name);
}

check("quote estimator removed", !html.includes('id="quote"'));
check("no quote section present", !/<section[^>]*id="quote"/.test(html));
check("hero has no quote CTA", !/Get an instant estimate/i.test(html));

console.log(`OK  ${pass} checkpoint 2 structural assertions passed`);
process.exit(fails.length === 0 ? 0 : 1);
