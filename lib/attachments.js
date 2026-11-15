'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * Attachment storage — content-addressed (SHA-256), immutable files under <DATA_DIR>/attachments/ab/<hash>.
 *
 * - Identical files are stored once.
 * - Backups hard-link every file into <DATA_DIR>/backups/attachments/ (no extra disk space on the same volume,
 *   and the copy survives when the live file is deleted), falling back to a real copy if linking fails.
 * - On startup the server "heals" any referenced file missing from the live store from the backup store,
 *   so restoring an older database file brings its attachments back automatically.
 * - Image types are detected from the file bytes, never from the name or the browser-declared type.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const HASH_RE = /^[a-f0-9]{64}$/;
/* Executables and scripts that run on double-click in Windows. Downloads are always served as attachments
   with nosniff, but blocking these at upload stops the help desk from ever handing one to a user. */
const BLOCKED_EXT = new Set(['exe', 'msi', 'msp', 'msc', 'bat', 'cmd', 'com', 'scr', 'pif', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
  'hta', 'cpl', 'jar', 'lnk', 'reg', 'dll', 'sys', 'iso', 'img', 'vhd', 'vhdx', 'appx', 'appxbundle', 'msix', 'application', 'gadget', 'scf', 'url', 'inf']);

function sniffImage(buf) {
  const b = buf;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A) return 'image/png';
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  if (b.length >= 6 && b.toString('ascii', 0, 6).match(/^GIF8[79]a$/)) return 'image/gif';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
function cleanName(n) {
  let s = String(n || '').normalize('NFC').replace(/[\x00-\x1f\x7f]/g, '').replace(/[\\/:*?"<>|]/g, '_').trim().replace(/^\.+/, '');
  if (!s) s = 'file';
  if (s.length > 150) { const ext = path.extname(s).slice(0, 16); s = s.slice(0, 150 - ext.length) + ext; }
  return s;
}
const extOf = n => { const m = /\.([A-Za-z0-9]{1,16})$/.exec(n); return m ? m[1].toLowerCase() : ''; };
const isBlocked = n => BLOCKED_EXT.has(extOf(n));

function linkOrCopy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try { fs.linkSync(src, dst); } catch (e) { if (e.code === 'EEXIST') return; fs.copyFileSync(src, dst); }
}
function walk(root) {
  const out = [];
  if (!fs.existsSync(root)) return out;
  for (const d of fs.readdirSync(root)) {
    if (!/^[a-f0-9]{2}$/.test(d)) continue;
    const sub = path.join(root, d);
    for (const f of fs.readdirSync(sub)) if (HASH_RE.test(f)) out.push(f);
  }
  return out;
}

class AttachmentStore {
  constructor(dataDir, opts = {}) {
    this.dir = path.join(dataDir, 'attachments');
    this.bdir = path.join(dataDir, 'backups', 'attachments');
    this.tmp = path.join(this.dir, '.tmp');
    fs.mkdirSync(this.tmp, { recursive: true });
    // only the server cleans leftovers (a CLI backup must not touch uploads in flight)
    if (opts.cleanTmp) for (const f of fs.readdirSync(this.tmp)) { try { fs.unlinkSync(path.join(this.tmp, f)); } catch (e) { /* ignore */ } }
  }
  livePath(h) { if (!HASH_RE.test(h)) throw new Error('bad hash'); return path.join(this.dir, h.slice(0, 2), h); }
  backupPath(h) { if (!HASH_RE.test(h)) throw new Error('bad hash'); return path.join(this.bdir, h.slice(0, 2), h); }
  has(h) { return HASH_RE.test(h) && fs.existsSync(this.livePath(h)); }
  /** Stores a buffer, returns its SHA-256 hash. Atomic: write to temp, then rename. */
  put(buf) {
    const h = crypto.createHash('sha256').update(buf).digest('hex');
    const p = this.livePath(h);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      const t = path.join(this.tmp, crypto.randomBytes(8).toString('hex'));
      fs.writeFileSync(t, buf, { flag: 'wx' });
      fs.renameSync(t, p);
    }
    return h;
  }
  remove(h) { try { fs.unlinkSync(this.livePath(h)); return true; } catch (e) { return false; } }
  /** Mirror every live file into the backup store (hard link when possible). */
  backupSync() {
    let added = 0;
    for (const h of walk(this.dir)) { const b = this.backupPath(h); if (!fs.existsSync(b)) { linkOrCopy(this.livePath(h), b); added++; } }
    return added;
  }
  /** Bring back referenced files that are missing from the live store, using the backup store. */
  heal(hashes) {
    let healed = 0; const missing = [];
    for (const h of hashes) {
      if (!HASH_RE.test(h) || this.has(h)) continue;
      const b = this.backupPath(h);
      if (fs.existsSync(b)) { linkOrCopy(b, this.livePath(h)); healed++; } else missing.push(h);
    }
    return { healed, missing };
  }
  /** Delete live files that no ticket (active or in trash) references. Backup copies are kept. */
  gc(referenced) {
    let removed = 0;
    for (const h of walk(this.dir)) if (!referenced.has(h)) { if (this.remove(h)) removed++; }
    return removed;
  }
}

module.exports = { AttachmentStore, sniffImage, cleanName, isBlocked, extOf, BLOCKED_EXT, HASH_RE };
