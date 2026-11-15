/*! IT Set Desk MCP server — © 2026 Abdullah Amer. Proprietary, see ../LICENSE. */
/**
 * IT Set Desk API client (module scope, shared by every server instance) and the shared business logic.
 * The SLA, asset and maintenance rules come from the Desk's own core.js, copied into dist/ at build time,
 * so the numbers here always match what the web app shows.
 */
import { createRequire } from "node:module";

// ---------- configuration ----------
export const DESK_URL = String(process.env.ITSET_DESK_URL || "").trim().replace(/\/+$/, "");
export const DESK_TOKEN = String(process.env.ITSET_DESK_TOKEN || "").trim();
export const CHARACTER_LIMIT = 25_000;
const STATE_TTL_MS = 3_000;

export function configProblem(): string | null {
  if (!DESK_URL) return "ITSET_DESK_URL is not set. Set it to the address of your IT Set Desk server, e.g. http://helpdesk.company.local:8080";
  if (!/^https?:\/\/[^/\s]+/i.test(DESK_URL)) return `ITSET_DESK_URL must start with http:// or https:// (got "${DESK_URL}").`;
  if (!/^itsd_[A-Za-z0-9_-]{43}$/.test(DESK_TOKEN)) return "ITSET_DESK_TOKEN is missing or malformed. Create one in IT Set Desk → Settings → API tokens (it starts with itsd_).";
  return null;
}

// ---------- data shapes (only the fields this server reads) ----------
export interface Requester { name: string; email: string; dept: string }
export interface Comment { id: string; by: string; kind: "reply" | "internal" | "requester"; body: string; at: number }
export interface Worklog { id: string; by: string; min: number; note: string; at: number }
export interface CheckItem { id: string; text: string; done: boolean }
export interface Ticket {
  id: string; key: string; title: string; desc: string; type: string; status: string; priority: number; impact: number; urgency: number;
  categoryId: string; teamId: string; assigneeId: string | null; requester: Requester; requesterId?: string | null; assetId: string; tags: string[];
  createdAt: number; updatedAt: number; firstResponseAt: number | null; resolvedAt: number | null; closedAt: number | null;
  comments: Comment[]; worklogs: Worklog[]; checklist: CheckItem[]; links: string[]; csat: number | null; planId?: string; pmDue?: string;
}
export interface Agent { id: string; name: string; email: string; team: string; active: boolean; role?: string | null }
export interface Category { id: string; name: string; team: string }
export interface Team { id: string; name: string }
export interface Asset {
  id: string; tag: string; name: string; type: string; status: string; criticality?: string; requesterId?: string; user: string; location: string;
  serial?: string; vendor?: string; purchaseDate?: string; warrantyEnd?: string; notes?: string;
  disposal?: { method: string; date: string; dataWiped: boolean; note: string } | null;
  history?: { at: number; by: string; k: string; f?: string; v?: string }[];
}
export interface Plan {
  id: string; title: string; desc: string; everyDays: number; nextDue: string; leadDays: number; assetIds: string[]; assetType: string;
  type: string; categoryId: string; assigneeId: string; checklist: string[]; active: boolean;
  lastRun: { at: number; due: string; created: number; skipped: number } | null;
}
export interface KbArticle { id: string; title: string; body: string; category: string; tags: string }
export interface RequesterEntity { id: string; name: string; email: string; dept: string; phone?: string; active?: boolean }
export interface State {
  settings: { prefix: string; calendar?: { tz: string } }; sla: Record<string, { resp: number; res: number }>;
  teams: Team[]; agents: Agent[]; categories: Category[]; assets: Asset[]; kb: KbArticle[]; tickets: Ticket[];
  requesters: RequesterEntity[]; plans?: Plan[]; demo?: boolean;
}
export interface Boot { me: { id: string; role: string }; state: State; serverTime: number; version: string; license?: { product: string; licensee: string } }

// ---------- shared core logic from the Desk ----------
interface SlaInfo { st: string; due: number; rem: number }
interface AssetStats { total: number; open: number; incidents: number; pm: number; mttr: number | null; mtbf: number | null; lastPm: number | null; nextPm: string }
interface Core {
  sla(S: State, x: Ticket, now: number): SlaInfo;
  resp(S: State, x: Ticket, now: number): { st: string; due: number };
  isOpen(x: Ticket): boolean;
  assetStats(S: State, id: string, now: number): AssetStats;
  todayIn(S: State, now: number): string;
  daysBetween(a: string, b: string): number;
  warranty(a: Asset, today: string): string;
  planTargets(S: State, p: Plan): Asset[];
}
const require = createRequire(import.meta.url);
export const C = require("./core.cjs") as Core;

// ---------- HTTP ----------
export class DeskError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) { super(message); }
}
function deskMessage(status: number, code: string): string {
  switch (code) {
    case "bad_token": case "auth": return "IT Set Desk rejected the API token (expired, revoked, or the user was deactivated). Create a new token in Settings → API tokens and update ITSET_DESK_TOKEN.";
    case "token_read_only": return "This API token is read-only. To make changes, create a token with the 'Read & write' scope in IT Set Desk → Settings → API tokens.";
    case "token_forbidden": return "API tokens are not allowed to do this (password, token, import/export and backup actions need a signed-in browser session).";
    case "forbidden": return "Your IT Set Desk role does not allow this action (admins only).";
    case "locked": return "Too many failed attempts from this address. Wait a few minutes and try again.";
    case "not_found": return "Not found in IT Set Desk. Check the key or tag; the search tools return valid values.";
    case "v_title": return "The title must be at least 5 characters.";
    case "v_cat": return "Unknown category. Call itsd_list_reference with kind='categories' to see valid categories.";
    case "v_req": return "A requester name is required.";
    case "v_email": return "The requester email address is not valid.";
    case "v_min": return "Minutes must be between 1 and 1440.";
    case "csat_open": return "A rating can only be added after the ticket is resolved.";
    default: return `IT Set Desk returned an error (HTTP ${status}${code ? `, ${code}` : ""}).`;
  }
}
export async function deskRequest<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const problem = configProblem(); if (problem) throw new Error(problem);
  const signals = [AbortSignal.timeout(20_000)]; if (signal) signals.push(signal);
  const headers: Record<string, string> = { Authorization: `Bearer ${DESK_TOKEN}`, Accept: "application/json", "User-Agent": "itset-desk-mcp-server/1.0" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(DESK_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.any(signals)
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") throw new Error(`IT Set Desk at ${DESK_URL} did not answer within 20 seconds. Check the server is running and reachable.`);
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new Error(`Cannot reach IT Set Desk at ${DESK_URL} (${(e as Error).message}). Check ITSET_DESK_URL, the network/VPN, and that the server is running.`);
  }
  let j: Record<string, unknown> = {};
  try { j = (await res.json()) as Record<string, unknown>; } catch { /* non-JSON body */ }
  if (!res.ok) { const code = String(j.error || ""); throw new DeskError(deskMessage(res.status, code), res.status, code); }
  return j as T;
}

// ---------- cached state (the Desk returns the whole working set in one call) ----------
let cache: { at: number; boot: Boot; skew: number } | null = null;
export async function getBoot(signal?: AbortSignal): Promise<{ boot: Boot; now: number }> {
  if (!cache || Date.now() - cache.at > STATE_TTL_MS) {
    const boot = await deskRequest<Boot>("GET", "/api/bootstrap", undefined, signal);
    boot.state.plans = boot.state.plans || [];
    cache = { at: Date.now(), boot, skew: boot.serverTime - Date.now() };
  }
  return { boot: cache.boot, now: Date.now() + cache.skew };
}
export function invalidate(): void { cache = null; }
