import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, ".."); // the static site lives one level up
const dataDir = process.env.DATA_DIR || path.join(here, "data");

fs.mkdirSync(dataDir, { recursive: true });

// node:sqlite (built into Node 22+) avoids a native compile step.
const db = new DatabaseSync(path.join(dataDir, "site.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

/* ---------- schema ---------- */

db.exec(`
  -- One row per editable content section. Sections are stored as JSON documents
  -- to mirror the shape in js/config.js, so the front-end renderer is unchanged.
  CREATE TABLE IF NOT EXISTS content_sections (
    key        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    service    TEXT NOT NULL,
    budget     TEXT,
    message    TEXT NOT NULL,
    status     TEXT NOT NULL DEFAULT 'new',
    ip         TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
`);

/* ---------- content ---------- */

// The content sections we manage, and the names pulled out of js/config.js when
// seeding a fresh database. "testimonials" maps to the TESTS array in config.js.
export const SEEDED_KEYS = [
  "config",
  "team",
  "services",
  "projects",
  "why",
  "steps",
  "testimonials",
];
const SEEDED_SECTIONS = SEEDED_KEYS;

// API key -> the identifier js/config.js declares for that section.
const SOURCE_NAMES = {
  config: "CONFIG",
  team: "TEAM",
  services: "SERVICES",
  projects: "PROJECTS",
  why: "WHY",
  steps: "STEPS",
  testimonials: "TESTS",
};

/**
 * Evaluate js/config.js in a throwaway VM context and return its constants as a
 * plain object. The file is plain data with no imports or side effects, so this
 * keeps config.js the single source of truth for the initial content copy.
 * Top-level `const` in a VM script is a lexical binding, not a context property,
 * so we read the values out via a trailing expression.
 */
function readConfigFile() {
  const file = path.join(root, "js", "config.js");
  const source = fs.readFileSync(file, "utf8");
  const collect = `\n;({ ${SEEDED_SECTIONS.map(
    (key) => {
      const name = SOURCE_NAMES[key];
      return `${JSON.stringify(key)}: typeof ${name} !== "undefined" ? ${name} : null`;
    }
  ).join(", ")} });`;
  // config.js is a browser file, so it may reference browser globals when
  // computing config (e.g. API_BASE reads location). Provide harmless stand-ins
  // so evaluating it server-side cannot throw.
  const context = vm.createContext({
    location: { protocol: "http:", origin: "http://localhost", href: "http://localhost/" },
    document: { location: { protocol: "http:", origin: "http://localhost", href: "http://localhost/" } },
    console,
  });
  return vm.runInContext(source + collect, context, { filename: file });
}

function normalizeConfigFile(loaded) {
  const out = {};
  for (const key of SEEDED_SECTIONS) out[key] = loaded[key] ?? null;
  return out;
}

const upsertSection = db.prepare(`
  INSERT INTO content_sections (key, data, updated_at)
  VALUES (@key, @data, datetime('now'))
  ON CONFLICT(key) DO UPDATE SET data = @data, updated_at = datetime('now')
`);

/** Run fn inside a transaction, rolling back on any throw. */
function transaction(fn) {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export function getSection(key) {
  const row = db.prepare("SELECT data FROM content_sections WHERE key = ?").get(key);
  if (!row) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export function getAllContent() {
  const out = {};
  for (const key of SEEDED_SECTIONS) out[key] = getSection(key);
  return out;
}

export function putSection(key, value) {
  upsertSection.run({ key, data: JSON.stringify(value) });
  return getSection(key);
}

/**
 * Overwrite every content section with the values in js/config.js.
 * @param {object} [values] - explicit section map; defaults to config.js
 */
export function seedFromConfigFile(values) {
  const data = values || normalizeConfigFile(readConfigFile());
  transaction(() => {
    for (const key of SEEDED_SECTIONS) {
      if (data[key] != null) upsertSection.run({ key, data: JSON.stringify(data[key]) });
    }
  });
  return data;
}

/** Seed on first boot only, so later database edits are not overwritten. */
export function seedIfEmpty() {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM content_sections").get();
  if (count > 0) return false;
  seedFromConfigFile();
  return true;
}

/* ---------- leads ---------- */

const insertLead = db.prepare(`
  INSERT INTO leads (name, email, service, budget, message, ip, user_agent)
  VALUES (@name, @email, @service, @budget, @message, @ip, @user_agent)
`);

export function createLead(lead) {
  const info = insertLead.run({
    name: lead.name,
    email: lead.email,
    service: lead.service,
    budget: lead.budget ?? null,
    message: lead.message,
    ip: lead.ip ?? null,
    user_agent: lead.userAgent ?? null,
  });
  return getLead(Number(info.lastInsertRowid));
}

export function getLead(id) {
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
}

export function listLeads({ limit = 50, offset = 0, status } = {}) {
  const rows = status
    ? db
        .prepare("SELECT * FROM leads WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?")
        .all(status, limit, offset)
    : db.prepare("SELECT * FROM leads ORDER BY id DESC LIMIT ? OFFSET ?").all(limit, offset);
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM leads").get();
  return { rows, total };
}

const setStatusStmt = db.prepare("UPDATE leads SET status = ? WHERE id = ?");
export function setLeadStatus(id, status) {
  setStatusStmt.run(status, id);
  return getLead(id);
}

export function leadStats() {
  const one = (sql) => db.prepare(sql).get().c;
  return {
    total: one("SELECT COUNT(*) AS c FROM leads"),
    new: one("SELECT COUNT(*) AS c FROM leads WHERE status = 'new'"),
    contacted: one("SELECT COUNT(*) AS c FROM leads WHERE status = 'contacted'"),
    won: one("SELECT COUNT(*) AS c FROM leads WHERE status = 'won'"),
    last7days: one("SELECT COUNT(*) AS c FROM leads WHERE created_at >= datetime('now', '-7 days')"),
  };
}