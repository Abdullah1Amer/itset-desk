'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * Emergency password reset (run on the server only).
 * Usage:  node reset-password.js <email> <new-password> [admin|agent]
 * Example: docker compose exec servicedesk node reset-password.js admin@company.local 'NewPass#2026' admin
 * Signs the user out of all sessions. Works while the server is running.
 */
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const [email, pw, roleArg] = process.argv.slice(2);
if (!email || !pw) { console.error('Usage: node reset-password.js <email> <new-password> [admin|agent]'); process.exit(1); }
if (pw.length < 8) { console.error('Password must be at least 8 characters.'); process.exit(1); }
if (roleArg && !['admin', 'agent'].includes(roleArg)) { console.error('Role must be admin or agent.'); process.exit(1); }

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const db = new DatabaseSync(path.join(DATA_DIR, 'servicedesk.db'));
db.exec('PRAGMA busy_timeout = 5000');

const agent = db.prepare("SELECT data FROM ent WHERE coll='agents'").all().map(r => JSON.parse(r.data))
  .find(a => String(a.email).toLowerCase() === email.trim().toLowerCase());
if (!agent) { console.error('No agent with email:', email); process.exit(1); }

const existing = db.prepare('SELECT role FROM creds WHERE agent_id=?').get(agent.id);
const role = roleArg || (existing ? existing.role : 'agent');
const salt = crypto.randomBytes(16);
const hash = `scrypt$${salt.toString('hex')}$${crypto.scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 }).toString('hex')}`;

db.prepare('INSERT INTO creds (agent_id,hash,role) VALUES (?,?,?) ON CONFLICT(agent_id) DO UPDATE SET hash=excluded.hash, role=excluded.role').run(agent.id, hash, role);
db.prepare('DELETE FROM sessions WHERE agent_id=?').run(agent.id);
try {
  const AUD = require('./lib/audit.js'); AUD.ensureAuditTable(db);
  AUD.appendAudit(db, { actor: 'cli', action: 'auth.password_reset_cli', target: agent.email, detail: { role, reactivated: !agent.active }, ip: 'server' });
} catch (e) { console.error('Warning: could not write the audit log entry:', e.message); }
if (!agent.active) {
  agent.active = true;
  db.prepare("UPDATE ent SET data=?, updated=? WHERE coll='agents' AND id=?").run(JSON.stringify(agent), Date.now(), agent.id);
  console.log('Note: the agent was inactive and has been re-activated. Restart the container so the running server picks this up.');
}
db.close();
console.log(`Password reset for ${agent.name} <${agent.email}> — role: ${role}. All their sessions were signed out.`);
