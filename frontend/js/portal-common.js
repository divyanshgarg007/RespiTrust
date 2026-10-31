
window.RTP = (function () {
  'use strict';
  var API = window.RESPITRUST_API_BASE ||
    (location.protocol + '//' + (location.hostname || 'localhost') + ':8000');
  var portal = 'doctor', KEY = 'rtp_doctor_token', token = '';

  function init(p) {
    portal = p; KEY = 'rtp_' + p + '_token';
    try { token = sessionStorage.getItem(KEY) || ''; } catch (e) { token = ''; }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(s, r) { return (r || document).querySelector(s); }
  function fmt(t) { return t ? new Date(t * 1000).toLocaleString() : ''; }
  var LABEL = { bacteria: 'Bacterial pneumonia', normal: 'Normal', virus: 'Viral pneumonia' };
  var STATUS = { open: 'Waiting', in_review: 'In review', reviewed: 'Reviewed' };
  var VERDICT = { agree: 'Doctor agrees with the AI', disagree: 'Doctor disagrees with the AI', need_more: 'More tests / information needed' };

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
  }
  async function api(path, opt) {
    opt = opt || {};
    var headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (opt.body) headers['Content-Type'] = 'application/json';
    var res;
    try {
      res = await fetch(API + path, { method: opt.method || 'GET', headers: headers, body: opt.body ? JSON.stringify(opt.body) : undefined });
    } catch (e) {
      throw new Error('Cannot reach the server at ' + API + '. Is the backend running?');
    }
    var data = {};
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401 && token && path.indexOf('/login') < 0) { logout(true); throw new Error('Session expired. Please log in again.'); }
    if (!res.ok) {
      var d = data.detail;
      throw new Error(typeof d === 'string' ? d : (Array.isArray(d) ? 'Please check the form fields.' : 'Error ' + res.status));
    }
    return data;
  }
  function imgUrl(path, extra) {
    return API + path + (path.indexOf('?') < 0 ? '?' : '&') + 'token=' + encodeURIComponent(token) + (extra || '');
  }
  async function login(email, password) {
    var d = await api('/api/staff/login', { method: 'POST', body: { email: email, password: password, portal: portal } });
    token = d.token;
    try { sessionStorage.setItem(KEY, token); } catch (e) {}
    return d;
  }
  function logout(silent) {
    var t = token;
    if (t && !silent) { fetch(API + '/api/staff/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + t } }).catch(function () {}); }
    token = '';
    try { sessionStorage.removeItem(KEY); } catch (e) {}
    if (window.RTP_onLogout) window.RTP_onLogout();
  }
  return { init: init, api: api, esc: esc, $: $, fmt: fmt, toast: toast, login: login, logout: logout,
    imgUrl: imgUrl, LABEL: LABEL, STATUS: STATUS, VERDICT: VERDICT, hasToken: function () { return !!token; } };
})();
