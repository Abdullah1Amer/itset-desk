'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * Minimal SMTP client — zero dependencies (node:net + node:tls).
 * Supports: implicit TLS (port 465), STARTTLS (port 587), plain (internal relays),
 *           AUTH PLAIN / AUTH LOGIN, UTF-8 subject and body (base64), certificate verification on by default.
 * Mailer adds an in-memory retry queue (3 attempts: now, +1 min, +5 min). The queue does not survive a restart.
 */
const net = require('node:net');
const tls = require('node:tls');
const os = require('node:os');
const crypto = require('node:crypto');

const b64 = s => Buffer.from(String(s), 'utf8').toString('base64');
const addrOf = s => { const m = /<([^>]+)>/.exec(String(s)); return (m ? m[1] : String(s)).trim(); };
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

/** RFC 2047 encoded-words, split so each stays under ~75 chars and never cuts a UTF-8 character. */
function encodeHeader(s) {
  s = String(s).replace(/[\r\n]+/g, ' ');
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  const words = []; let cur = '';
  for (const ch of s) {
    if (Buffer.byteLength(cur + ch, 'utf8') > 42) { words.push(cur); cur = ''; }
    cur += ch;
  }
  if (cur) words.push(cur);
  return words.map(w => `=?UTF-8?B?${b64(w)}?=`).join('\r\n ');
}
function buildMessage({ from, to, subject, text }) {
  const fm = /^(.*?)\s*<([^>]+)>\s*$/.exec(String(from).trim());
  const fromHdr = fm && fm[1] ? `${encodeHeader(fm[1].replace(/^"|"$/g, ''))} <${fm[2]}>` : `<${addrOf(from)}>`;
  const domain = (addrOf(from).split('@')[1] || 'localhost').replace(/[^A-Za-z0-9.-]/g, '');
  const body = b64(text).replace(/.{1,76}/g, '$&\r\n');
  return [
    `From: ${fromHdr}`, `To: <${to}>`, `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString().replace('GMT', '+0000')}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64',
    'Auto-Submitted: auto-generated', '', body
  ].join('\r\n');
}

function smtpSend(cfg, to, message) {
  return new Promise((resolve, reject) => {
    const host = cfg.host, port = +cfg.port || (cfg.secure === 'tls' ? 465 : 587);
    const helo = (os.hostname() || 'localhost').replace(/[^A-Za-z0-9.-]/g, '') || 'localhost';
    let sock, buf = '', done = false; const queue = []; let waiter = null;
    const timer = setTimeout(() => fail(new Error('SMTP timeout')), cfg.timeout || 20000);
    function fail(e) { if (done) return; done = true; clearTimeout(timer); try { sock && sock.destroy(); } catch (_) { /* ignore */ } reject(e); }
    function findEnd(b) {
      let pos = 0;
      for (;;) { const nl = b.indexOf('\r\n', pos); if (nl < 0) return -1; if (/^\d{3}( |$)/.test(b.slice(pos, nl))) return nl + 2; pos = nl + 2; }
    }
    function onData(d) {
      buf += d.toString('utf8');
      for (;;) {
        const end = findEnd(buf); if (end < 0) break;
        const lines = buf.slice(0, end).split('\r\n').filter(Boolean); buf = buf.slice(end);
        const r = { code: +lines[lines.length - 1].slice(0, 3), lines, text: lines.join(' | ') };
        if (waiter) { const w = waiter; waiter = null; w(r); } else queue.push(r);
      }
    }
    const attach = s => { s.on('data', onData); s.on('error', fail); s.on('close', () => { if (!done) fail(new Error('SMTP connection closed: ' + buf.slice(0, 200))); }); };
    const next = () => new Promise(r => { if (queue.length) r(queue.shift()); else waiter = r; });
    async function cmd(line, expect, label) {
      if (line != null) sock.write(line + '\r\n');
      const r = await next();
      if (!expect.includes(r.code)) throw new Error(`SMTP ${label || (line ? line.split(' ')[0] : 'greeting')} failed: ${r.text}`);
      return r;
    }
    const tlsOpts = { rejectUnauthorized: !cfg.insecure, minVersion: 'TLSv1.2' };
    if (!net.isIP(host)) tlsOpts.servername = host; // SNI must be a host name, never an IP
    (async () => {
      sock = cfg.secure === 'tls' ? tls.connect(Object.assign({ host, port }, tlsOpts)) : net.connect({ host, port });
      attach(sock);
      await cmd(null, [220]);
      let caps = (await cmd('EHLO ' + helo, [250])).lines;
      if (cfg.secure === 'starttls') {
        if (!caps.some(l => /STARTTLS/i.test(l))) throw new Error('SMTP server does not offer STARTTLS (set SMTP_SECURE=tls or none)');
        await cmd('STARTTLS', [220]);
        sock.removeAllListeners('data'); sock.removeAllListeners('close'); sock.removeAllListeners('error');
        const plain = sock;
        sock = await new Promise((res, rej) => { const t = tls.connect(Object.assign({ socket: plain }, tlsOpts), () => res(t)); t.once('error', rej); });
        attach(sock);
        caps = (await cmd('EHLO ' + helo, [250])).lines;
      }
      if (cfg.user) {
        const authLine = caps.find(l => /AUTH[ =]/i.test(l)) || '';
        if (/PLAIN/i.test(authLine)) await cmd('AUTH PLAIN ' + Buffer.from(`\0${cfg.user}\0${cfg.pass || ''}`, 'utf8').toString('base64'), [235], 'AUTH');
        else { await cmd('AUTH LOGIN', [334], 'AUTH'); await cmd(b64(cfg.user), [334], 'AUTH'); await cmd(b64(cfg.pass || ''), [235], 'AUTH'); }
      }
      await cmd(`MAIL FROM:<${addrOf(cfg.from)}>`, [250]);
      await cmd(`RCPT TO:<${to}>`, [250, 251]);
      await cmd('DATA', [354]);
      sock.write(message.replace(/\r\n\./g, '\r\n..') + '\r\n.\r\n');
      await cmd(null, [250], 'DATA');
      done = true; clearTimeout(timer);
      try { sock.end('QUIT\r\n'); } catch (_) { /* ignore */ }
      resolve();
    })().catch(fail);
  });
}

class Mailer {
  constructor(cfg, log) {
    this.cfg = cfg; this.log = log || (() => {});
    this.enabled = !!(cfg.host && cfg.from && EMAIL_RE.test(addrOf(cfg.from)));
    this.q = []; this.busy = false; this.timer = null;
  }
  send(to, subject, text) {
    if (!this.enabled) return Promise.reject(new Error('mail is not configured'));
    if (!EMAIL_RE.test(to)) return Promise.reject(new Error('bad recipient'));
    return smtpSend(this.cfg, to, buildMessage({ from: this.cfg.from, to, subject, text }));
  }
  enqueue(to, subject, text) {
    if (!this.enabled || !EMAIL_RE.test(to)) return;
    if (this.q.length >= 500) { this.log('mail queue full — dropping message to', to); return; }
    this.q.push({ to, subject, text, tries: 0, at: Date.now() });
    this.pump();
  }
  async pump() {
    if (this.busy) return; this.busy = true;
    try {
      for (;;) {
        this.q.sort((a, b) => a.at - b.at);
        const j = this.q[0]; if (!j) break;
        const wait = j.at - Date.now();
        if (wait > 0) { clearTimeout(this.timer); this.timer = setTimeout(() => this.pump(), wait); this.timer.unref(); break; }
        this.q.shift();
        try { await this.send(j.to, j.subject, j.text); this.log('mail sent to', j.to); }
        catch (e) {
          j.tries++;
          if (j.tries < 3) { j.at = Date.now() + (j.tries === 1 ? 60e3 : 300e3); this.q.push(j); this.log('mail to', j.to, 'failed, will retry:', e.message); }
          else this.log('MAIL FAILED after 3 attempts to', j.to, '—', e.message);
        }
      }
    } finally { this.busy = false; }
  }
}

module.exports = { Mailer, smtpSend, buildMessage, encodeHeader };
