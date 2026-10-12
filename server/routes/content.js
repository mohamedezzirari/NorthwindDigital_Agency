import express from "express";
import { getAllContent, getSection, putSection, SEEDED_KEYS } from "../db.js";

const router = express.Router();

/** Public: the whole site content in one request. */
router.get("/", (_req, res) => {
  res.json({ ok: true, content: getAllContent() });
});

/** Public: a single section, e.g. /api/content/projects */
router.get("/:key", (req, res) => {
  const { key } = req.params;
  if (!SEEDED_KEYS.includes(key)) {
    return res.status(404).json({ ok: false, error: `Unknown content section: ${key}` });
  }
  const data = getSection(key);
  if (data == null) {
    return res.status(404).json({ ok: false, error: `Section "${key}" is empty` });
  }
  res.json({ ok: true, key, data });
});

/**
 * Write a section. Kept unauthenticated for now so the site can be edited
 * without a login; put this behind an auth middleware or remove it before
 * exposing the server publicly. See README "Securing the API".
 */
router.put("/:key", (req, res) => {
  const { key } = req.params;
  if (!SEEDED_KEYS.includes(key)) {
    return res.status(400).json({ ok: false, error: `Cannot write unknown section: ${key}` });
  }
  const data = putSection(key, req.body?.data);
  res.json({ ok: true, key, data });
});

export default router;