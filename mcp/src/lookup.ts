/*! IT Set Desk MCP server — © 2026 Abdullah Amer. Proprietary, see ../LICENSE. */
/** Name resolution and formatting helpers shared by the tools. */
import { C, DESK_URL, type Agent, type Asset, type Boot, type Category, type State, type Ticket } from "./desk.js";

export const norm = (s: unknown): string => String(s ?? "").trim().toLowerCase();

/** Resolves 'me', 'unassigned', an email, an exact name, or a unique partial name to an agent id (null = unassigned). */
export function resolveAgent(boot: Boot, who: string): string | null {
  const w = norm(who);
  if (w === "me") return boot.me.id;
  if (w === "unassigned" || w === "none" || w === "") return null;
  const S = boot.state;
  const exact = S.agents.find(a => norm(a.email) === w || norm(a.name) === w || a.id === who);
  if (exact) return exact.id;
  const partial = S.agents.filter(a => norm(a.name).includes(w) || norm(a.email).includes(w));
  if (partial.length === 1) return partial[0].id;
  const names = S.agents.filter(a => a.active).map(a => `${a.name} <${a.email}>`).join("; ");
  throw new Error(partial.length ? `"${who}" matches several agents (${partial.map(a => a.name).join(", ")}). Use the full name or email.` : `No agent matches "${who}". Agents: ${names}. You can also use 'me' or 'unassigned'.`);
}

export function resolveCategory(S: State, c: string): Category {
  const w = norm(c);
  const exact = S.categories.find(k => k.id === c || norm(k.name) === w);
  if (exact) return exact;
  const partial = S.categories.filter(k => norm(k.name).includes(w));
  if (partial.length === 1) return partial[0];
  throw new Error(`${partial.length ? `"${c}" matches several categories` : `No category matches "${c}"`}. Categories: ${S.categories.map(k => k.name).join("; ")}.`);
}

export function resolveAsset(S: State, tag: string): Asset {
  const w = norm(tag);
  const a = S.assets.find(x => norm(x.tag) === w || x.id === tag);
  if (a) return a;
  const partial = S.assets.filter(x => norm(x.tag).includes(w));
  if (partial.length === 1) return partial[0];
  throw new Error(`No asset with tag "${tag}"${partial.length ? ` (did you mean ${partial.slice(0, 5).map(x => x.tag).join(", ")}?)` : ""}. Use itsd_search_assets to find tags.`);
}

export function resolveTicket(S: State, key: string): Ticket {
  const w = norm(key);
  const t = S.tickets.find(x => norm(x.key) === w || x.id === key)
    || (/^\d+$/.test(w) ? S.tickets.find(x => x.key.endsWith("-" + w)) : undefined);
  if (!t) throw new Error(`No ticket "${key}". Ticket keys look like ${S.settings.prefix}-1024; use itsd_search_tickets to find one.`);
  return t;
}

export const agentName = (S: State, id: string | null | undefined): string =>
  id === "system" ? "System" : id === "requester" ? "Requester" : !id ? "Unassigned" : (S.agents.find(a => a.id === id)?.name ?? id);
export const catName = (S: State, id: string): string => S.categories.find(c => c.id === id)?.name ?? "—";
export const teamName = (S: State, id: string): string => S.teams.find(t => t.id === id)?.name ?? "—";
export const assetTag = (S: State, id: string): string => (id && S.assets.find(a => a.id === id)?.tag) || "";
export const ownerOf = (S: State, a: Asset): string => (a.requesterId && S.requesters.find(r => r.id === a.requesterId)?.name) || a.user || "";

export function tz(S: State): string { return S.settings.calendar?.tz || "UTC"; }
export function when(S: State, ts: number | null | undefined): string {
  if (!ts) return "—";
  try { return new Intl.DateTimeFormat("en-GB", { timeZone: tz(S), day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(ts); }
  catch { return new Date(ts).toISOString(); }
}
export const iso = (ts: number | null | undefined): string | null => (ts ? new Date(ts).toISOString() : null);
export function dur(ms: number): string {
  const a = Math.abs(ms), d = Math.floor(a / 864e5), h = Math.floor((a % 864e5) / 36e5), m = Math.floor((a % 36e5) / 6e4);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}
export function slaText(st: string, rem: number): string {
  if (st === "met") return "met";
  if (st === "breached") return rem < 0 ? `breached (${dur(rem)} late)` : "breached";
  if (st === "paused") return "paused (waiting for requester)";
  return `${st === "risk" ? "at risk" : "on track"}, ${dur(rem)} left`;
}
export const ticketUrl = (key: string): string => `${DESK_URL}/#t-${encodeURIComponent(key)}`;

/** Compact, stable JSON view of a ticket for list results. */
export function ticketRow(S: State, x: Ticket, now: number) {
  const s = C.sla(S, x, now);
  return {
    key: x.key, title: x.title, type: x.type, status: x.status, priority: `P${x.priority}`,
    category: catName(S, x.categoryId), team: teamName(S, x.teamId), assignee: x.assigneeId ? agentName(S, x.assigneeId) : null,
    requester: x.requester?.name || "", asset_tag: assetTag(S, x.assetId) || null, tags: x.tags || [],
    sla: { status: s.st, due: iso(s.due), remaining_minutes: Math.round(s.rem / 6e4) },
    preventive: !!x.planId, created: iso(x.createdAt), updated: iso(x.updatedAt), url: ticketUrl(x.key)
  };
}

/** Halves a list until its rendered text fits under the character limit. */
export function fitList<T>(items: T[], render: (part: T[]) => string, limit: number): { items: T[]; text: string } {
  let part = items, text = render(part);
  while (part.length > 1 && text.length > limit) { part = part.slice(0, Math.ceil(part.length / 2)); text = render(part); }
  return { items: part, text };
}
export type { Agent };
