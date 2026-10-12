import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

import { seedIfEmpty } from "./db.js";
import contentRoutes from "./routes/content.js";
import leadsRoutes from "./routes/leads.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, ".."); // the static site lives one level up

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // correct client IPs behind a proxy/load balancer

app.use(express.json({ limit: "100kb" }));

// Seed content on first boot so the API has something to serve.
if (seedIfEmpty()) console.log("[db] Seeded content sections from js/config.js");

// API
app.use("/api/content", contentRoutes);
app.use("/api/leads", leadsRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Static site (index.html, css/, js/, assets/). Express serves index.html for "/".
app.use(express.static(root));

// 404 for unknown API routes; anything else falls through to the SPA-ish index.
app.use("/api", (_req, res) => res.status(404).json({ ok: false, error: "Not found" }));
app.use((req, res) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(root, "index.html"));
  }
  res.status(404).json({ ok: false, error: "Not found" });
});

// Final error handler: keep API failures as JSON instead of Express's HTML
// error page (which is what a malformed JSON body would otherwise produce).
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error("[server]", err.message);
  const message =
    err.type === "entity.parse.failed"
      ? "Invalid JSON body"
      : err.type === "entity.too.large"
        ? "Request body too large"
        : status >= 500
          ? "Unexpected server error"
          : err.message;
  if (req.path.startsWith("/api")) {
    return res.status(status).json({ ok: false, error: message });
  }
  res.status(status).type("text/plain").send(message);
});

app.listen(PORT, HOST, () => {
  console.log(`Northwind server running at http://${HOST}:${PORT}`);
  console.log(`  site  → http://${HOST}:${PORT}/`);
  console.log(`  api   → http://${HOST}:${PORT}/api/content`);
});