
(function () {
  var base = window.RESPITRUST_API_BASE ||
    (window.location.hostname ? window.location.protocol + '//' + window.location.hostname + ':8000' : 'http://localhost:8000');
  var url = base + '/api/client-log';
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!origFetch) return;

  function send(event, detail) {
    try {
      origFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: String(event), detail: String(detail || '') }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  send('page_open', location.href + ' | ' + navigator.userAgent.slice(0, 60));

  window.addEventListener('error', function (e) {
    send('JS_ERROR', (e.message || '') + ' @ ' + (e.filename || '').split('/').pop() + ':' + (e.lineno || ''));
  });
  window.addEventListener('unhandledrejection', function (e) {
    send('JS_PROMISE_ERR', e.reason && e.reason.message ? e.reason.message : e.reason);
  });


  window.fetch = function (input, init) {
    var u = typeof input === 'string' ? input : (input && input.url) || '';
    if (u.indexOf('/api/client-log') !== -1) return origFetch(input, init);
    var t0 = Date.now();
    var short = u.replace(/^https?:\/\/[^/]+/, '');
    return origFetch(input, init).then(function (res) {
      if (!res.ok) send('API_FAIL', short + ' -> HTTP ' + res.status);
      else if (Date.now() - t0 > 5000) send('API_SLOW', short + ' took ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
      return res;
    }, function (err) {
      send('API_NETWORK_ERR', short + ' -> ' + (err && err.message));
      throw err;
    });
  };

  // Clicks on buttons / links / tabs
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('button, a, .tab, [role="tab"], label');
    if (!el) return;
    var text = (el.innerText || el.getAttribute('aria-label') || el.id || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    send('click', (el.id ? '#' + el.id + ' ' : '') + '"' + text + '"');
  }, true);

 
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.type === 'file' && t.files && t.files[0]) {
      send('file_selected', t.files[0].name + ' (' + Math.round(t.files[0].size / 1024) + ' KB, ' + t.files[0].type + ')');
    }
  }, true);
})();
