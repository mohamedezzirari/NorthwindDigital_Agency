import express from "express";
import rateLimit from "express-rate-limit";
import {
  createLead,
  listLeads,
  getLead,
  setLeadStatus,
  leadStats,
} from "../db.js";
import { notifyNewLead } from "../notify.js";

const router = express.Router();

/* ---------- validation ----------
   Mirrors the client-side rules in js/main.js so bad input is rejected even if
   the form is bypassed. Each validator returns true or an error message. */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const trimmed = (v) => (typeof v === "string" ? v.trim() : "");

// The HTML form posts `msg` for the description; the API and database call it
// `message`. Accept either so the form and hand-written clients both work.
const FIELD_ALIASES = { message: ["message", "msg"] };

const validators = {
  name: (v) => trimmed(v).length > 1 || "Enter your name.",
  email: (v) => EMAIL_RE.test(trimmed(v)) || "Enter a valid email, like name@company.com.",
  service: (v) => trimmed(v).length > 0 || "Choose a service.",
  budget: (v) => trimmed(v).length > 0 || "Choose a budget range.",
  message: (v) => trimmed(v).length >= 20 || "Describe your project in at least 20 characters.",
};

function readField(body, field) {
  for (const key of FIELD_ALIASES[field] || [field]) {
    if (body?.[key] != null) return body[key];
  }
  return "";
}

function validate(body) {
  const data = {};
  const errors = {};
  for (const [field, check] of Object.entries(validators)) {
    const result = check(readField(body, field));
    if (result === true) data[field] = trimmed(readField(body, field));
    else errors[field] = result;
  }
  return { data, errors };
}

// Keep payloads small: these fields are all the form ever sends.
const LENGTH_CAPS = { name: 120, email: 254, service: 120, budget: 120, message: 5000 };

/* ---------- rate limiting ----------
   Generous enough that a real visitor can send a couple of follow-ups, tight
   enough to stop a script from filling the inbox. Override with
   RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_MIN (0 disables a limiter). */

const submitMax = Number(process.env.RATE_LIMIT_MAX ?? 10);
const submitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MIN ?? 60) * 60 * 1000;
const readMax = Number(process.env.RATE_LIMIT_READ_MAX ?? 60);

const limiter = (max, windowMs) => {
  // A limit of 0 (or less) disables the limiter entirely.
  if (!(max > 0)) return (_req, _res, next) => next();
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Too many requests. Please try again later." },
  });
};

const submitLimiter = limiter(submitMax, submitWindowMs);
const readLimiter = limiter(readMax, 60 * 1000);

/* ---------- routes ---------- */

/** Create a lead from the contact form. */
router.post("/", submitLimiter, async (req, res) => {
  // Honeypot: real users never see this field, bots fill in every input.
  if (req.body?.website) {
    // Pretend it worked so the bot learns nothing.
    return res.status(202).json({ ok: true, id: null });
  }

  const { data, errors } = validate(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ ok: false, errors });
  }

  for (const [field, max] of Object.entries(LENGTH_CAPS)) {
    if (data[field] && data[field].length > max) {
      return res.status(422).json({ ok: false, errors: { [field]: `Must be under ${max} characters.` } });
    }
  }

  const lead = createLead({
    ...data,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Email is best-effort: a failed notification must not lose the enquiry.
  notifyNewLead(lead).catch((err) => console.error("[notify] lead email failed:", err.message));

  res.status(201).json({
    ok: true,
    id: lead.id,
    message: `Thanks, ${lead.name}. We received your project details and will reply soon.`,
  });
});

/** List leads, newest first. */
router.get("/", readLimiter, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const { rows, total } = listLeads({ limit, offset, status: req.query.status });
  res.json({ ok: true, stats: leadStats(), leads: rows, total, limit, offset });
});

/** Counters for a dashboard. */
router.get("/stats", readLimiter, (_req, res) => {
  res.json({ ok: true, stats: leadStats() });
});

/** Fetch one lead. */
router.get("/:id", readLimiter, (req, res) => {
  const lead = getLead(Number(req.params.id));
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json({ ok: true, lead });
});

/** Update a lead's pipeline status: new | contacted | won | lost. */
router.patch("/:id", readLimiter, (req, res) => {
  const allowed = ["new", "contacted", "won", "lost"];
  const status = req.body?.status;
  if (!allowed.includes(status)) {
    return res.status(400).json({ ok: false, error: `status must be one of: ${allowed.join(", ")}` });
  }
  const lead = setLeadStatus(Number(req.params.id), status);
  if (!lead) return res.status(404).json({ ok: false, error: "Lead not found" });
  res.json({ ok: true, lead });
});

export default router;