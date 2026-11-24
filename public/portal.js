/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/* IT Set Desk — self-service portal for requesters (Arabic / English) */
(function () {
  'use strict';
  const L = {
    brand: ['الدعم الفني', 'IT Support'], portal: ['بوابة الطلبات', 'Request portal'], powered: ['يعمل بنظام', 'Powered by'],
    off: ['البوابة مش مفعّلة دلوقتي. تواصل مع فريق الـ IT مباشرة.', 'The portal is not enabled. Please contact the IT team directly.'],
    newReq: ['طلب جديد', 'New request'], newReqSub: ['اكتب مشكلتك أو طلبك وفريق الدعم هيتابع معاك', 'Describe your problem or request and the support team will follow up'],
    track: ['متابعة طلباتي', 'Track my requests'], trackSub: ['ادخل ببريدك وهيوصلك كود دخول', 'Sign in with your email and we will send you a code'],
    trackNoMail: ['استخدم رابط المتابعة اللي ظهر لك بعد ما بعتّ الطلب.', 'Use the tracking link you got after submitting your request.'],
    name: ['اسمك', 'Your name'], email: ['بريدك الإلكتروني', 'Your email'], dept: ['القسم', 'Department'], kind: ['نوع الطلب', 'Request type'],
    k_incident: ['عندي مشكلة', 'Something is broken'], k_request: ['محتاج حاجة', 'I need something'], category: ['التصنيف', 'Category'],
    title: ['عنوان مختصر', 'Short summary'], titlePh: ['مثلاً: الطابعة مش بتطبع', 'e.g. The printer is not printing'], desc: ['التفاصيل', 'Details'],
    descPh: ['حصل إيه؟ من إمتى؟ ظهرت رسالة خطأ؟', 'What happened? Since when? Any error message?'],
    impact: ['مين متأثر؟', 'Who is affected?'], i3: ['أنا بس', 'Only me'], i2: ['فريقي / قسمي', 'My team'], i1: ['الشركة كلها', 'The whole company'],
    urgency: ['قد إيه مستعجل؟', 'How urgent?'], u3: ['ممكن يستنى', 'It can wait'], u2: ['محتاجه النهارده', 'Needed today'], u1: ['واقف عن الشغل', 'I cannot work'],
    files: ['مرفقات (اختياري)', 'Attachments (optional)'], filesHint: ['صور أو ملفات توضح المشكلة — لحد {n} ميجا للملف', 'Screenshots or files — up to {n} MB each'],
    submit: ['إرسال الطلب', 'Submit request'], sending: ['جاري الإرسال…', 'Sending…'], allowed: ['مسموح ببريد: {d}', 'Allowed email domains: {d}'],
    done: ['تم استلام طلبك', 'Your request was received'], doneSub: ['رقم الطلب', 'Request number'],
    saveLink: ['احفظ الرابط ده — منه تتابع طلبك وترد على فريق الدعم:', 'Save this link — use it to track your request and reply to the support team:'],
    copy: ['نسخ الرابط', 'Copy link'], copied: ['تم النسخ', 'Copied'], openReq: ['فتح الطلب', 'Open request'], back: ['الرجوع', 'Back'],
    s_new: ['تم الاستلام', 'Received'], s_progress: ['جاري العمل عليه', 'In progress'], s_pending: ['في انتظار ردك', 'Waiting for your reply'], s_resolved: ['تم الحل', 'Resolved'], s_closed: ['مغلق', 'Closed'],
    you: ['أنت', 'You'], support: ['الدعم الفني', 'IT Support'], reply: ['ردك', 'Your reply'], replyPh: ['اكتب ردك هنا…', 'Write your reply…'], send: ['إرسال', 'Send'],
    closedNote: ['الطلب ده مغلق. لو المشكلة رجعت افتح طلب جديد.', 'This request is closed. If the problem comes back, open a new request.'],
    resolvedNote: ['الطلب اتحل. لو المشكلة لسه موجودة رد هنا وهيتفتح تاني.', 'This request is resolved. If the problem is still there, reply here and it will be reopened.'],
    pendingNote: ['فريق الدعم مستني ردك علشان يكمل.', 'The support team is waiting for your reply to continue.'],
    rate: ['قيّم الخدمة', 'Rate the service'], thanks: ['شكراً على تقييمك!', 'Thank you for your rating!'], attach: ['إرفاق ملف', 'Attach a file'], uploaded: ['تم رفع الملف', 'File uploaded'],
    created: ['اتفتح', 'Opened'], updated: ['آخر تحديث', 'Updated'], notFound: ['الرابط غير صحيح أو الطلب مش موجود', 'This link is invalid or the request does not exist'],
    sendCode: ['ابعتلي كود الدخول', 'Send me a code'], code: ['كود الدخول (6 أرقام)', 'Sign-in code (6 digits)'], signIn: ['دخول', 'Sign in'],
    codeSent: ['لو البريد ده مسموح بيه، هيوصلك كود خلال دقيقة. شوف الـ Spam كمان.', 'If this email is allowed, a code will arrive within a minute. Check spam too.'],
    myDevices: ['الأجهزة اللي في عهدتي', 'Devices in my custody'], noDevices: ['مفيش أجهزة مسجّلة في عهدتك', 'No devices are recorded in your custody'],
    devSince: ['في عهدتك من', 'In your custody since'], devSerial: ['السيريال', 'Serial'], devHelp: ['لو فيه جهاز ناقص أو مش معاك، افتح طلب للـ IT.', 'If a device is missing or not with you, open a request to IT.'],
    as_stock: ['في المخزن', 'In stock'], as_active: ['قيد الاستخدام', 'In use'], as_repair: ['في الصيانة', 'In repair'],
    e_csat_done: ['التقييم اتسجل قبل كده ومش ممكن يتغير', 'This request was already rated; the rating cannot be changed'],
    help: ['حلول سريعة', 'Self-help articles'], helpSub: ['جرّب الحلول دي قبل ما تفتح طلب', 'Try these fixes before opening a request'],
    helpSearch: ['ابحث في الحلول…', 'Search articles…'], noHelp: ['مفيش مقالات منشورة دلوقتي', 'No articles are published yet'], noHelpMatch: ['مفيش نتايج', 'No matching articles'],
    myReqs: ['طلباتي', 'My requests'], noReqs: ['مفيش طلبات على البريد ده', 'No requests for this email'], signOut: ['خروج', 'Sign out'],
    e_v_email: ['اكتب بريد إلكتروني صحيح', 'Enter a valid email address'], e_v_title: ['العنوان قصير — 5 حروف على الأقل', 'The summary is too short — at least 5 characters'],
    e_v_req: ['اكتب اسمك', 'Enter your name'], e_v_cat: ['اختار التصنيف', 'Choose a category'], e_v_req2: ['في بيانات ناقصة أو غير صحيحة', 'Some fields are missing or invalid'],
    e_domain_not_allowed: ['البريد ده مش من نطاقات الشركة المسموح بيها', 'This email is not from an allowed company domain'],
    e_rate_limited: ['طلبات كتير في وقت قصير. جرّب تاني بعد شوية.', 'Too many requests in a short time. Please try again later.'],
    e_bad_code: ['الكود غلط أو انتهى. اطلب كود جديد.', 'The code is wrong or expired. Request a new one.'], e_ticket_closed: ['الطلب مغلق', 'This request is closed'],
    e_blocked_type: ['نوع الملف ده ممنوع لأسباب أمنية', 'This file type is blocked for security reasons'], e_too_large: ['الملف أكبر من المسموح', 'The file is too large'],
    e_portal_off: ['البوابة مش مفعّلة', 'The portal is not enabled'], e_not_found: ['مش موجود', 'Not found'], e_offline: ['تعذر الاتصال بالسيرفر', 'Cannot reach the server'],
    e_mail_off: ['الدخول بالإيميل مش متاح', 'Email sign-in is not available'], e_server_error: ['حصل خطأ، جرّب تاني', 'Something went wrong, please try again'],
    e_csat_open: ['التقييم متاح بعد الحل', 'Rating is available once resolved'], e_too_many_files: ['وصلت للحد الأقصى من المرفقات', 'Attachment limit reached'], e_empty_file: ['الملف فاضي', 'The file is empty']
  };
  let lang = (() => { try { return localStorage.getItem('itset.portal.lang') || 'ar'; } catch (e) { return 'ar'; } })();
  const t = k => L[k] ? L[k][lang === 'ar' ? 0 : 1] : k;
  const errMsg = c => L['e_' + c] ? t('e_' + c) : t('e_server_error');
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const loc = () => lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  const fmt = ts => { try { return new Intl.DateTimeFormat(loc(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(ts); } catch (e) { return new Date(ts).toLocaleString(); } };
  const remember = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) { return ''; } };
  function toast(msg, err) { const el = document.createElement('div'); el.className = 'toast' + (err ? ' err' : ''); el.textContent = msg; $('#toasts').appendChild(el); setTimeout(() => el.remove(), 3600); }

  async function api(method, url, body, raw) {
    const o = { method, headers: {}, credentials: 'same-origin' };
    if (method !== 'GET') { o.headers['x-itset'] = '1'; if (raw) { o.headers['content-type'] = 'application/octet-stream'; o.headers['x-filename'] = encodeURIComponent(raw.name || 'file'); o.body = raw; } else if (body !== undefined) { o.headers['content-type'] = 'application/json'; o.body = JSON.stringify(body); } }
    let r; try { r = await fetch(url, o); } catch (e) { throw { code: 'offline' }; }
    let j = {}; try { j = await r.json(); } catch (_) { /* empty */ }
    if (!r.ok) throw { code: j.error || 'server_error', status: r.status };
    return j;
  }

  const P = { cfg: null, view: 'home', ticket: null, token: null, mine: null, devices: null, kb: null, codeFor: '', created: null, files: [] };
  function applyLang() { const r = document.documentElement; r.lang = lang; r.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.title = t('portal') + ' — ' + t('brand'); }
  function setLang(l) { lang = l; remember('itset.portal.lang', l); render(); }

  function shell(inner) {
    return `<div class="p-wrap"><header class="p-top"><div class="brand"><div class="brand-mark">IT</div><div><b>${t('brand')}</b><small>${t('portal')}</small></div></div>
      <div class="grow"></div>${P.cfg && P.cfg.signedIn ? `<span class="muted p-who" dir="ltr">${esc(P.cfg.signedIn)}</span><button class="btn sm ghost" data-a="signout">${t('signOut')}</button>` : ''}
      <button class="btn ghost langbtn" data-a="lang" aria-label="Language" lang="${lang === 'ar' ? 'en' : 'ar'}">${lang === 'ar' ? 'EN' : 'ع'}</button></header>
      <main class="p-main">${inner}</main><footer class="p-foot">${t('powered')} <b>IT Set Desk</b></footer></div>`;
  }
  const stChipP = s => `<span class="chip st-${s}">${t('s_' + s)}</span>`;
  function sel(id, opts, cur) { return `<select id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`; }

  function vHome() {
    const c = P.cfg; if (!c.enabled) return `<div class="card p-card"><p>${t('off')}</p></div>`;
    const doms = c.domains && c.domains.length ? `<small class="muted">${t('allowed').replace('{d}', c.domains.join(', '))}</small>` : '';
    const form = `<form class="card p-card props" id="reqForm" novalidate><div><h1>${t('newReq')}</h1><p class="muted">${t('newReqSub')}</p></div>
      <div class="grid2"><label class="field"><span>${t('name')} *</span><input type="text" id="pName" maxlength="80" autocomplete="name" value="${esc(remember('itset.portal.name'))}"></label>
      <label class="field"><span>${t('email')} *</span><input type="email" id="pEmail" maxlength="120" autocomplete="email" dir="ltr" value="${esc(remember('itset.portal.email'))}">${doms}</label></div>
      <div class="grid2"><label class="field"><span>${t('dept')}</span><input type="text" id="pDept" maxlength="60" value="${esc(remember('itset.portal.dept'))}"></label>
      <label class="field"><span>${t('kind')}</span>${sel('pType', [['incident', t('k_incident')], ['request', t('k_request')]], 'incident')}</label></div>
      <label class="field"><span>${t('category')} *</span>${sel('pCat', [['', '—']].concat(c.categories.map(x => [x.id, x[lang] || x.name])), '')}</label>
      <label class="field"><span>${t('title')} *</span><input type="text" id="pTitle" maxlength="160" placeholder="${t('titlePh')}"></label>
      <label class="field"><span>${t('desc')}</span><textarea id="pDesc" rows="5" maxlength="5000" placeholder="${t('descPh')}"></textarea></label>
      <div class="grid2"><label class="field"><span>${t('impact')}</span>${sel('pImp', [[3, t('i3')], [2, t('i2')], [1, t('i1')]], 3)}</label>
      <label class="field"><span>${t('urgency')}</span>${sel('pUrg', [[3, t('u3')], [2, t('u2')], [1, t('u1')]], 2)}</label></div>
      <label class="field"><span>${t('files')}</span><input type="file" id="pFiles" multiple><small class="muted">${t('filesHint').replace('{n}', c.limits.maxUploadMB)}</small></label>
      <div class="hp" aria-hidden="true"><label>Website <input type="text" id="pWebsite" tabindex="-1" autocomplete="off"></label></div>
      <small class="ferr" id="pErr" role="alert"></small>
      <button class="btn pri" type="submit" id="pSubmit" style="justify-content:center">${t('submit')}</button></form>`;
    let trackBox;
    if (!c.mail) trackBox = `<div class="card p-card"><h2>${t('track')}</h2><p class="muted">${t('trackNoMail')}</p></div>`;
    else if (c.signedIn) trackBox = vMine() + vDevices(); // DESK-GAP-001
    else trackBox = `<form class="card p-card props" id="otpForm" novalidate><div><h2>${t('track')}</h2><p class="muted">${t('trackSub')}</p></div>
      <label class="field"><span>${t('email')}</span><input type="email" id="oEmail" maxlength="120" dir="ltr" autocomplete="email" value="${esc(P.codeFor || remember('itset.portal.email'))}"></label>
      ${P.codeFor ? `<div class="note">${t('codeSent')}</div><label class="field"><span>${t('code')}</span><input type="text" id="oCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" dir="ltr" class="mono"></label>` : ''}
      <small class="ferr" id="oErr" role="alert"></small>
      <button class="btn ${P.codeFor ? 'pri' : ''}" type="submit" style="justify-content:center">${P.codeFor ? t('signIn') : t('sendCode')}</button></form>`;
    return `<div class="p-grid">${form}<div class="p-side">${vHelp()}${trackBox}</div></div>`;
  }
  /* DESK-GAP-004 — portal knowledge base: the server only ever sends audience='portal' articles */
  function vHelp() {
    const k = P.kb; if (k && !k.articles.length) return '';
    return `<div class="card p-card"><h2>${t('help')}</h2><p class="muted">${t('helpSub')}</p>${!k ? `<div class="muted">…</div>` : `
      <input type="search" id="kbQ" placeholder="${t('helpSearch')}" aria-label="${t('helpSearch')}">
      <div class="kbs" id="kbList">${k.articles.map(x => `<details class="p-kb" data-hay="${esc((x.title + ' ' + x.body).toLowerCase())}"><summary>${esc(x.title)}${x.category ? ` <span class="muted">· ${esc(x.category[lang] || x.category.name)}</span>` : ''}</summary><div class="tx">${esc(x.body)}</div></details>`).join('')}</div>
      <div class="muted" id="kbNone" hidden>${t('noHelpMatch')}</div>`}</div>`;
  }
  async function loadKb() {
    try { P.kb = await api('GET', '/api/portal/kb'); } catch (e) { P.kb = { articles: [] }; }
    if (P.view === 'home') render();
  }
  function vDevices() {
    const d = P.devices;
    return `<div class="card p-card"><h2>${t('myDevices')}</h2>${!d ? `<div class="muted">…</div>` : d.assets.length ? `<div class="kbs">${d.assets.map(x =>
      `<div class="p-dev"><span class="mono">${esc(x.tag)}</span> ${esc(x.name)} <span class="muted">· ${esc(x.type)}${x.serial ? ' · ' + t('devSerial') + ' ' + esc(x.serial) : ''}</span><div class="muted" style="font-size:12px">${esc(t('as_' + x.status) || x.status)}${x.since ? ' · ' + t('devSince') + ' ' + esc(fmt(x.since)) : ''}</div></div>`).join('')}</div><p class="muted" style="font-size:12px">${t('devHelp')}</p>` : `<div class="muted">${t('noDevices')}</div>`}</div>`;
  }
  function vMine() {
    const m = P.mine;
    return `<div class="card p-card"><h2>${t('myReqs')}</h2>${!m ? `<div class="muted">…</div>` : m.tickets.length ? `<div class="kbs">${m.tickets.map(x =>
      `<button data-a="openTok" data-v="${esc(x.token)}"><span class="mono muted">${esc(x.key)}</span> ${esc(x.title)} ${stChipP(x.status)}</button>`).join('')}</div>` : `<div class="muted">${t('noReqs')}</div>`}</div>`;
  }
  function vDone() {
    const c = P.created; const url = location.origin + '/portal?t=' + c.token;
    return `<div class="card p-card props p-done"><div class="p-check">✓</div><h1>${t('done')}</h1><p class="muted">${t('doneSub')}: <b class="mono">${esc(c.key)}</b></p>
      <p>${t('saveLink')}</p><code class="cmd" dir="ltr">${esc(url)}</code>
      <div class="row-acts" style="justify-content:center"><button class="btn" data-a="copy" data-v="${esc(url)}">${t('copy')}</button><button class="btn pri" data-a="openTok" data-v="${esc(c.token)}">${t('openReq')}</button></div></div>`;
  }
  function vTicket() {
    const x = P.ticket; if (!x) return `<div class="card p-card"><p>${t('notFound')}</p><button class="btn" data-a="home">${t('back')}</button></div>`;
    const note = x.status === 'closed' ? t('closedNote') : x.status === 'resolved' ? t('resolvedNote') : x.status === 'pending' ? t('pendingNote') : '';
    const msgs = [{ mine: true, body: x.desc || x.title, at: x.createdAt }].concat(x.comments);
    return `<div class="p-ticket"><button class="btn sm ghost" data-a="home">← ${t('back')}</button>
      <div class="card p-card"><div class="row1"><span class="mono muted">${esc(x.key)}</span>${stChipP(x.status)}<span class="tag">${esc((x.categoryL && x.categoryL[lang]) || x.category)}</span></div>
      <h1>${esc(x.title)}</h1><div class="muted" style="font-size:13px">${t('created')} ${fmt(x.createdAt)} · ${t('updated')} ${fmt(x.updatedAt)}</div>
      ${note ? `<div class="note">${note}</div>` : ''}
      ${x.canRate ? `<div class="p-rate"><b>${x.csat ? t('thanks') : t('rate')}</b><div class="stars">${[1, 2, 3, 4, 5].map(v => x.csat ? `<span class="${x.csat >= v ? 'on' : ''}" aria-label="${v}">★</span>` : `<button data-a="rate" data-v="${v}" aria-label="${v}">★</button>`).join('')}</div></div>` : ''}
      </div>
      <div class="p-thread">${msgs.map(m => `<div class="p-msg ${m.mine ? 'mine' : ''}"><div class="meta"><b>${m.mine ? t('you') : esc(m.by || t('support'))}</b><span class="num">${fmt(m.at)}</span></div><div class="tx">${esc(m.body)}</div></div>`).join('')}</div>
      ${x.attachments.length ? `<div class="card p-card"><h3>${t('files')}</h3><div class="kbs">${x.attachments.map(a => `<a class="btn sm" href="/api/portal/t/${encodeURIComponent(P.token)}/attachments/${encodeURIComponent(a.id)}" download="${esc(a.name)}">📎 ${esc(a.name)}</a>`).join('')}</div></div>` : ''}
      ${x.canReply ? `<form class="card p-card props" id="replyForm"><label class="field"><span>${t('reply')}</span><textarea id="rBody" rows="4" maxlength="10000" placeholder="${t('replyPh')}"></textarea></label>
        <div class="row-acts" style="justify-content:space-between"><label class="btn sm">${t('attach')}<input type="file" id="rFile" multiple hidden></label><button class="btn pri" type="submit">${t('send')}</button></div></form>` : ''}
    </div>`;
  }
  function render() {
    applyLang();
    const v = !P.cfg ? '<div class="muted">…</div>' : P.view === 'ticket' ? vTicket() : P.view === 'done' ? vDone() : vHome();
    $('#papp').innerHTML = shell(v);
  }

  async function loadTicket(tok) {
    P.token = tok; P.view = 'ticket'; P.ticket = null;
    try { P.ticket = (await api('GET', '/api/portal/t/' + encodeURIComponent(tok))).ticket; if (P.ticket.lang && !remember('itset.portal.lang')) lang = P.ticket.lang; } catch (e) { if (e.code !== 'not_found') toast(errMsg(e.code), true); }
    render();
  }
  function go(tok) { try { history.pushState(null, '', tok ? '/portal?t=' + encodeURIComponent(tok) : '/portal'); } catch (e) { /* ignore */ } if (tok) loadTicket(tok); else { P.view = 'home'; P.ticket = null; render(); if (P.cfg.signedIn) loadMine(); } }
  async function loadMine() {
    try { P.mine = await api('GET', '/api/portal/mine'); } catch (e) { if (e.code === 'auth') { P.cfg.signedIn = null; } }
    try { P.devices = P.cfg.signedIn ? await api('GET', '/api/portal/assets') : null; } catch (e) { P.devices = { assets: [] }; } // DESK-GAP-001
    if (P.view === 'home') render();
  }
  async function uploadAll(tok, files) {
    const max = P.cfg.limits.maxUploadMB * 1048576; let last = null;
    for (const f of files) {
      if (f.size > max) { toast(`${f.name}: ${t('e_too_large')}`, true); continue; }
      try { last = (await api('POST', `/api/portal/t/${encodeURIComponent(tok)}/attachments`, undefined, f)).ticket; toast(t('uploaded')); } catch (e) { toast(`${f.name}: ${errMsg(e.code)}`, true); }
    }
    return last;
  }

  document.addEventListener('click', async e => {
    const el = e.target.closest('[data-a]'); if (!el) return; const a = el.dataset.a;
    if (a === 'lang') setLang(lang === 'ar' ? 'en' : 'ar');
    else if (a === 'home') go(null);
    else if (a === 'openTok') go(el.dataset.v);
    else if (a === 'copy') { try { await navigator.clipboard.writeText(el.dataset.v); toast(t('copied')); } catch (_) { toast(el.dataset.v); } }
    else if (a === 'rate') { try { P.ticket = (await api('POST', `/api/portal/t/${encodeURIComponent(P.token)}/csat`, { v: +el.dataset.v })).ticket; render(); toast(t('thanks')); } catch (err) { toast(errMsg(err.code), true); } }
    else if (a === 'signout') { try { await api('POST', '/api/portal/logout'); } catch (_) { /* ignore */ } P.cfg.signedIn = null; P.mine = null; P.devices = null; P.codeFor = ''; render(); }
  });
  document.addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target;
    if (f.id === 'reqForm') {
      const er = $('#pErr'); er.textContent = '';
      const d = { name: $('#pName').value.trim(), email: $('#pEmail').value.trim(), dept: $('#pDept').value.trim(), type: $('#pType').value, categoryId: $('#pCat').value,
        title: $('#pTitle').value.trim(), desc: $('#pDesc').value.trim(), impact: +$('#pImp').value, urgency: +$('#pUrg').value, website: $('#pWebsite').value, lang };
      if (!d.name) return er.textContent = t('e_v_req');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) return er.textContent = t('e_v_email');
      if (!d.categoryId) return er.textContent = t('e_v_cat');
      if (d.title.length < 5) return er.textContent = t('e_v_title');
      const btn = $('#pSubmit'); btn.disabled = true; btn.textContent = t('sending');
      try {
        const r = await api('POST', '/api/portal/tickets', d);
        remember('itset.portal.name', d.name); remember('itset.portal.email', d.email); remember('itset.portal.dept', d.dept);
        const files = [...($('#pFiles').files || [])]; if (files.length) await uploadAll(r.token, files);
        P.created = r; P.view = 'done'; try { history.pushState(null, '', '/portal?t=' + encodeURIComponent(r.token)); } catch (_) { /* ignore */ }
        P.token = r.token; render();
      } catch (err) { er.textContent = errMsg(err.code); btn.disabled = false; btn.textContent = t('submit'); }
    } else if (f.id === 'replyForm') {
      const body = $('#rBody').value.trim(); const files = [...($('#rFile').files || [])];
      if (!body && !files.length) return;
      try {
        if (files.length) { const x = await uploadAll(P.token, files); if (x) P.ticket = x; }
        if (body) P.ticket = (await api('POST', `/api/portal/t/${encodeURIComponent(P.token)}/reply`, { body })).ticket;
        render();
      } catch (err) { toast(errMsg(err.code), true); }
    } else if (f.id === 'otpForm') {
      const er = $('#oErr'); er.textContent = ''; const email = $('#oEmail').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return er.textContent = t('e_v_email');
      try {
        if (!P.codeFor || P.codeFor !== email) { await api('POST', '/api/portal/otp', { email, lang }); P.codeFor = email; render(); setTimeout(() => $('#oCode')?.focus(), 30); }
        else { const r = await api('POST', '/api/portal/login', { email, code: $('#oCode').value }); P.cfg.signedIn = r.email; P.codeFor = ''; render(); loadMine(); }
      } catch (err) { er.textContent = errMsg(err.code); }
    }
  });
  document.addEventListener('input', e => {
    if (e.target.id !== 'kbQ') return; const q = e.target.value.trim().toLowerCase(); let n = 0;
    document.querySelectorAll('#kbList .p-kb').forEach(d => { const hit = !q || d.dataset.hay.includes(q); d.hidden = !hit; if (hit) n++; });
    $('#kbNone').hidden = n > 0;
  });
  document.addEventListener('change', e => { if (e.target.id === 'rFile' && e.target.files.length) $('#replyForm').requestSubmit(); });
  window.addEventListener('popstate', () => { const tok = new URLSearchParams(location.search).get('t'); if (tok) loadTicket(tok); else { P.view = 'home'; render(); } });

  (async () => {
    applyLang(); render();
    try { P.cfg = await api('GET', '/api/portal/config'); } catch (e) { P.cfg = { enabled: false, categories: [], domains: [], limits: { maxUploadMB: 15 } }; }
    const tok = new URLSearchParams(location.search).get('t');
    if (tok && P.cfg.enabled) loadTicket(tok); else { render(); if (P.cfg.signedIn) loadMine(); }
    if (P.cfg.enabled) loadKb(); // DESK-GAP-004
  })();
})();
