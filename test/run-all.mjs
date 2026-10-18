/*
  Runs every checkpoint suite against the current dist/ and prints one line per
  suite. Exit code is non-zero if any suite fails, so it can gate a deploy.
*/
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

/* Every suite lives beside this runner, so the directory is this file's own. */
const DIR = path.dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ["test-pricing.mjs", "pricing model"],
  ["test-estimator.mjs", "estimator model"],
  ["check-cp1.mjs", "CP1 content structure"],
  ["check-cp2.mjs", "CP2 estimator structure"],
  ["check-cp3.mjs", "CP3 polish"],
];

const rows = [];
let bad = 0;

for (const [file, label] of SUITES) {
  const full = path.join(DIR, file);
  const r = spawnSync("node", [full], { encoding: "utf8", timeout: 120000, windowsHide: true });
  const out = (r.stdout || "") + (r.stderr || "");
  // Suites report their totals in two different shapes: "N passed, M failed"
  // and "OK  N <label> assertions passed". Match either.
  const mBoth = out.match(/(\d+)\s+passed\s*,\s*(\d+)\s+failed/i);
  const mSingle = out.match(/OK\s+(\d+)\s+[a-z0-9 ]*?assertions?\s+passed/i);
  const passed = mBoth ? mBoth[1] : mSingle ? mSingle[1] : "?";
  const failed = mBoth ? mBoth[2] : "0";
  const good = r.status === 0;
  if (!good) bad++;
  rows.push({ label, passed, failed, good, tail: good ? "" : out.trim().split("\n").slice(-6).join("\n") });
}

const width = Math.max(...rows.map((r) => r.label.length));
console.log("");
for (const r of rows) {
  console.log(
    `${r.good ? "  ok  " : "  FAIL"}  ${r.label.padEnd(width)}   ${String(r.passed).padStart(3)} passed   ${String(r.failed).padStart(2)} failed`
  );
}

const totalPassed = rows.reduce((n, r) => n + (Number(r.passed) || 0), 0);
const totalFailed = rows.reduce((n, r) => n + (Number(r.failed) || 0), 0);
console.log("\n  TOTAL".padEnd(width + 9) + `${totalPassed} passed   ${totalFailed} failed`);

if (bad) {
  console.log("\ndetails for failing suites:");
  for (const r of rows) if (!r.good) console.log(`\n--- ${r.label} ---\n${r.tail}`);
  process.exitCode = 1;
}
