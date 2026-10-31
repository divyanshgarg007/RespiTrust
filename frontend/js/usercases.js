
(function () {
  'use strict';
  var API = window.RESPITRUST_API_BASE ||
    (window.location.hostname ? window.location.protocol + '//' + window.location.hostname + ':8000' : 'http://localhost:8000');
  var TOKEN_KEY = 'respitrust_token';

  function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function lang() {
    try { if (window.RespiTrustI18n) return window.RespiTrustI18n.lang; } catch (e) {}
    try { return localStorage.getItem('respitrust_lang') || 'en'; } catch (e) { return 'en'; }
  }
  function T(en, hi) { return lang() === 'hi' ? hi : en; }
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function fmt(t) { return t ? new Date(t * 1000).toLocaleString() : ''; }
  var LABEL = { bacteria: ['Bacterial pneumonia', 'बैक्टीरियल निमोनिया'], virus: ['Viral pneumonia', 'वायरल निमोनिया'], normal: ['Normal', 'सामान्य (नॉर्मल)'] };
  function lbl(k) { return (LABEL[k] || ['', ''])[lang() === 'hi' ? 1 : 0]; }
  function status(s) {
    return { open: T('Waiting for a doctor', 'डॉक्टर का इंतज़ार'), in_review: T('Doctor is reviewing', 'डॉक्टर देख रहे हैं'), reviewed: T('Review done', 'समीक्षा पूरी') }[s] || s;
  }
  function verdict(v) {
    return { agree: T('The doctor agrees with the AI result.', 'डॉक्टर AI के नतीजे से सहमत हैं।'),
      disagree: T('The doctor does not fully agree with the AI result.', 'डॉक्टर AI के नतीजे से पूरी तरह सहमत नहीं हैं।'),
      need_more: T('The doctor needs more tests or information.', 'डॉक्टर को और जांच या जानकारी चाहिए।') }[v] || '';
  }

  async function api(path, opt) {
    opt = opt || {};
    var h = {};
    if (token()) h['Authorization'] = 'Bearer ' + token();
    if (opt.body) h['Content-Type'] = 'application/json';
    var res = await fetch(API + path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined });
    var d = {}; try { d = await res.json(); } catch (e) {}
    if (!res.ok) {
      var x = d.detail;
      throw new Error(typeof x === 'string' ? x : T('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। फिर कोशिश करें।'));
    }
    return d;
  }
  function imgSrc(historyId) { return API + '/api/history/image/' + historyId + '?token=' + encodeURIComponent(token()); }

 
  var modal = null, pollTimer = null;
  function closeM() {
    clearInterval(pollTimer); pollTimer = null;
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
  }
  function openM(html) {
    closeM();
    modal = document.createElement('div'); modal.className = 'rtx-modal'; modal.style.zIndex = 10010;
    var sheet = document.createElement('div'); sheet.className = 'rtx-sheet';
    var x = document.createElement('button'); x.className = 'rtx-x'; x.type = 'button'; x.innerHTML = '&times;'; x.setAttribute('aria-label', 'Close');
    x.addEventListener('click', closeM);
    var body = document.createElement('div'); body.innerHTML = html;
    sheet.appendChild(x); sheet.appendChild(body); modal.appendChild(sheet);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeM(); });
    document.body.appendChild(modal);
    return body;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal) closeM(); });

  function need_login() {
    var b = openM('<h2>' + T('Please log in', 'कृपया लॉग इन करें') + '</h2><p>' +
      T('Log in with your phone number first, then you can send your X-ray to a doctor.', 'पहले फ़ोन नंबर से लॉग इन करें, फिर आप X-ray डॉक्टर को भेज सकते हैं।') + '</p>');
    return b;
  }


  function sendDialog(historyId) {
    if (!token()) return need_login();
    var b = openM('<h2>' + T('Send this X-ray to a doctor', 'यह X-ray डॉक्टर को भेजें') + '</h2>' +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px"><img alt="X-ray" style="width:150px;height:150px;object-fit:cover;border-radius:10px;border:1px solid #DCE3EA" src="' + esc(imgSrc(historyId)) + '">' +
      '<div style="flex:1;min-width:220px"><label style="font-weight:600;font-size:14px">' + T('Tell the doctor about your symptoms (optional)', 'अपने लक्षण डॉक्टर को बताएं (वैकल्पिक)') + '</label>' +
      '<textarea id="rtxcNote" maxlength="1000" style="width:100%;min-height:90px;margin-top:6px;border:1.5px solid #DCE3EA;border-radius:10px;padding:10px;font:15px Inter,sans-serif" placeholder="' + esc(T('For example: cough and fever for 4 days', 'जैसे: 4 दिन से खांसी और बुखार')) + '"></textarea></div></div>' +
      '<label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-size:13.5px"><input type="checkbox" id="rtxcOk" style="margin-top:3px"> <span>' +
      T('I agree that a RespiTrust doctor and the RespiTrust team can see this X-ray, its AI result and my messages to review my case.', 'मैं सहमत हूं कि RespiTrust के डॉक्टर और टीम मेरा केस देखने के लिए यह X-ray, AI नतीजा और मेरे संदेश देख सकते हैं।') + '</span></label>' +
      '<div id="rtxcErr" style="color:#B3261E;font-size:13.5px;min-height:18px;margin-top:8px"></div>' +
      '<div class="rtx-actions"><button type="button" class="rtx-btn solid" id="rtxcGo">' + T('Send to doctor', 'डॉक्टर को भेजें') + '</button></div>' +
      '<p class="rtx-note">' + T('A doctor will reply here. This is not an emergency service. If you have trouble breathing, go to a hospital or call 108.', 'डॉक्टर यहीं जवाब देंगे। यह इमरजेंसी सेवा नहीं है। सांस में तकलीफ़ हो तो अस्पताल जाएं या 108 पर कॉल करें।') + '</p>');
    $('#rtxcGo', b).addEventListener('click', async function () {
      if (!$('#rtxcOk', b).checked) { $('#rtxcErr', b).textContent = T('Please tick the box to agree.', 'कृपया सहमति के लिए बॉक्स पर टिक करें।'); return; }
      try {
        var r = await api('/api/cases', { method: 'POST', body: { history_id: historyId, note: $('#rtxcNote', b).value } });
        openCase(r.case.id);
        refreshDot();
      } catch (e) { $('#rtxcErr', b).textContent = e.message; }
    });
  }


  async function openList() {
    if (!token()) return need_login();
    var b = openM('<h2>' + T('My doctor cases', 'मेरे डॉक्टर केस') + '</h2><div id="rtxcBody">…</div>');
    try {
      var d = await api('/api/cases');
      var box = $('#rtxcBody', b);
      if (!d.cases.length) {
        box.innerHTML = '<p>' + T('You have not sent any X-ray to a doctor yet. Open History, tap a past X-ray and choose "Send to a doctor", or use the button under a new result.', 'आपने अभी तक कोई X-ray डॉक्टर को नहीं भेजा है। History खोलें, किसी X-ray पर टैप करें और "डॉक्टर को भेजें" चुनें, या नए रिज़ल्ट के नीचे का बटन दबाएं।') + '</p>';
        return;
      }
      box.innerHTML = d.cases.map(function (c) {
        var s = c.scan || {};
        return '<div class="history-card" data-id="' + c.id + '" style="margin:8px 0"><img src="' + esc(imgSrc(s.history_id)) + '" alt="">' +
          '<div class="history-card-main"><div class="history-card-top"><span class="history-badge ' + esc(s.prediction_key) + '">' + esc(lbl(s.prediction_key)) + '</span>' +
          '<span class="history-card-date">' + esc(fmt(c.created_at)) + '</span></div>' +
          '<p class="history-card-region">' + esc(status(c.status)) + (c.doctor_name ? ' · ' + esc(c.doctor_name) : '') + '</p></div></div>';
      }).join('');
      box.querySelectorAll('.history-card').forEach(function (n) {
        n.addEventListener('click', function () { openCase(+n.getAttribute('data-id')); });
      });
    } catch (e) { $('#rtxcBody', b).textContent = e.message; }
  }

  function threadHTML(msgs) {
    if (!msgs.length) return '<div style="color:#64748B;font-size:14px;padding:8px">' + T('No messages yet.', 'अभी कोई संदेश नहीं।') + '</div>';
    return msgs.map(function (m) {
      var me = m.sender_role === 'user', sys = m.sender_role === 'system';
      var st = sys ? 'align-self:center;color:#64748B;font-style:italic;font-size:12.5px;background:transparent'
        : me ? 'align-self:flex-end;background:#0E7C86;color:#fff' : 'align-self:flex-start;background:#fff;border:1px solid #DCE3EA';
      var who = me ? T('You', 'आप') : (sys ? '' : m.sender_label);
      return '<div style="max-width:88%;border-radius:12px;padding:8px 11px;font-size:14px;white-space:pre-wrap;word-wrap:break-word;' + st + '">' +
        (who ? '<small style="display:block;opacity:.75;font-size:11px;margin-bottom:2px">' + esc(who) + ' · ' + esc(fmt(m.created_at)) + '</small>' : '') + esc(m.body) + '</div>';
    }).join('');
  }

  async function openCase(id) {
    var c;
    try { c = await api('/api/cases/' + id); } catch (e) { var bb = openM('<p>' + esc(e.message) + '</p>'); return; }
    var s = c.scan || {};
    try { localStorage.setItem('rtxc_seen_' + id, String(c.messages.length)); } catch (e) {}
    refreshDot();
    var h = '<button type="button" class="rtx-btn" id="rtxcBack" style="padding:5px 12px">&larr; ' + T('All cases', 'सभी केस') + '</button>' +
      '<h2 style="margin-top:10px">' + T('Case', 'केस') + ' #' + c.id + '</h2>' +
      '<div class="rtx-hv" style="max-width:none"><div><div class="rtx-hv-img"><img id="rtxcImg" alt="X-ray" src="' + esc(imgSrc(s.history_id)) + '"></div></div><div>' +
      '<p style="margin:0 0 6px"><span class="rtx-pill ' + esc(s.prediction_key) + '">' + esc(lbl(s.prediction_key)) + '</span> &nbsp;<b>' + Math.round((s.confidence || 0) * 100) + '%</b></p>' +
      '<p style="margin:0;font-size:14px"><b>' + esc(status(c.status)) + '</b>' + (c.doctor_name ? ' · ' + esc(c.doctor_name) : '') + '</p>' +
      '<p style="margin:2px 0 0;font-size:12.5px;color:#64748B">' + esc(fmt(c.created_at)) + '</p>' +
      (c.verdict ? '<div style="margin-top:10px;border-radius:10px;padding:10px 12px;background:' + (c.verdict === 'agree' ? '#E8F6EE' : c.verdict === 'disagree' ? '#FDECEA' : '#FFF7E6') + '"><b>' + esc(verdict(c.verdict)) + '</b><div style="margin-top:4px;white-space:pre-wrap;font-size:14px">' + esc(c.remarks) + '</div></div>' : '') +
      '<h3>' + T('Chat with the doctor', 'डॉक्टर से बातचीत') + '</h3>' +
      '<div id="rtxcThread" style="display:flex;flex-direction:column;gap:8px;max-height:260px;overflow:auto;background:#F3F5F8;border-radius:12px;padding:10px">' + threadHTML(c.messages) + '</div>' +
      '<form id="rtxcForm" style="display:flex;gap:8px;margin-top:8px"><input id="rtxcMsg" maxlength="2000" autocomplete="off" style="flex:1;min-width:0;border:1.5px solid #DCE3EA;border-radius:10px;padding:10px;font:15px Inter,sans-serif" placeholder="' + esc(T('Write a message…', 'संदेश लिखें…')) + '"><button class="rtx-btn solid" type="submit">' + T('Send', 'भेजें') + '</button></form>' +
      '<p class="rtx-note">' + T('The doctor and the RespiTrust team can read this chat. For emergencies call 108.', 'डॉक्टर और RespiTrust टीम यह चैट पढ़ सकते हैं। इमरजेंसी में 108 पर कॉल करें।') + '</p>' +
      '</div></div>';
    var b = openM(h);
    var th = $('#rtxcThread', b); th.scrollTop = th.scrollHeight;
    $('#rtxcBack', b).addEventListener('click', openList);
    var img = $('#rtxcImg', b); img.addEventListener('click', function () { img.classList.toggle('zoom'); });
    $('#rtxcForm', b).addEventListener('submit', async function (e) {
      e.preventDefault();
      var v = $('#rtxcMsg', b).value.trim(); if (!v) return;
      try { await api('/api/cases/' + id + '/messages', { method: 'POST', body: { body: v } }); $('#rtxcMsg', b).value = ''; await refresh(); } catch (er) { alert(er.message); }
    });
    async function refresh() {
      try {
        var d = await api('/api/cases/' + id);
        var t = $('#rtxcThread'); if (!t) return;
        t.innerHTML = threadHTML(d.messages); t.scrollTop = t.scrollHeight;
        try { localStorage.setItem('rtxc_seen_' + id, String(d.messages.length)); } catch (e) {}
      } catch (er) {}
    }
    pollTimer = setInterval(refresh, 10000);
  }

  
  var pill = null;
  function buildPill() {
    pill = document.createElement('button'); pill.type = 'button'; pill.id = 'rtxcPill';
    pill.style.cssText = 'position:fixed;left:16px;bottom:70px;z-index:9990;display:none;align-items:center;gap:8px;background:#0E7C86;color:#fff;border:0;border-radius:999px;padding:9px 16px;font:700 14px Inter,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.18)';
    pill.addEventListener('click', openList);
    document.body.appendChild(pill);
    paintPill(false);
  }
  function paintPill(dot) {
    pill.innerHTML = '🩺 <span>' + T('My doctor cases', 'मेरे डॉक्टर केस') + '</span>' + (dot ? '<span style="width:10px;height:10px;border-radius:50%;background:#FF5A4D;display:inline-block"></span>' : '');
  }
  async function refreshDot() {
    if (!pill) return;
    if (!token()) { pill.style.display = 'none'; return; }
    pill.style.display = 'flex';
    try {
      var d = await api('/api/cases'), dot = false;
      d.cases.forEach(function (c) {
        var seen = 0; try { seen = parseInt(localStorage.getItem('rtxc_seen_' + c.id) || '0', 10); } catch (e) {}
        if (c.message_count > seen && c.last_sender !== 'user') dot = true;
      });
      paintPill(dot);
    } catch (e) { paintPill(false); }
  }


  function parseHistoryId(src) { var m = /\/image\/(\d+)/.exec(src || ''); return m ? +m[1] : 0; }

  function hookHistoryModal() {
    var ask = $('#rtxHvAsk');
    if (!ask || $('#rtxcSend')) return;
    var img = $('.rtx-hv-img img');
    var id = img ? parseHistoryId(img.src) : 0;
    if (!id) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'rtxcSend'; btn.className = 'rtx-btn'; btn.style.marginLeft = '8px';
    btn.textContent = T('Send to a doctor', 'डॉक्टर को भेजें');
    btn.addEventListener('click', function () { sendDialog(id); });
    ask.parentNode.appendChild(btn);
  }

  function hookAdvice() {
    var card = $('#rtxAdvice');
    if (!card || $('#rtxcAdviceBtn')) return;
    var actions = $('.rtx-actions', card);
    if (!actions) return;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'rtxcAdviceBtn'; btn.className = 'rtx-btn';
    btn.textContent = T('Send this X-ray to a doctor', 'यह X-ray डॉक्टर को भेजें');
    btn.addEventListener('click', async function () {
      if (!token()) return need_login();
      try {
        var d = await api('/api/history');
        if (!d.entries.length) throw new Error(T('This scan was not saved. Please log in and analyse again.', 'यह स्कैन सेव नहीं हुआ। लॉग इन करके दोबारा जांचें।'));
        sendDialog(d.entries[0].id);
      } catch (e) { alert(e.message); }
    });
    actions.appendChild(btn);
  }

  function hookChatNotice() {
    var chat = $('#rtxChat');
    if (!chat || $('#rtxcNotice')) return;
    var form = $('form', chat);
    var n = document.createElement('div');
    n.id = 'rtxcNotice';
    n.style.cssText = 'font:11.5px Inter,sans-serif;color:#64748B;padding:4px 12px;background:#fff';
    n.textContent = T('Chats with this assistant are saved and may be reviewed by the RespiTrust team.', 'इस असिस्टेंट की चैट सेव होती हैं और RespiTrust टीम इन्हें देख सकती है।');
    form.parentNode.insertBefore(n, form);
    // save chatbot messages for the admin
    var msgs = $('#rtxMsgs', chat), seen = msgs.children.length;
    new MutationObserver(function () {
      for (; seen < msgs.children.length; seen++) {
        var m = msgs.children[seen];
        var role = m.classList.contains('me') ? 'user' : 'bot';
        var text = (m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 2000);
        if (!text) continue;
        var h = { 'Content-Type': 'application/json' };
        if (token()) h['Authorization'] = 'Bearer ' + token();
        fetch(API + '/api/chatlog', { method: 'POST', headers: h, body: JSON.stringify({ role: role, text: text, lang: lang() }) }).catch(function () {});
      }
    }).observe(msgs, { childList: true });
  }

  function hookFooter() {
    var f = $('#infoScreen footer.site-footer');
    if (!f || $('#rtxcStaff')) return;
    var d = document.createElement('div');
    d.id = 'rtxcStaff';
    d.style.cssText = 'text-align:center;font-size:13px;padding:8px 0 14px';
    d.innerHTML = '<a href="doctor.html" style="color:inherit;opacity:.8">' + T('Doctor login', 'डॉक्टर लॉग इन') + '</a>';
    f.appendChild(d);
  }

  
  function hookStaffLinks() {
    if (!$('#rtxcStaffCss')) {
      var st = document.createElement('style'); st.id = 'rtxcStaffCss';
      st.textContent = '.nav-links a.rtxc-staff{border:1.5px solid var(--accent,#0E7C86);color:var(--accent,#0E7C86);border-radius:999px;padding:5px 12px}' +
        '.nav-links a.rtxc-staff:hover{background:var(--accent,#0E7C86);color:#fff}' +
        '.rtxc-staffline{margin:16px 0 0;text-align:center;font-size:13.5px;color:#64748B}.rtxc-staffline a{color:var(--accent,#0E7C86);font-weight:700;text-decoration:none;margin:0 4px}';
      document.head.appendChild(st);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.landing-nav .nav-links'), function (nav) {
      if (nav.querySelector('.rtxc-staff')) return;
      [['doctor.html', 'Doctor login', 'डॉक्टर लॉग इन'], ['admin.html', 'Admin login', 'एडमिन लॉग इन']].forEach(function (x) {
        var a = document.createElement('a'); a.href = x[0]; a.className = 'rtxc-staff';
        a.setAttribute('data-en', x[1]); a.setAttribute('data-hi', x[2]); a.textContent = T(x[1], x[2]);
        nav.appendChild(a);
      });
    });
    var card = $('#loginScreen .auth-card');
    if (card && !$('.rtxc-staffline', card)) {
      var d = document.createElement('p'); d.className = 'rtxc-staffline';
      d.innerHTML = '<span data-en="Doctor or admin?" data-hi="डॉक्टर या एडमिन?">' + T('Doctor or admin?', 'डॉक्टर या एडमिन?') + '</span> ' +
        '<a href="doctor.html" data-en="Doctor login" data-hi="डॉक्टर लॉग इन">' + T('Doctor login', 'डॉक्टर लॉग इन') + '</a>·' +
        '<a href="admin.html" data-en="Admin login" data-hi="एडमिन लॉग इन">' + T('Admin login', 'एडमिन लॉग इन') + '</a>';
      card.appendChild(d);
    }
  }
  function relabelStaff() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-en][data-hi]'), function (n) {
      n.textContent = lang() === 'hi' ? n.getAttribute('data-hi') : n.getAttribute('data-en');
    });
  }

  function scan() { hookHistoryModal(); hookAdvice(); hookChatNotice(); hookFooter(); hookStaffLinks(); }

  function init() {
    buildPill();
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    refreshDot();
    setInterval(refreshDot, 30000);
    window.addEventListener('storage', refreshDot);
    // login/logout happen in the same tab: re-check the pill shortly after any click
    document.addEventListener('click', function () { setTimeout(refreshDot, 800); }, true);
    var sw = $('#rtLang'); if (sw) sw.addEventListener('click', function () { setTimeout(function () { paintPill(false); refreshDot(); var f = $('#rtxcStaff'); if (f) { f.remove(); hookFooter(); } relabelStaff(); }, 60); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
