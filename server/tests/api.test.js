/**
 * End-to-end API checks. Run the server first, then:  node tests/api.test.js
 */
const BASE = process.env.BASE || "http://127.0.0.1:3000";

let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ""}`);
  }
}

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

const validLead = {
  name: "Priya Sharma",
  email: "priya@example.com",
  service: "Website Development",
  budget: "₹50,000 – ₹2,00,000",
  msg: "We need a new marketing site with an online booking flow for our clinic.",
};

console.log("\n-- content api --");
{
  const { status, body } = await req("/api/content");
  check("GET /api/content returns 200", status === 200);
  const c = body?.content || {};
  check("has all 7 sections", ["config", "team", "services", "projects", "why", "steps", "testimonials"].every((k) => c[k] != null), Object.keys(c).join(","));
  check("projects loaded from config.js", Array.isArray(c.projects) && c.projects.length === 11, `got ${c.projects?.length}`);
  check("team loaded", Array.isArray(c.team) && c.team.length === 6, `got ${c.team?.length}`);
  check("services grouped by category", c.services?.Development && c.services?.["Digital Marketing"]);
  check("testimonials loaded (TESTS -> testimonials)", Array.isArray(c.testimonials) && c.testimonials.length === 3, `got ${c.testimonials?.length}`);
  check("config has agency name", c.config?.name === "Northwind Digital");

  const single = await req("/api/content/projects");
  check("GET /api/content/projects returns section", single.status === 200 && Array.isArray(single.body?.data));

  const missing = await req("/api/content/nope");
  check("unknown section 404s", missing.status === 404);
}

console.log("\n-- health --");
{
  const { status, body } = await req("/api/health");
  check("GET /api/health returns ok", status === 200 && body?.ok === true);
}

console.log("\n-- lead submission --");
let createdId = null;
{
  const { status, body } = await req("/api/leads", { method: "POST", body: JSON.stringify(validLead) });
  check("valid lead accepted (201)", status === 201, `got ${status}`);
  check("returns lead id", Number.isInteger(body?.id), JSON.stringify(body));
  check("returns friendly message", typeof body?.message === "string" && body.message.includes("Priya"));
  createdId = body?.id;
}

console.log("\n-- validation --");
{
  const bad = await req("/api/leads", { method: "POST", body: JSON.stringify({ name: "A", email: "nope", service: "", budget: "", msg: "short" }) });
  check("invalid lead rejected (422)", bad.status === 422, `got ${bad.status}`);
  const keys = Object.keys(bad.body?.errors || {});
  check("errors reported per field", ["name", "email", "service", "budget", "message"].every((k) => keys.includes(k)), keys.join(","));
}

console.log("\n-- honeypot --");
{
  const { status, body } = await req("/api/leads", { method: "POST", body: JSON.stringify({ ...validLead, website: "http://spam.example" }) });
  check("bot submission silently accepted (202)", status === 202, `got ${status}`);
  check("bot submission returns no id", body?.id === null);
}

console.log("\n-- lead listing --");
{
  const { status, body } = await req("/api/leads");
  check("GET /api/leads returns 200", status === 200);
  check("returns saved lead", body?.leads?.some((l) => l.id === createdId));
  check("returns stats", typeof body?.stats?.total === "number" && body.stats.total >= 1);
  check("honeypot lead was NOT stored", !body?.leads?.some((l) => l.email === validLead.email && l.id !== createdId) || body.leads.filter((l) => l.email === validLead.email).length === 1);

  const one = await req(`/api/leads/${createdId}`);
  check("GET /api/leads/:id returns lead", one.status === 200 && one.body?.lead?.id === createdId);

  const missing = await req("/api/leads/999999");
  check("unknown lead 404s", missing.status === 404);
}

console.log("\n-- status updates --");
{
  const patch = await req(`/api/leads/${createdId}`, { method: "PATCH", body: JSON.stringify({ status: "contacted" }) });
  check("status updates to contacted", patch.status === 200 && patch.body?.lead?.status === "contacted");

  const bad = await req(`/api/leads/${createdId}`, { method: "PATCH", body: JSON.stringify({ status: "bogus" }) });
  check("invalid status rejected (400)", bad.status === 400);
}

console.log("\n-- routing --");
{
  const home = await fetch(BASE + "/");
  const html = await home.text();
  check("GET / serves index.html", home.status === 200 && html.includes("Northwind"));

  const css = await fetch(BASE + "/css/styles.css");
  check("static assets served", css.status === 200);

  const bad = await req("/api/does-not-exist");
  check("unknown /api route 404s as json", bad.status === 404 && bad.body?.ok === false);
}

console.log("\n-- rate limiting --");
{
  // The suite runs with relaxed limits; assert the limiter is actually wired in
  // via the standard headers rather than exhausting the quota.
  const res = await fetch(BASE + "/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validLead),
  });
  check("submit responses carry rate-limit headers", Boolean(res.headers.get("ratelimit-limit")), `limit=${res.headers.get("ratelimit-limit")}`);
  const readRes = await fetch(BASE + "/api/leads");
  check("lead listings carry rate-limit headers", Boolean(readRes.headers.get("ratelimit-limit")));
  const contentRes = await fetch(BASE + "/api/content");
  check("content api stays cacheable (not rate limited)", !contentRes.headers.get("ratelimit-limit"));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail > 0 ? 1 : 0);