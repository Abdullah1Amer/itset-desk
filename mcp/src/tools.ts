/*! IT Set Desk MCP server — © 2026 Abdullah Amer. Proprietary, see ../LICENSE. */
import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { C, CHARACTER_LIMIT, deskRequest, getBoot, invalidate, type Ticket } from "./desk.js";
import {
  agentName, assetTag, catName, dur, fitList, iso, norm, ownerOf, resolveAgent, resolveAsset, resolveCategory, resolveTicket,
  slaText, teamName, ticketRow, ticketUrl, when
} from "./lookup.js";

enum Fmt { MARKDOWN = "markdown", JSON = "json" }
const fmtArg = z.enum(Fmt).default(Fmt.MARKDOWN).describe("'markdown' for readable text (default), 'json' for structured data");
const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } as const;
const STATUSES = ["new", "progress", "pending", "resolved", "closed"] as const;
const TYPES = ["incident", "request", "problem", "change"] as const;
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const json = (data: Record<string, unknown>) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data });
const STATUS_LABEL: Record<string, string> = { new: "New", progress: "In progress", pending: "Pending (waiting for requester)", resolved: "Resolved", closed: "Closed" };

export function registerTools(server: McpServer): void {
  /* ===================== tickets: read ===================== */
  server.registerTool("itsd_search_tickets", {
    title: "Search tickets",
    description: `Search and filter IT Set Desk support tickets. Returns one page of tickets with key, title, status, priority (P1 = most urgent), assignee, requester, linked asset and SLA state.

Defaults to OPEN tickets (new, in progress, pending) sorted by last update. Every filter is optional and they combine (AND).
Examples:
  - "What is assigned to me?" -> assignee="me"
  - "Which tickets breached their SLA?" -> sla="breached"
  - "Open P1 incidents" -> priority=1, type="incident"
  - "Tickets about the VPN this month" -> query="vpn", status="all"
  - "Everything on laptop LAP-0012" -> asset_tag="LAP-0012", status="all"
Use itsd_get_ticket for the full conversation of one ticket.`,
    inputSchema: z.strictObject({
      query: z.string().max(200).optional().describe("Text to match in key, title, description, requester name/email or tags"),
      status: z.enum(["open", "all", ...STATUSES]).default("open").describe("'open' (default) = new+progress+pending; 'all'; or one exact status"),
      priority: z.number().int().min(1).max(4).optional().describe("Exact priority: 1 (critical) … 4 (low)"),
      type: z.enum(TYPES).optional().describe("Ticket type"),
      assignee: z.string().max(120).optional().describe("'me', 'unassigned', or an agent name/email"),
      asset_tag: z.string().max(40).optional().describe("Only tickets linked to this asset tag, e.g. 'PRN-003'"),
      sla: z.enum(["breached", "at_risk"]).optional().describe("Only open tickets whose resolution SLA is breached / at risk"),
      preventive: z.boolean().optional().describe("true = only tickets opened by preventive maintenance plans; false = exclude them"),
      sort: z.enum(["updated", "created", "priority", "sla_due"]).default("updated").describe("Sort order (newest/most urgent first)"),
      limit: z.number().int().min(1).max(100).default(20).describe("Maximum tickets to return"),
      offset: z.number().int().min(0).default(0).describe("Tickets to skip, for pagination"),
      response_format: fmtArg
    }),
    annotations: READ
  }, async (a, ctx) => {
    const { boot, now } = await getBoot(ctx.mcpReq.signal); const S = boot.state;
    const q = norm(a.query);
    const who = a.assignee !== undefined ? resolveAgent(boot, a.assignee) : undefined;
    const asset = a.asset_tag ? resolveAsset(S, a.asset_tag) : null;
    let list = S.tickets.filter(x => {
      if (a.status === "open" ? !C.isOpen(x) : a.status !== "all" && x.status !== a.status) return false;
      if (a.priority && x.priority !== a.priority) return false;
      if (a.type && x.type !== a.type) return false;
      if (who !== undefined && (x.assigneeId || null) !== who) return false;
      if (asset && x.assetId !== asset.id) return false;
      if (a.preventive !== undefined && !!x.planId !== a.preventive) return false;
      if (a.sla) { if (!C.isOpen(x)) return false; const s = C.sla(S, x, now).st; if (a.sla === "breached" ? s !== "breached" : s !== "risk") return false; }
      if (q && ![x.key, x.title, x.desc, x.requester?.name, x.requester?.email, ...(x.tags || [])].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
    const key: Record<string, (x: Ticket) => number> = { updated: x => -x.updatedAt, created: x => -x.createdAt, priority: x => x.priority * 1e13 - x.updatedAt, sla_due: x => C.sla(S, x, now).due };
    list = list.sort((p, r) => key[a.sort](p) - key[a.sort](r));
    const total = list.length, pageRaw = list.slice(a.offset, a.offset + a.limit);
    const render = (part: Ticket[]) => {
      const next = a.offset + part.length, more = total > next;
      if (a.response_format === Fmt.JSON) return JSON.stringify({ total, count: part.length, offset: a.offset, has_more: more, ...(more ? { next_offset: next } : {}), tickets: part.map(x => ticketRow(S, x, now)) }, null, 2);
      const lines = [`# Tickets — ${total} match${total === 1 ? "" : "es"}`, total ? `Showing ${a.offset + 1}–${a.offset + part.length}.` : "No tickets match. Try status='all' or fewer filters.", ""];
      for (const x of part) {
        const s = C.sla(S, x, now);
        lines.push(`- **${x.key}** · P${x.priority} · ${STATUS_LABEL[x.status] || x.status} · ${x.title}`,
          `  ${x.type} · ${catName(S, x.categoryId)} · assignee: ${agentName(S, x.assigneeId)} · requester: ${x.requester?.name || "—"}${x.assetId ? ` · asset: ${assetTag(S, x.assetId)}` : ""} · SLA: ${slaText(s.st, s.rem)} · updated ${when(S, x.updatedAt)}`);
      }
      if (more) lines.push("", `More results: call again with offset=${next}.`);
      return lines.join("\n");
    };
    const fit = fitList(pageRaw, render, CHARACTER_LIMIT);
    if (a.response_format === Fmt.JSON) return json(JSON.parse(fit.text) as Record<string, unknown>);
    return text(fit.text);
  });

  server.registerTool("itsd_get_ticket", {
    title: "Get ticket",
    description: "Get one ticket by key (e.g. 'ITS-1024' or just '1024'): description, SLA, requester, linked asset, the conversation (replies to the requester, internal notes, requester messages), checklist, time logged and linked tickets. Use itsd_search_tickets to find keys.",
    inputSchema: z.strictObject({
      key: z.string().min(1).max(40).describe("Ticket key, e.g. 'ITS-1024'"),
      max_comments: z.number().int().min(0).max(100).default(30).describe("Most recent comments to include"),
      response_format: fmtArg
    }),
    annotations: READ
  }, async ({ key, max_comments, response_format }, ctx) => {
    const { boot, now } = await getBoot(ctx.mcpReq.signal); const S = boot.state;
    const x = resolveTicket(S, key); const s = C.sla(S, x, now), r = C.resp(S, x, now);
    const comments = x.comments.slice(-max_comments);
    const logged = x.worklogs.reduce((n, w) => n + (+w.min || 0), 0);
    const links = x.links.map(id => S.tickets.find(t => t.id === id)).filter((t): t is Ticket => !!t);
    const asset = x.assetId ? S.assets.find(z2 => z2.id === x.assetId) : undefined;
    const by = (id: string) => (id === "requester" ? x.requester?.name || "Requester" : agentName(S, id));
    if (response_format === Fmt.JSON) {
      return json({
        ...ticketRow(S, x, now), description: x.desc, impact: x.impact, urgency: x.urgency,
        requester: x.requester, first_response_sla: { status: r.st, due: iso(r.due) }, resolved: iso(x.resolvedAt), closed: iso(x.closedAt), csat: x.csat,
        asset: asset ? { tag: asset.tag, name: asset.name, type: asset.type, status: asset.status } : null,
        preventive_due: x.pmDue || null,
        comments: comments.map(c => ({ at: iso(c.at), by: by(c.by), kind: c.kind, body: c.body })), comments_total: x.comments.length,
        checklist: x.checklist.map(c => ({ text: c.text, done: c.done })), minutes_logged: logged, linked: links.map(t => t.key)
      });
    }
    const L = [`# ${x.key} — ${x.title}`,
      `- Status: ${STATUS_LABEL[x.status] || x.status} · Priority: P${x.priority} (impact ${x.impact}, urgency ${x.urgency}) · Type: ${x.type}`,
      `- Category: ${catName(S, x.categoryId)} · Team: ${teamName(S, x.teamId)} · Assignee: ${agentName(S, x.assigneeId)}`,
      `- Requester: ${x.requester?.name || "—"}${x.requester?.email ? ` <${x.requester.email}>` : ""}${x.requester?.dept ? ` · ${x.requester.dept}` : ""}`,
      `- Resolution SLA: ${slaText(s.st, s.rem)} (due ${when(S, s.due)}) · First response: ${r.st}`,
      `- Created ${when(S, x.createdAt)} · Updated ${when(S, x.updatedAt)}${x.resolvedAt ? ` · Resolved ${when(S, x.resolvedAt)}` : ""}${x.csat ? ` · Rating ${x.csat}/5` : ""}`];
    if (asset) L.push(`- Asset: ${asset.tag} — ${asset.name} (${asset.type}, ${asset.status})`);
    if (x.planId) L.push(`- Preventive maintenance ticket, due ${x.pmDue || "—"}`);
    if (x.tags?.length) L.push(`- Tags: ${x.tags.join(", ")}`);
    L.push(`- Link: ${ticketUrl(x.key)}`, "", "## Description", x.desc || "—");
    if (x.checklist.length) L.push("", `## Checklist (${x.checklist.filter(c => c.done).length}/${x.checklist.length} done)`, ...x.checklist.map(c => `- [${c.done ? "x" : " "}] ${c.text}`));
    L.push("", `## Conversation (${x.comments.length}${x.comments.length > comments.length ? `, last ${comments.length} shown` : ""})`);
    if (!comments.length) L.push("No replies yet.");
    for (const c of comments) L.push(`- ${when(S, c.at)} · **${by(c.by)}** · ${c.kind === "internal" ? "internal note" : c.kind === "requester" ? "from requester" : "reply to requester"}:`, `  ${c.body.replace(/\n/g, "\n  ")}`);
    if (logged) L.push("", `Time logged: ${Math.floor(logged / 60)}h ${logged % 60}m`);
    if (links.length) L.push("", `Linked tickets: ${links.map(t => `${t.key} (${t.status})`).join(", ")}`);
    return text(L.join("\n").slice(0, CHARACTER_LIMIT));
  });

  /* ===================== tickets: write ===================== */
  server.registerTool("itsd_create_ticket", {
    title: "Create ticket",
    description: `Open a new ticket in IT Set Desk. The priority is computed from impact × urgency (ITIL matrix); the ticket is auto-assigned by category team unless an assignee is given. Needs a 'Read & write' token.
Examples:
  - "Log that the 2nd-floor printer is jammed for Sara in Sales" -> title, type="incident", category="Printers", requester_name="Sara Ibrahim", requester_dept="Sales"
  - "Open a request to set up a laptop for the new hire, assign it to me" -> type="request", assignee="me"
Call itsd_list_reference with kind='categories' first if you are unsure of the category name.`,
    inputSchema: z.strictObject({
      title: z.string().min(5).max(160).describe("Short summary, at least 5 characters"),
      type: z.enum(TYPES).default("incident").describe("incident = something broken; request = service request; problem = root cause; change = planned change"),
      category: z.string().min(1).max(80).describe("Category name or id, e.g. 'Printers'"),
      impact: z.number().int().min(1).max(3).default(3).describe("1 = many people/whole company, 2 = a team, 3 = one person"),
      urgency: z.number().int().min(1).max(3).default(2).describe("1 = work stopped, 2 = degraded, 3 = can wait"),
      requester_name: z.string().min(1).max(80).describe("Who asked for it"),
      requester_email: z.email().max(120).optional().describe("Requester email (links to their requester record; replies are emailed when mail is enabled)"),
      requester_dept: z.string().max(60).optional().describe("Requester department"),
      description: z.string().max(5000).optional().describe("Details, steps already tried, error messages"),
      asset_tag: z.string().max(40).optional().describe("Link a device by asset tag, e.g. 'LAP-0012'"),
      assignee: z.string().max(120).optional().describe("'me' or an agent name/email; omit for automatic assignment"),
      tags: z.array(z.string().min(1).max(30)).max(10).optional().describe("Tags, e.g. ['vpn','remote']")
    }),
    annotations: WRITE
  }, async (a, ctx) => {
    const { boot } = await getBoot(ctx.mcpReq.signal); const S = boot.state;
    const cat = resolveCategory(S, a.category);
    const assetId = a.asset_tag ? resolveAsset(S, a.asset_tag).id : "";
    const assigneeId = a.assignee ? resolveAgent(boot, a.assignee) || "" : "";
    const j = await deskRequest<{ ticket: Ticket }>("POST", "/api/tickets", {
      title: a.title, type: a.type, categoryId: cat.id, impact: a.impact, urgency: a.urgency,
      requester: { name: a.requester_name, email: a.requester_email || "", dept: a.requester_dept || "" },
      desc: a.description || "", assetId, assigneeId, tags: a.tags || []
    }, ctx.mcpReq.signal);
    invalidate(); const x = j.ticket;
    return text(`Created **${x.key}** — ${x.title}\n- Priority P${x.priority} · ${cat.name} · assignee: ${agentName(S, x.assigneeId)}\n- Link: ${ticketUrl(x.key)}`);
  });

  server.registerTool("itsd_update_ticket", {
    title: "Update ticket",
    description: `Change a ticket's status, assignee, priority inputs, type, category or linked asset. Only the fields you pass change. Needs a 'Read & write' token.
Status flow: new -> progress -> pending (waiting for requester, pauses the SLA) -> resolved -> closed. Resolving emails the requester when mail is enabled.
Examples: "Take ITS-1024" -> key, assignee="me", status="progress". "Mark 1031 resolved" -> status="resolved" (add a reply first with itsd_add_comment explaining the fix).`,
    inputSchema: z.strictObject({
      key: z.string().min(1).max(40).describe("Ticket key"),
      status: z.enum(STATUSES).optional(),
      assignee: z.string().max(120).optional().describe("'me', 'unassigned', or an agent name/email"),
      impact: z.number().int().min(1).max(3).optional(),
      urgency: z.number().int().min(1).max(3).optional(),
      type: z.enum(TYPES).optional(),
      category: z.string().max(80).optional().describe("Category name or id"),
      asset_tag: z.string().max(40).optional().describe("Asset tag to link, or '' to unlink")
    }),
    annotations: { ...WRITE, idempotentHint: true }
  }, async (a, ctx) => {
    const { boot } = await getBoot(ctx.mcpReq.signal); const S = boot.state; const x = resolveTicket(S, a.key);
    const ops: Record<string, unknown>[] = [];
    if (a.assignee !== undefined) ops.push({ op: "set", key: "assigneeId", value: resolveAgent(boot, a.assignee) });
    if (a.impact !== undefined) ops.push({ op: "set", key: "impact", value: a.impact });
    if (a.urgency !== undefined) ops.push({ op: "set", key: "urgency", value: a.urgency });
    if (a.type !== undefined) ops.push({ op: "set", key: "type", value: a.type });
    if (a.category !== undefined) ops.push({ op: "set", key: "categoryId", value: resolveCategory(S, a.category).id });
    if (a.asset_tag !== undefined) ops.push({ op: "set", key: "assetId", value: a.asset_tag === "" ? "" : resolveAsset(S, a.asset_tag).id });
    if (a.status !== undefined) ops.push({ op: "set", key: "status", value: a.status });
    if (!ops.length) throw new Error("Nothing to change: pass at least one of status, assignee, impact, urgency, type, category, asset_tag.");
    const j = await deskRequest<{ tickets: Ticket[] }>("POST", `/api/tickets/${encodeURIComponent(x.id)}/ops`, { ops }, ctx.mcpReq.signal);
    invalidate(); const y = j.tickets.find(t => t.id === x.id) || x;
    return text(`Updated **${y.key}**: status ${STATUS_LABEL[y.status] || y.status} · P${y.priority} · assignee ${agentName(S, y.assigneeId)} · ${catName(S, y.categoryId)}${y.assetId ? ` · asset ${assetTag(S, y.assetId)}` : ""}`);
  });

  server.registerTool("itsd_add_comment", {
    title: "Add comment",
    description: `Add a reply or an internal note to a ticket. kind='reply' is visible to the requester (portal and email when enabled) and counts as the first response; kind='internal' is only visible to IT staff. Needs a 'Read & write' token.
Write replies in the requester's language. Do not put passwords or secrets in replies.`,
    inputSchema: z.strictObject({
      key: z.string().min(1).max(40).describe("Ticket key"),
      body: z.string().min(1).max(10000).describe("The message"),
      kind: z.enum(["reply", "internal"]).default("internal").describe("'internal' (default, staff only) or 'reply' (sent to the requester)")
    }),
    annotations: WRITE
  }, async ({ key, body, kind }, ctx) => {
    const { boot } = await getBoot(ctx.mcpReq.signal); const x = resolveTicket(boot.state, key);
    await deskRequest("POST", `/api/tickets/${encodeURIComponent(x.id)}/ops`, { ops: [{ op: "comment", kind, body }] }, ctx.mcpReq.signal);
    invalidate();
    return text(`${kind === "reply" ? "Reply sent to the requester" : "Internal note added"} on **${x.key}**.`);
  });

  server.registerTool("itsd_log_work", {
    title: "Log work time",
    description: "Log time spent on a ticket (minutes, 1–1440) with a short note of what was done. Needs a 'Read & write' token.",
    inputSchema: z.strictObject({
      key: z.string().min(1).max(40).describe("Ticket key"),
      minutes: z.number().int().min(1).max(1440).describe("Minutes spent"),
      note: z.string().max(300).default("").describe("What was done")
    }),
    annotations: WRITE
  }, async ({ key, minutes, note }, ctx) => {
    const { boot } = await getBoot(ctx.mcpReq.signal); const x = resolveTicket(boot.state, key);
    await deskRequest("POST", `/api/tickets/${encodeURIComponent(x.id)}/ops`, { ops: [{ op: "work-add", min: minutes, note }] }, ctx.mcpReq.signal);
    invalidate();
    return text(`Logged ${minutes} min on **${x.key}**.`);
  });

  /* ===================== overview ===================== */
  server.registerTool("itsd_get_overview", {
    title: "Service desk overview",
    description: "Current state of the service desk, as on the dashboard: open / unassigned / SLA-breached / at-risk counts, resolved in the last 7 days, SLA compliance over 30 days, open tickets per agent, by priority and by category, plus maintenance due in 7 days and warranties ending in 30 days. Use it for 'how are we doing?' or a daily stand-up summary.",
    inputSchema: z.strictObject({ response_format: fmtArg }),
    annotations: READ
  }, async ({ response_format }, ctx) => {
    const { boot, now } = await getBoot(ctx.mcpReq.signal); const S = boot.state;
    const open = S.tickets.filter(C.isOpen);
    const sl = open.map(x => C.sla(S, x, now).st);
    const done30 = S.tickets.filter(x => x.resolvedAt && now - x.resolvedAt < 30 * 864e5);
    const met = done30.filter(x => C.sla(S, x, now).st === "met").length;
    const count = <T,>(arr: T[], f: (v: T) => string) => { const m = new Map<string, number>(); arr.forEach(v => m.set(f(v), (m.get(f(v)) || 0) + 1)); return [...m.entries()].sort((p, q) => q[1] - p[1]); };
    const today = C.todayIn(S, now);
    const data = {
      as_of: iso(now), open: open.length, unassigned: open.filter(x => !x.assigneeId).length,
      sla_breached: sl.filter(s => s === "breached").length, sla_at_risk: sl.filter(s => s === "risk").length,
      resolved_last_7_days: S.tickets.filter(x => x.resolvedAt && now - x.resolvedAt < 7 * 864e5).length,
      sla_compliance_30d_percent: done30.length ? Math.round((met / done30.length) * 100) : null,
      open_by_agent: Object.fromEntries(S.agents.filter(a => a.active).map(a => [a.name, open.filter(x => x.assigneeId === a.id).length])),
      open_by_priority: Object.fromEntries([1, 2, 3, 4].map(p => [`P${p}`, open.filter(x => x.priority === p).length])),
      open_by_category: Object.fromEntries(count(open, x => catName(S, x.categoryId)).slice(0, 8)),
      maintenance_due_7d: (S.plans || []).filter(p => p.active && C.daysBetween(today, p.nextDue) <= 7).map(p => ({ plan: p.title, due: p.nextDue })),
      warranty_ending_30d: S.assets.filter(a => !["retired", "disposed"].includes(a.status) && ["soon", "expired"].includes(C.warranty(a, today))).map(a => ({ tag: a.tag, warranty_end: a.warrantyEnd })),
      demo_data: !!S.demo
    };
    if (response_format === Fmt.JSON) return json(data);
    const kv = (o: Record<string, number>) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(" · ");
    return text([`# Service desk overview — ${when(S, now)}${S.demo ? " (DEMO DATA)" : ""}`,
      `- Open: ${data.open} · Unassigned: ${data.unassigned} · SLA breached: ${data.sla_breached} · At risk: ${data.sla_at_risk}`,
      `- Resolved in 7 days: ${data.resolved_last_7_days} · SLA compliance (30 days): ${data.sla_compliance_30d_percent ?? "—"}%`,
      `- Open by agent: ${kv(data.open_by_agent)}`, `- Open by priority: ${kv(data.open_by_priority)}`, `- Open by category: ${kv(data.open_by_category)}`,
      `- Maintenance due in 7 days: ${data.maintenance_due_7d.map(p => `${p.plan} (${p.due})`).join("; ") || "none"}`,
      `- Warranties ending/expired: ${data.warranty_ending_30d.map(a => `${a.tag} (${a.warranty_end})`).join("; ") || "none"}`].join("\n"));
  });

  /* ===================== assets & maintenance ===================== */
  server.registerTool("itsd_search_assets", {
    title: "Search assets",
    description: "Search the IT asset register (laptops, printers, switches, servers…). Filter by text (tag, model, serial, owner, location), lifecycle status, type, or warranty ending within 30 days. Disposed devices are excluded unless status='disposed'. Use itsd_get_asset for one device's history and figures.",
    inputSchema: z.strictObject({
      query: z.string().max(120).optional().describe("Text in tag, model, serial, vendor, owner or location"),
      status: z.enum(["stock", "active", "repair", "retired", "disposed"]).optional().describe("Lifecycle status"),
      type: z.string().max(40).optional().describe("Device type, e.g. 'Laptop', 'Printer'"),
      warranty_ending: z.boolean().optional().describe("true = only live devices whose warranty expired or ends within 30 days"),
      limit: z.number().int().min(1).max(100).default(25),
      offset: z.number().int().min(0).default(0),
      response_format: fmtArg
    }),
    annotations: READ
  }, async (a, ctx) => {
    const { boot, now } = await getBoot(ctx.mcpReq.signal); const S = boot.state; const today = C.todayIn(S, now); const q = norm(a.query);
    const list = S.assets.filter(x => (a.status ? x.status === a.status : x.status !== "disposed")
      && (!a.type || norm(x.type) === norm(a.type))
      && (!a.warranty_ending || (!["retired", "disposed"].includes(x.status) && ["soon", "expired"].includes(C.warranty(x, today))))
      && (!q || [x.tag, x.name, x.serial, x.vendor, ownerOf(S, x), x.location, x.type].join(" ").toLowerCase().includes(q))).sort((p, r) => p.tag.localeCompare(r.tag));
    const total = list.length, page = list.slice(a.offset, a.offset + a.limit);
    const row = (x: typeof list[number]) => {
      const n = S.tickets.filter(t => t.assetId === x.id);
      return { tag: x.tag, name: x.name, type: x.type, status: x.status, criticality: x.criticality || "medium", owner: ownerOf(S, x) || null, location: x.location || null,
        serial: x.serial || null, warranty_end: x.warrantyEnd || null, warranty: C.warranty(x, today), tickets: n.length, open_tickets: n.filter(C.isOpen).length };
    };
    const render = (part: typeof list) => {
      const next = a.offset + part.length, more = total > next;
      if (a.response_format === Fmt.JSON) return JSON.stringify({ total, count: part.length, offset: a.offset, has_more: more, ...(more ? { next_offset: next } : {}), assets: part.map(row) }, null, 2);
      const L = [`# Assets — ${total} match${total === 1 ? "" : "es"}`, ""];
      for (const x of part.map(row)) L.push(`- **${x.tag}** · ${x.name} · ${x.type} · ${x.status}${x.criticality === "high" ? " · critical" : ""} · owner: ${x.owner || "—"} · ${x.location || "—"} · warranty: ${x.warranty_end || "—"}${x.warranty === "expired" ? " (expired)" : x.warranty === "soon" ? " (ending soon)" : ""} · tickets: ${x.tickets}${x.open_tickets ? ` (${x.open_tickets} open)` : ""}`);
      if (!total) L.push("No assets match.");
      if (more) L.push("", `More results: call again with offset=${next}.`);
      return L.join("\n");
    };
    const fit = fitList(page, render, CHARACTER_LIMIT);
    return a.response_format === Fmt.JSON ? json(JSON.parse(fit.text) as Record<string, unknown>) : text(fit.text);
  });

  server.registerTool("itsd_get_asset", {
    title: "Get asset",
    description: "One device by asset tag: details (serial, vendor, purchase and warranty dates, owner, location, criticality), service figures (tickets, incidents, MTTR, MTBF, next preventive maintenance), disposal record, change history and its recent tickets.",
    inputSchema: z.strictObject({ tag: z.string().min(1).max(40).describe("Asset tag, e.g. 'PRN-003'"), response_format: fmtArg }),
    annotations: READ
  }, async ({ tag, response_format }, ctx) => {
    const { boot, now } = await getBoot(ctx.mcpReq.signal); const S = boot.state; const a = resolveAsset(S, tag);
    const st = C.assetStats(S, a.id, now); const today = C.todayIn(S, now);
    const ts = S.tickets.filter(t => t.assetId === a.id).sort((p, r) => r.createdAt - p.createdAt);
    const data = {
      tag: a.tag, name: a.name, type: a.type, status: a.status, criticality: a.criticality || "medium", owner: ownerOf(S, a) || null, location: a.location || null,
      serial: a.serial || null, vendor: a.vendor || null, purchase_date: a.purchaseDate || null, warranty_end: a.warrantyEnd || null, warranty: C.warranty(a, today), notes: a.notes || null,
      disposal: a.disposal || null,
      figures: { tickets: st.total, open: st.open, incidents: st.incidents, preventive: st.pm, mttr_hours: st.mttr != null ? +(st.mttr / 36e5).toFixed(1) : null, mtbf_days: st.mtbf != null ? +(st.mtbf / 864e5).toFixed(1) : null, last_maintenance: iso(st.lastPm), next_maintenance: st.nextPm || null },
      history: (a.history || []).slice(-20).map(h => ({ at: iso(h.at), by: agentName(S, h.by), change: h.k, from: h.f ?? null, to: h.v ?? null })),
      recent_tickets: ts.slice(0, 15).map(t => ({ key: t.key, title: t.title, type: t.type, status: t.status, created: iso(t.createdAt) }))
    };
    if (response_format === Fmt.JSON) return json(data);
    const f = data.figures;
    return text([`# ${a.tag} — ${a.name}`,
      `- ${a.type} · status: ${a.status} · criticality: ${data.criticality} · owner: ${data.owner || "—"} · location: ${data.location || "—"}`,
      `- Serial: ${data.serial || "—"} · Vendor: ${data.vendor || "—"} · Purchased: ${data.purchase_date || "—"} · Warranty end: ${data.warranty_end || "—"} (${data.warranty})`,
      `- Tickets: ${f.tickets} (${f.open} open) · Incidents: ${f.incidents} · MTTR: ${f.mttr_hours ?? "—"} h · MTBF: ${f.mtbf_days ?? "needs 2+ incidents"}${f.mtbf_days != null ? " days" : ""}`,
      `- Preventive maintenance: last ${f.last_maintenance ? when(S, st.lastPm) : "—"} · next ${f.next_maintenance || "—"}`,
      ...(a.disposal ? [`- Disposed ${a.disposal.date} (${a.disposal.method}) · data wiped: ${a.disposal.dataWiped ? "confirmed" : "NOT confirmed"}${a.disposal.note ? ` · ${a.disposal.note}` : ""}`] : []),
      ...(a.notes ? ["", `Notes: ${a.notes}`] : []),
      "", "## History", ...(data.history.length ? data.history.map(h => `- ${h.at?.slice(0, 10)} · ${h.change}${h.from != null || h.to != null ? `: ${h.from ?? "—"} → ${h.to ?? "—"}` : ""} · ${h.by}`) : ["—"]),
      "", "## Recent tickets", ...(data.recent_tickets.length ? data.recent_tickets.map(t => `- ${t.key} · ${t.status} · ${t.title}`) : ["—"])].join("\n"));
  });

  server.registerTool("itsd_list_maintenance_plans", {
    title: "List maintenance plans",
    description: "Preventive maintenance plans: what is maintained, how often, the next due date, assignee and the last run (tickets opened / skipped because one was still open). Use due_within_days to see what is coming up.",
    inputSchema: z.strictObject({
      due_within_days: z.number().int().min(0).max(365).optional().describe("Only active plans due within this many days (overdue included)"),
      response_format: fmtArg
    }),
    annotations: READ
  }, async ({ due_within_days, response_format }, ctx) => {
    const { boot, now } = await getBoot(ctx.mcpReq.signal); const S = boot.state; const today = C.todayIn(S, now);
    const plans = (S.plans || []).filter(p => due_within_days === undefined || (p.active && C.daysBetween(today, p.nextDue) <= due_within_days))
      .sort((p, r) => p.nextDue.localeCompare(r.nextDue));
    const rows = plans.map(p => ({
      title: p.title, active: p.active, every_days: p.everyDays, next_due: p.nextDue, days_until_due: C.daysBetween(today, p.nextDue),
      targets: p.assetIds.length ? p.assetIds.map(id => assetTag(S, id)).filter(Boolean) : [`all ${p.assetType}`], devices_now: C.planTargets(S, p).length,
      type: p.type, category: catName(S, p.categoryId), assignee: p.assigneeId ? agentName(S, p.assigneeId) : "by team", steps: p.checklist,
      last_run: p.lastRun ? { at: iso(p.lastRun.at), opened: p.lastRun.created, skipped: p.lastRun.skipped } : null
    }));
    if (response_format === Fmt.JSON) return json({ count: rows.length, plans: rows });
    if (!rows.length) return text("No maintenance plans match.");
    return text([`# Preventive maintenance plans (${rows.length})`, "", ...rows.map(r =>
      `- **${r.title}**${r.active ? "" : " (paused)"} · every ${r.every_days} days · next ${r.next_due} (${r.days_until_due < 0 ? `${-r.days_until_due} days overdue` : r.days_until_due === 0 ? "today" : `in ${r.days_until_due} days`}) · ${r.targets.join(", ")} (${r.devices_now} devices) · ${r.assignee}${r.last_run ? ` · last run ${r.last_run.at?.slice(0, 10)}: ${r.last_run.opened} opened, ${r.last_run.skipped} skipped` : ""}`)].join("\n"));
  });

  /* ===================== knowledge & reference ===================== */
  server.registerTool("itsd_search_kb", {
    title: "Search knowledge base",
    description: "Search the IT knowledge base (documented fixes) by words in the title, body or tags. Returns matching articles in full. Check it before answering 'how do I fix…' questions or drafting a reply.",
    inputSchema: z.strictObject({ query: z.string().min(2).max(200).describe("Words to look for, e.g. 'vpn disconnect'"), limit: z.number().int().min(1).max(20).default(5) }),
    annotations: READ
  }, async ({ query, limit }, ctx) => {
    const { boot } = await getBoot(ctx.mcpReq.signal); const S = boot.state;
    const words = norm(query).split(/\s+/).filter(w => w.length > 1);
    const scored = S.kb.map(k => { const hay = `${k.title} ${k.tags} ${k.body}`.toLowerCase(); return { k, s: words.reduce((n, w) => n + (hay.includes(w) ? (norm(k.title).includes(w) ? 3 : 1) : 0), 0) }; })
      .filter(r => r.s > 0).sort((p, r) => r.s - p.s).slice(0, limit);
    if (!scored.length) return text(`No knowledge base article matches "${query}". Try fewer or different words.`);
    return text(fitList(scored, part => part.map(({ k }) => `# ${k.title}\nCategory: ${catName(S, k.category)} · Tags: ${k.tags || "—"}\n\n${k.body}`).join("\n\n---\n\n"), CHARACTER_LIMIT).text);
  });

  server.registerTool("itsd_list_reference", {
    title: "List reference data",
    description: "List the names you can use in other tools: agents (with team, role and open-ticket load), teams, categories (with their team), or requesters (employees, searchable, paginated).",
    inputSchema: z.strictObject({
      kind: z.enum(["agents", "teams", "categories", "requesters"]).describe("What to list"),
      query: z.string().max(120).optional().describe("Filter by name/email (requesters and agents)"),
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0)
    }),
    annotations: READ
  }, async ({ kind, query, limit, offset }, ctx) => {
    const { boot } = await getBoot(ctx.mcpReq.signal); const S = boot.state; const q = norm(query);
    let rows: string[] = [];
    if (kind === "agents") rows = S.agents.filter(a => !q || `${a.name} ${a.email}`.toLowerCase().includes(q))
      .map(a => `- ${a.name} <${a.email}> · ${teamName(S, a.team)} · ${a.role || "no login"}${a.active ? "" : " · INACTIVE"} · open tickets: ${S.tickets.filter(t => t.assigneeId === a.id && C.isOpen(t)).length}${a.id === boot.me.id ? " · (you)" : ""}`);
    if (kind === "teams") rows = S.teams.map(t => `- ${t.name} · categories: ${S.categories.filter(c => c.team === t.id).map(c => c.name).join(", ") || "—"}`);
    if (kind === "categories") rows = S.categories.map(c => `- ${c.name} → team ${teamName(S, c.team)}`);
    if (kind === "requesters") rows = S.requesters.filter(r => !q || `${r.name} ${r.email} ${r.dept}`.toLowerCase().includes(q))
      .sort((p, r) => p.name.localeCompare(r.name)).map(r => `- ${r.name}${r.email ? ` <${r.email}>` : ""}${r.dept ? ` · ${r.dept}` : ""} · tickets: ${S.tickets.filter(t => t.requesterId === r.id).length}`);
    const total = rows.length, page = rows.slice(offset, offset + limit), next = offset + page.length;
    return text([`# ${kind} (${total})`, ...page, ...(total > next ? ["", `More: call again with offset=${next}.`] : []), ...(total ? [] : ["None."])].join("\n").slice(0, CHARACTER_LIMIT));
  });
}

/** Re-exported for the smoke test's sanity checks. */
export const _internals = { dur };
