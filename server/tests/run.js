/**
 * Boots a throwaway server (own port, own temp database, rate limits relaxed)
 * and runs the API suite against it. Keeps the dev database untouched and makes
 * the suite repeatable.
 *   node tests/run.js
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, "..");
const PORT = process.env.TEST_PORT || 4180;

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "northwind-test-"));
console.log(`[test] scratch database: ${dataDir}\n`);

const child = spawn(process.execPath, ["server.js"], {
  cwd: serverDir,
  env: {
    ...process.env,
    PORT: String(PORT),
    HOST: "127.0.0.1",
    DATA_DIR: dataDir,
    RATE_LIMIT_MAX: "5000",
    RATE_LIMIT_READ_MAX: "5000",
  },
  stdio: ["ignore", "pipe", "inherit"],
});

let ready = false;
child.stdout.on("data", (buf) => {
  process.stdout.write(buf);
  if (buf.toString().includes("server running")) ready = true;
});

let cleanedUp = false;
/** Stop the child, wait for it to release the SQLite files, then remove the dir. */
async function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  if (child.exitCode === null && child.signalCode === null) {
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill();
    await exited;
  }
  // The server may take a moment to release its WAL/SHM files on Windows.
  try {
    fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch {
    console.warn(`[test] could not remove scratch dir ${dataDir} (safe to delete manually)`);
  }
}

process.on("exit", () => {
  if (!cleanedUp && child.exitCode === null) child.kill();
});
process.on("SIGINT", async () => {
  await cleanup();
  process.exit(130);
});

// Wait for the server to come up (max ~10s).
for (let i = 0; i < 100 && !ready; i++) {
  await new Promise((r) => setTimeout(r, 100));
}
if (!ready) {
  console.error("[test] server did not start in time");
  await cleanup();
  process.exit(1);
}

const test = spawn(process.execPath, ["tests/api.test.js"], {
  cwd: serverDir,
  env: { ...process.env, BASE: `http://127.0.0.1:${PORT}` },
  stdio: "inherit",
});

test.on("exit", async (code) => {
  await cleanup();
  process.exit(code ?? 1);
});