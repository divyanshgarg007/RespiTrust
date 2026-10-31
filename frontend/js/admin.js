
(function () {
  'use strict';
  var R = window.RTP, $ = R.$, esc = R.esc;
  R.init('admin');
  var tab = 'overview';

  function show(login) {
    $('#loginView').classList.toggle('hidden', !login);
    $('#appView').classList.toggle('hidden', login);
  }
  window.RTP_onLogout = function () { show(true); };

  $('#loginForm').addEventListener('submit', async function (e) {
    e.preventDefault(); $('#loginErr').textContent = '';
    try { await R.login($('#em').value, $('#pw').value); $('#pw').value = ''; start(); }
    catch (err) { $('#loginErr').textContent = err.message; }
  });
  $('#logoutBtn').addEventListener('click', function () { R.logout(); });
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.tab'); if (!b) return;
    tab = b.getAttribute('data-t');
    document.querySelectorAll('#tabs .tab').forEach(function (t) { t.classList.toggle('on', t === b); });
    render();
  });

  async function start() {
    try { var me = await R.api('/api/staff/me'); $('#who').textContent = me.name + ' · ' + me.email; } catch (e) { return; }
    show(false); render();
  }
  function view(h) { $('#view').innerHTML = h; }
  function fail(e) { view('<div class="panel err">' + esc(e.message) + '</div>'); }
  function ph(p) { return esc(p || 'not logged in'); }

  async function render() {
    try {
      if (tab === 'overview') return await overview();
      if (tab === 'conv') return await conversations();
      if (tab === 'cases') return await cases();
      if (tab === 'users') return await users();
      if (tab === 'doctors') return await doctors();
      if (tab === 'chat') return await chatlogs();
      if (tab === 'audit') return await audit();
      if (tab === 'account') return account();
    } catch (e) { fail(e); }
  }

  async function overview() {
    var o = await R.api('/api/admin/overview');
    var S = [['Users', o.users], ['Scans (total)', o.scans], ['Scans (24 h)', o.scans_24h], ['Active doctors', o.doctors],
      ['Cases waiting', o.cases_open], ['Cases in review', o.cases_in_review], ['Cases reviewed', o.cases_reviewed],
      ['Patient / doctor messages', o.messages], ['Chatbot messages', o.chat_logs],
      ['Doctor agrees with AI', o.verdict_agree], ['Doctor disagrees', o.verdict_disagree], ['Needs more info', o.verdict_need_more]];
    var tot = o.verdict_agree + o.verdict_disagree;
    view('<div class="panel"><h2>Overview</h2><div class="stats">' + S.map(function (s) {
      return '<div class="stat"><b>' + s[1] + '</b><span>' + esc(s[0]) + '</span></div>'; }).join('') + '</div>' +
      '<p style="margin:14px 0 0;font-size:14px">' + (tot ? 'Doctor agreement with the AI so far: <b>' + Math.round(100 * o.verdict_agree / tot) + '%</b> of ' + tot + ' reviewed cases (agree vs disagree). This is a small, real-world check, not a clinical trial.' : 'No doctor reviews yet.') + '</p></div>');
  }

  async function conversations() {
    var d = await R.api('/api/admin/messages?limit=300');
    view('<div class="panel"><h2>Latest patient and doctor conversation</h2>' +
      (d.messages.length ? '<table class="tbl"><thead><tr><th>Time</th><th>Case</th><th>Patient</th><th>From</th><th>Message</th></tr></thead><tbody>' +
        d.messages.map(function (m) {
          return '<tr class="click" data-c="' + m.case_id + '"><td>' + esc(R.fmt(m.created_at)) + '</td><td>#' + m.case_id + '</td><td>' + ph(m.phone) + '</td><td>' + esc(m.sender_label) + '</td><td>' + esc(m.body) + '</td></tr>'; }).join('') +
        '</tbody></table>' : '<div class="empty">No conversations yet.</div>') + '</div>');
    document.querySelectorAll('#view tr.click').forEach(function (r) { r.addEventListener('click', function () { caseDetail(+r.getAttribute('data-c')); }); });
  }

  async function cases() {
    var d = await R.api('/api/admin/cases');
    view('<div class="panel"><h2>All cases</h2>' + (d.cases.length ? '<table class="tbl"><thead><tr><th>#</th><th>Patient</th><th>AI result</th><th>Status</th><th>Doctor</th><th>Messages</th><th>Created</th></tr></thead><tbody>' +
      d.cases.map(function (c) { var s = c.scan || {};
        return '<tr class="click" data-c="' + c.id + '"><td>#' + c.id + '</td><td>' + ph(c.phone) + '</td><td><span class="pill ' + esc(s.prediction_key) + '">' + esc(R.LABEL[s.prediction_key] || '') + '</span> ' + Math.round((s.confidence || 0) * 100) + '%</td><td><span class="pill ' + esc(c.status) + '">' + esc(R.STATUS[c.status]) + '</span></td><td>' + esc(c.doctor_name || '-') + '</td><td>' + c.message_count + '</td><td>' + esc(R.fmt(c.created_at)) + '</td></tr>'; }).join('') +
      '</tbody></table>' : '<div class="empty">No cases yet.</div>') + '</div>');
    document.querySelectorAll('#view tr.click').forEach(function (r) { r.addEventListener('click', function () { caseDetail(+r.getAttribute('data-c')); }); });
  }

  async function caseDetail(id) {
    var c = await R.api('/api/admin/cases/' + id), s = c.scan || {};
    var sel = s;
    var h = '<div class="panel"><button class="btn small" id="back" type="button">&larr; Back</button><h2 style="margin-top:10px">Case #' + c.id + ' <span class="pill ' + esc(c.status) + '">' + esc(R.STATUS[c.status]) + '</span></h2>' +
      '<div class="cols"><div><div class="xray"><img id="xr" alt="X-ray" src="' + esc(R.imgUrl('/api/admin/cases/' + c.id + '/image', '&history_id=' + s.history_id)) + '"></div>' +
      (c.previous_scans.length > 1 ? '<h3>All scans of this patient</h3><div class="thumbs">' + c.previous_scans.map(function (p) {
        return '<button type="button" data-h="' + p.history_id + '"><img alt="" src="' + esc(R.imgUrl('/api/admin/cases/' + c.id + '/image', '&history_id=' + p.history_id)) + '"><small>' + esc((R.LABEL[p.prediction_key] || '').split(' ')[0]) + '</small></button>'; }).join('') + '</div>' : '') +
      (c.previous_scans.length > 1 ? '<h3>All previous X-rays - full details</h3><table class="tbl"><thead><tr><th>Date</th><th>AI result</th><th>Confidence</th><th>Region noted</th><th></th></tr></thead><tbody>' + c.previous_scans.map(function (p) {
        return '<tr><td>' + esc(R.fmt(p.created_at)) + '</td><td><span class="pill ' + esc(p.prediction_key) + '">' + esc(R.LABEL[p.prediction_key] || '') + '</span></td><td>' + Math.round((p.confidence || 0) * 100) + '%</td><td>' + esc(p.region_text || '-') + '</td><td><button type="button" class="btn small" data-h="' + p.history_id + '">View</button></td></tr>'; }).join('') + '</tbody></table>' : '') +
      '</div><div><div class="kv"><b>Patient phone</b><span>' + ph(c.phone) + '</span><b>AI prediction</b><span><span class="pill ' + esc(s.prediction_key) + '">' + esc(R.LABEL[s.prediction_key]) + '</span> ' + Math.round((s.confidence || 0) * 100) + '%</span>' +
      '<b>Region</b><span>' + esc(s.region_text || '-') + '</span><b>Doctor</b><span>' + esc(c.doctor_name || 'not taken yet') + '</span><b>Created</b><span>' + esc(R.fmt(c.created_at)) + '</span></div>' +
      '<h3>Conversation</h3><div class="thread">' + (c.messages.length ? c.messages.map(function (m) {
        return '<div class="msg ' + esc(m.sender_role) + '"><small>' + esc(m.sender_label) + ' · ' + esc(R.fmt(m.created_at)) + '</small>' + esc(m.body) + '</div>'; }).join('') : '<div class="empty">No messages.</div>') + '</div>' +
      (c.verdict ? '<h3>Doctor review</h3><div class="verdict ' + esc(c.verdict) + '"><b>' + esc(R.VERDICT[c.verdict]) + '</b><div style="margin-top:4px;white-space:pre-wrap">' + esc(c.remarks) + '</div></div>' : '') +
      '</div></div></div>';
    view(h);
    $('#back').addEventListener('click', render);
    var xr = $('#xr'); xr.addEventListener('click', function () { xr.classList.toggle('zoom'); });
    document.querySelectorAll('.thumbs button, .tbl button[data-h]').forEach(function (b) {
      b.addEventListener('click', function () { xr.src = R.imgUrl('/api/admin/cases/' + c.id + '/image', '&history_id=' + b.getAttribute('data-h')); xr.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    });
  }

  async function users() {
    var d = await R.api('/api/admin/users');
    view('<div class="panel"><h2>Users (phone OTP login)</h2>' + (d.users.length ? '<table class="tbl"><thead><tr><th>Phone</th><th>Scans</th><th>Last scan</th><th>Doctor cases</th><th>Chatbot messages</th></tr></thead><tbody>' +
      d.users.map(function (u) { return '<tr><td>' + ph(u.phone) + '</td><td>' + u.scans + '</td><td>' + esc(R.fmt(u.last_scan)) + '</td><td>' + u.cases + '</td><td>' + u.chat_msgs + '</td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">No users yet.</div>') + '</div>');
  }

  async function doctors() {
    var d = await R.api('/api/admin/doctors');
    view('<div class="panel"><h2>Add a doctor</h2><div class="row">' +
      '<div><label class="f">Full name</label><input class="in" id="dn" placeholder="Dr. Name"></div>' +
      '<div><label class="f">Email (login)</label><input class="in" id="de" type="email"></div>' +
      '<div><label class="f">Temporary password (min 8)</label><input class="in" id="dp" type="text" autocomplete="off"></div>' +
      '<div><label class="f">Registration no.</label><input class="in" id="dr"></div>' +
      '<div><label class="f">Speciality</label><input class="in" id="ds"></div></div>' +
      '<div class="err" id="dErr"></div><button class="btn solid" id="addDoc" type="button">Create doctor account</button></div>' +
      '<div class="panel" style="margin-top:14px"><h2>Doctors</h2>' + (d.doctors.length ? '<table class="tbl"><thead><tr><th>Name</th><th>Email</th><th>Reg. no.</th><th>Speciality</th><th>Last login</th><th>Status</th><th></th></tr></thead><tbody>' +
      d.doctors.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td>' + esc(x.email) + '</td><td>' + esc(x.reg_no || '') + '</td><td>' + esc(x.speciality || '') + '</td><td>' + esc(R.fmt(x.last_login)) + '</td><td>' + (x.active ? '<span class="ok">Active</span>' : '<span class="err">Disabled</span>') + '</td><td style="white-space:nowrap">' +
        '<button class="btn small" data-act="tog" data-id="' + x.id + '" data-on="' + x.active + '" type="button">' + (x.active ? 'Disable' : 'Enable') + '</button> <button class="btn small" data-act="pw" data-id="' + x.id + '" type="button">Reset password</button></td></tr>'; }).join('') + '</tbody></table>' : '<div class="empty">No doctors yet. Create one above.</div>') + '</div>');
    $('#addDoc').addEventListener('click', async function () {
      $('#dErr').textContent = '';
      try { await R.api('/api/admin/doctors', { method: 'POST', body: { name: $('#dn').value, email: $('#de').value, password: $('#dp').value, reg_no: $('#dr').value, speciality: $('#ds').value } });
        R.toast('Doctor created'); doctors(); } catch (e) { $('#dErr').textContent = e.message; }
    });
    document.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var id = b.getAttribute('data-id');
        try {
          if (b.getAttribute('data-act') === 'tog') { await R.api('/api/admin/doctors/' + id + '/active', { method: 'POST', body: { active: b.getAttribute('data-on') !== '1' } }); doctors(); }
          else { var p = prompt('New password for this doctor (min 8 characters):'); if (!p) return; await R.api('/api/admin/doctors/' + id + '/password', { method: 'POST', body: { password: p } }); R.toast('Password reset'); }
        } catch (e) { R.toast(e.message); }
      });
    });
  }

  async function chatlogs() {
    var d = await R.api('/api/admin/chatlogs?limit=500');
    view('<div class="panel"><h2>What users asked the assistant</h2>' + (d.logs.length ? d.logs.map(function (l) {
      return '<div class="chatrow ' + esc(l.role) + '"><span class="r">' + (l.role === 'user' ? 'User' : 'Bot') + '</span><span style="flex:1">' + esc(l.text) + '<br><small style="color:#64748B">' + ph(l.phone) + ' · ' + esc(R.fmt(l.created_at)) + '</small></span></div>'; }).join('') : '<div class="empty">No chatbot messages yet.</div>') + '</div>');
  }

  async function audit() {
    var d = await R.api('/api/admin/audit?limit=300');
    view('<div class="panel"><h2>Staff activity</h2><table class="tbl"><thead><tr><th>Time</th><th>Who</th><th>Action</th><th>Detail</th></tr></thead><tbody>' + d.audit.map(function (a) {
      return '<tr><td>' + esc(R.fmt(a.created_at)) + '</td><td>' + esc(a.actor) + '</td><td>' + esc(a.action) + '</td><td>' + esc(a.detail) + '</td></tr>'; }).join('') + '</tbody></table></div>');
  }

  function account() {
    view('<div class="panel" style="max-width:420px"><h2>Change my password</h2><label class="f">Old password</label><input class="in" id="op" type="password" autocomplete="current-password">' +
      '<label class="f">New password (min 8)</label><input class="in" id="np" type="password" autocomplete="new-password"><div class="err" id="aErr"></div><button class="btn solid" id="chg" type="button">Change password</button></div>');
    $('#chg').addEventListener('click', async function () {
      try { await R.api('/api/staff/change-password', { method: 'POST', body: { old_password: $('#op').value, new_password: $('#np').value } }); $('#aErr').textContent = ''; R.toast('Password changed'); $('#op').value = ''; $('#np').value = ''; }
      catch (e) { $('#aErr').textContent = e.message; }
    });
  }

  if (R.hasToken()) start(); else show(true);
})();
