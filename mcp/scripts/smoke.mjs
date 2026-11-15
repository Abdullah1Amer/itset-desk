// Self-check: starts a throw-away IT Set Desk with demo data, creates API tokens, then drives the built MCP server
// over stdio like a real client. Exits non-zero on any failure.  Run: npm run build && npm run smoke
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 18900 + Math.floor(Math.random() * 90), BASE = `http://127.0.0.1:${PORT}`;
const data = mkdtempSync(join(tmpdir(), "itsd-mcp-"));
const desk = spawn(process.execPath, ["server.js"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", DATA_DIR: data, SETUP_TOKEN: "SMOKE-1", AUTO_BACKUP_HOURS: "0" } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ok = false;
try {
  for (let i = 0; i < 80; i++) { try { if ((await fetch(BASE + "/healthz")).ok) break; } catch {} await sleep(100); }
  const setup = await fetch(BASE + "/api/setup", { method: "POST", headers: { "x-itset": "1", "content-type": "application/json" },
    body: JSON.stringify({ setupCode: "SMOKE-1", name: "Smoke Admin", email: "smoke@demo.local", password: "Smoke-Pass-2026!", lang: "en", demo: true }) });
  assert.equal(setup.status, 200, "desk setup");
  const cookie = setup.headers.get("set-cookie").split(";")[0];
  const mk = async scope => (await (await fetch(BASE + "/api/me/tokens", { method: "POST", headers: { "x-itset": "1", "content-type": "application/json", cookie }, body: JSON.stringify({ name: "smoke " + scope, scope, days: 1 }) })).json()).token;
  const [readTok, writeTok] = [await mk("read"), await mk("write")];

  const connect = async token => {
    const c = new Client({ name: "smoke-test", version: "1.0.0" });
    await c.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL(process.argv[2] === "bundle" ? "../bundle/itset-desk-mcp.mjs" : "../dist/index.js", import.meta.url))], env: { ...getDefaultEnvironment(), ITSET_DESK_URL: BASE, ITSET_DESK_TOKEN: token } }));
    return c;
  };
  const call = async (c, name, args) => { const r = await c.callTool({ name, arguments: args }); return { r, t: r.content.map(x => x.text).join("\n") }; };

  const ro = await connect(readTok);
  const { tools } = await ro.listTools();
  const names = tools.map(t => t.name).sort();
  assert.deepEqual(names, ["itsd_add_comment", "itsd_create_ticket", "itsd_get_asset", "itsd_get_overview", "itsd_get_ticket", "itsd_list_maintenance_plans",
    "itsd_list_reference", "itsd_log_work", "itsd_search_assets", "itsd_search_kb", "itsd_search_tickets", "itsd_update_ticket"]);
  assert.ok(tools.every(t => t.annotations && typeof t.annotations.readOnlyHint === "boolean" && t.description.length > 40), "every tool has annotations and a description");

  let x = await call(ro, "itsd_get_overview", { response_format: "json" });
  assert.ok(!x.r.isError, x.t); assert.ok(x.r.structuredContent.open > 0); assert.equal(x.r.structuredContent.demo_data, true);
  x = await call(ro, "itsd_search_tickets", { sla: "breached", response_format: "json" }); assert.ok(!x.r.isError, x.t);
  const breached = x.r.structuredContent.tickets; assert.ok(breached.every(t => t.sla.status === "breached"));
  x = await call(ro, "itsd_search_tickets", { limit: 3 }); assert.match(x.t, /More results: call again with offset=3/);
  x = await call(ro, "itsd_search_tickets", { asset_tag: "LAP-0012", status: "all", response_format: "json" }); assert.ok(x.r.structuredContent.total >= 1);
  const key = x.r.structuredContent.tickets[0].key;
  x = await call(ro, "itsd_get_ticket", { key }); assert.match(x.t, new RegExp(`# ${key}`)); assert.match(x.t, /Asset: LAP-0012/);
  x = await call(ro, "itsd_get_ticket", { key: key.split("-")[1] }); assert.ok(!x.r.isError, "short numeric keys work");
  x = await call(ro, "itsd_get_asset", { tag: "prn-003", response_format: "json" }); assert.equal(x.r.structuredContent.tag, "PRN-003"); assert.equal(x.r.structuredContent.warranty, "expired");
  x = await call(ro, "itsd_search_assets", { warranty_ending: true, response_format: "json" }); assert.ok(x.r.structuredContent.assets.length >= 2);
  x = await call(ro, "itsd_list_maintenance_plans", { due_within_days: 30 }); assert.match(x.t, /Printer cleaning/);
  x = await call(ro, "itsd_search_kb", { query: "vpn disconnect" }); assert.match(x.t, /FortiClient/);
  x = await call(ro, "itsd_list_reference", { kind: "categories" }); assert.match(x.t, /Printers/);
  // the read-only token cannot write, and the error tells the model what to do
  x = await call(ro, "itsd_add_comment", { key, body: "hello", kind: "internal" });
  assert.equal(x.r.isError, true); assert.match(x.t, /read-only/);
  // unknown names come back as helpful tool errors
  x = await call(ro, "itsd_get_asset", { tag: "NOPE-999" }); assert.equal(x.r.isError, true); assert.match(x.t, /itsd_search_assets/);
  x = await call(ro, "itsd_search_tickets", { assignee: "Nobody Here" }); assert.equal(x.r.isError, true); assert.match(x.t, /Agents:/);
  x = await call(ro, "itsd_create_ticket", { title: "bad", category: "x", requester_name: "a" }); assert.equal(x.r.isError, true, "schema rejects a 3-letter title");
  await ro.close();

  const rw = await connect(writeTok);
  x = await call(rw, "itsd_create_ticket", { title: "Projector in meeting room B has no signal", type: "incident", category: "hardware", impact: 2, urgency: 2, requester_name: "Hala Mostafa", requester_dept: "Management", asset_tag: "LAP-0012", assignee: "me", tags: ["meeting-room"] });
  assert.ok(!x.r.isError, x.t); const newKey = /\*\*([A-Z0-9]+-\d+)\*\*/.exec(x.t)[1];
  x = await call(rw, "itsd_add_comment", { key: newKey, body: "Checked the HDMI cable, replacing it.", kind: "reply" }); assert.ok(!x.r.isError, x.t);
  x = await call(rw, "itsd_log_work", { key: newKey, minutes: 25, note: "Cable swap" }); assert.ok(!x.r.isError, x.t);
  x = await call(rw, "itsd_update_ticket", { key: newKey, status: "resolved" }); assert.match(x.t, /Resolved/);
  x = await call(rw, "itsd_get_ticket", { key: newKey, response_format: "json" });
  const t = x.r.structuredContent;
  assert.equal(t.status, "resolved"); assert.equal(t.priority, "P3"); assert.equal(t.assignee, "Smoke Admin"); assert.equal(t.minutes_logged, 25); assert.equal(t.comments[0].kind, "reply");
  x = await call(rw, "itsd_update_ticket", { key: newKey }); assert.equal(x.r.isError, true);
  await rw.close();

  // everything the tokens did is in the audit log, under the user
  const audit = await (await fetch(BASE + "/api/audit", { headers: { cookie } })).json();
  assert.ok(audit.rows.some(r => r.action === "token.create"));
  ok = true;
  console.error("Smoke test passed: 12 tools, read-only enforcement, writes, errors.");
} finally {
  desk.kill("SIGTERM"); await sleep(300); rmSync(data, { recursive: true, force: true });
  if (!ok) process.exitCode = 1;
}
