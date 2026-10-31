
(function () {
  'use strict';
  var R = window.RTP, $ = R.$, esc = R.esc;
  R.init('doctor');
  var filter = 'open', curId = null, curScan = null, me = null, poll = null;

  function show(login) {
    $('#loginView').classList.toggle('hidden', !login);
    $('#appView').classList.toggle('hidden', login);
  }
  window.RTP_onLogout = function () { clearInterval(poll); curId = null; show(true); };

  $('#loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    $('#loginErr').textContent = '';
    try {
      me = await R.login($('#em').value, $('#pw').value);
      $('#pw').value = '';
      start();
    } catch (err) { $('#loginErr').textContent = err.message; }
  });
  $('#logoutBtn').addEventListener('click', function () { R.logout(); });
  $('#refreshBtn').addEventListener('click', function () { loadList(); if (curId) openCase(curId, true); });
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    filter = b.getAttribute('data-f');
    document.querySelectorAll('#tabs .tab').forEach(function (t) { t.classList.toggle('on', t === b); });
    loadList();
  });

  async function start() {
    try { me = await R.api('/api/staff/me'); } catch (e) { return; }
    $('#who').textContent = me.name + (me.reg_no ? ' · Reg. ' + me.reg_no : '');
    show(false);
    loadList();
    clearInterval(poll);
    poll = setInterval(function () { loadList(true); if (curId) refreshThread(); }, 12000);
  }

  async function loadList(quiet) {
    try {
      var d = await R.api('/api/doctor/cases?filter=' + filter);
      var box = $('#list');
      if (!d.cases.length) { box.innerHTML = '<div class="empty">No cases here.</div>'; return; }
      box.innerHTML = d.cases.map(function (c) {
        var s = c.scan || {};
        var waiting = c.last_sender === 'user' && c.status === 'in_review';
        return '<div class="item' + (c.id === curId ? ' sel' : '') + '" data-id="' + c.id + '">' +
          '<div class="t"><span>Case #' + c.id + '</span><span class="pill ' + esc(c.status) + '">' + esc(R.STATUS[c.status] || c.status) + '</span></div>' +
          '<div class="s"><span class="pill ' + esc(s.prediction_key) + '">' + esc(R.LABEL[s.prediction_key] || '') + '</span> ' +
          Math.round((s.confidence || 0) * 100) + '% · ' + esc(R.fmt(c.created_at)) + '</div>' +
          (waiting ? '<div class="s" style="color:#B3261E;font-weight:700">Patient wrote a new message</div>' : '') +
          '</div>';
      }).join('');
      box.querySelectorAll('.item').forEach(function (n) {
        n.addEventListener('click', function () { curScan = null; openCase(+n.getAttribute('data-id')); });
      });
    } catch (e) { if (!quiet) R.toast(e.message); }
  }

  function threadHTML(msgs) {
    if (!msgs.length) return '<div class="empty">No messages yet.</div>';
    return msgs.map(function (m) {
      return '<div class="msg ' + esc(m.sender_role) + '"><small>' + esc(m.sender_label) + ' · ' + esc(R.fmt(m.created_at)) + '</small>' + esc(m.body) + '</div>';
    }).join('');
  }

  async function refreshThread() {
    try {
      var d = await R.api('/api/doctor/cases/' + curId);
      var th = $('#thread'); if (!th) return;
      var atBottom = th.scrollTop + th.clientHeight >= th.scrollHeight - 30;
      th.innerHTML = threadHTML(d.messages);
      if (atBottom) th.scrollTop = th.scrollHeight;
    } catch (e) {}
  }

  async function openCase(id, keepScan) {
    curId = id;
    document.querySelectorAll('#list .item').forEach(function (n) { n.classList.toggle('sel', +n.getAttribute('data-id') === id); });
    var c;
    try { c = await R.api('/api/doctor/cases/' + id); } catch (e) { R.toast(e.message); return; }
    var s = c.scan || {};
    var hid = keepScan && curScan ? curScan : s.history_id;
    curScan = hid;
    var sel = (c.previous_scans || []).filter(function (p) { return p.history_id === hid; })[0] || s;
    var mine = c.status !== 'open';
    var h = '<h2>Case #' + c.id + ' <span class="pill ' + esc(c.status) + '">' + esc(R.STATUS[c.status]) + '</span></h2>' +
      '<div class="cols"><div>' +
      '<div class="xray"><img id="xr" alt="X-ray" src="' + esc(R.imgUrl('/api/doctor/cases/' + c.id + '/image', '&history_id=' + hid)) + '"></div>' +
      '<p style="font-size:12.5px;color:#64748B;margin:6px 0 0">Click the image to zoom.</p>';
    if (c.previous_scans && c.previous_scans.length > 1) {
      h += '<h3>Patient\'s earlier scans</h3><div class="thumbs">' + c.previous_scans.map(function (p) {
        return '<button type="button" data-h="' + p.history_id + '" class="' + (p.history_id === hid ? 'sel' : '') + '">' +
          '<img src="' + esc(R.imgUrl('/api/doctor/cases/' + c.id + '/image', '&history_id=' + p.history_id)) + '" alt="">' +
          '<small>' + esc((R.LABEL[p.prediction_key] || '').split(' ')[0]) + '</small></button>';
      }).join('') + '</div>';
      h += '<h3>All previous X-rays - full details</h3><table class="tbl"><thead><tr><th>Date</th><th>AI result</th><th>Confidence</th><th>Region noted</th><th></th></tr></thead><tbody>' + c.previous_scans.map(function (p) {
        return '<tr' + (p.history_id === hid ? ' style="background:#F0FAFB"' : '') + '><td>' + esc(R.fmt(p.created_at)) + '</td><td><span class="pill ' + esc(p.prediction_key) + '">' + esc(R.LABEL[p.prediction_key] || '') + '</span></td><td>' + Math.round((p.confidence || 0) * 100) + '%</td><td>' + esc(p.region_text || '-') + '</td><td><button type="button" class="btn small" data-h="' + p.history_id + '">View</button></td></tr>';
      }).join('') + '</tbody></table>';
    }
    h += '</div><div>' +
      '<h3 style="margin-top:0">AI result for this scan</h3>' +
      '<div class="kv"><b>Patient</b><span>' + esc(c.patient) + '</span>' +
      '<b>AI prediction</b><span><span class="pill ' + esc(sel.prediction_key) + '">' + esc(R.LABEL[sel.prediction_key]) + '</span></span>' +
      '<b>AI confidence</b><span>' + Math.round((sel.confidence || 0) * 100) + '%</span>' +
      '<b>Region noted</b><span>' + esc(sel.region_text || '-') + '</span>' +
      '<b>Scan date</b><span>' + esc(R.fmt(sel.created_at)) + '</span>' +
      '<b>Sent to doctor</b><span>' + esc(R.fmt(c.created_at)) + '</span></div>' +
      (c.user_note ? '<h3>Patient\'s note</h3><div class="note">' + esc(c.user_note) + '</div>' : '');
    if (!mine) {
      h += '<div class="review"><b>This case is waiting.</b><p style="margin:6px 0 8px;font-size:14px">Take the case to chat with the patient, see earlier scans and submit your review.</p>' +
        '<button class="btn solid" id="claim" type="button">Take this case</button></div>';
    } else {
      h += '<h3>Conversation</h3><div class="thread" id="thread">' + threadHTML(c.messages) + '</div>';
      if (c.status !== 'reviewed') {
        h += '<div class="composer"><input class="in" id="msgIn" maxlength="2000" placeholder="Write to the patient…"><button class="btn solid" id="send" type="button">Send</button></div>' +
          '<div class="review"><b>Your review</b>' +
          '<label class="f" for="verdict">Do you agree with the AI?</label>' +
          '<select class="in" id="verdict"><option value="agree">Agree with the AI result</option><option value="disagree">Disagree with the AI result</option><option value="need_more">More tests / information needed</option></select>' +
          '<label class="f" for="remarks">Remarks and advice for the patient</label><textarea class="in" id="remarks" maxlength="3000" placeholder="Your clinical remarks, advice and follow-up…"></textarea>' +
          '<div class="err" id="revErr"></div><button class="btn solid" id="submitRev" type="button">Submit review</button></div>';
      } else {
        h += '<div class="verdict ' + esc(c.verdict) + '"><b>' + esc(R.VERDICT[c.verdict] || '') + '</b><div style="margin-top:4px;white-space:pre-wrap">' + esc(c.remarks) + '</div><small style="color:#64748B">' + esc(R.fmt(c.reviewed_at)) + '</small></div>';
      }
    }
    h += '<p class="note" style="margin-top:12px;font-size:12.5px;background:#FFF7E6">RespiTrust is an AI screening aid. The final diagnosis and treatment remain the doctor\'s decision.</p></div></div>';
    $('#detail').innerHTML = h;

    var xr = $('#xr'); if (xr) xr.addEventListener('click', function () { xr.classList.toggle('zoom'); });
    document.querySelectorAll('.thumbs button, .tbl button[data-h]').forEach(function (b) {
      b.addEventListener('click', function () { curScan = +b.getAttribute('data-h'); openCase(id, true); });
    });
    var th = $('#thread'); if (th) th.scrollTop = th.scrollHeight;
    var cl = $('#claim');
    if (cl) cl.addEventListener('click', async function () {
      try { await R.api('/api/doctor/cases/' + id + '/claim', { method: 'POST' }); R.toast('Case taken'); filter = 'mine';
        document.querySelectorAll('#tabs .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-f') === 'mine'); });
        await loadList(); openCase(id); } catch (e) { R.toast(e.message); }
    });
    var send = $('#send');
    async function doSend() {
      var v = $('#msgIn').value.trim(); if (!v) return;
      try { await R.api('/api/doctor/cases/' + id + '/messages', { method: 'POST', body: { body: v } }); $('#msgIn').value = ''; await refreshThread(); var t = $('#thread'); t.scrollTop = t.scrollHeight; }
      catch (e) { R.toast(e.message); }
    }
    if (send) { send.addEventListener('click', doSend); $('#msgIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSend(); }); }
    var sr = $('#submitRev');
    if (sr) sr.addEventListener('click', async function () {
      var remarks = $('#remarks').value.trim();
      if (!remarks) { $('#revErr').textContent = 'Please write your remarks.'; return; }
      try { await R.api('/api/doctor/cases/' + id + '/review', { method: 'POST', body: { verdict: $('#verdict').value, remarks: remarks } });
        R.toast('Review submitted'); await loadList(); openCase(id); } catch (e) { $('#revErr').textContent = e.message; }
    });
  }

  if (R.hasToken()) start(); else show(true);
})();
