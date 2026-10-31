
(function () {
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var synth = window.speechSynthesis;
  var DEV = /[ऀ-ॿ]/;
  var KEY = 'respitrust_voice_replies';

  function lang() {
    try { if (window.RespiTrustI18n) return window.RespiTrustI18n.lang; } catch (e) {}
    try { return localStorage.getItem('respitrust_lang') || 'en'; } catch (e) { return 'en'; }
  }
  function T(en, hi) { return lang() === 'hi' ? hi : en; }
  function $(s, r) { return (r || document).querySelector(s); }

  var speakAll = false;
  try { speakAll = localStorage.getItem(KEY) === '1'; } catch (e) {}

  var rec = null, listening = false, speakNext = false, conversation = false;
  var voices = [];
  function loadVoices() { if (synth) voices = synth.getVoices() || []; }
  if (synth) { loadVoices(); if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); }

  
  var css = document.createElement('style');
  css.textContent =
    '#rtxMic{border:0;background:#fff;color:#0E7C86;border:1.5px solid #0E7C86;border-radius:10px;width:44px;cursor:pointer;display:grid;place-items:center;flex:none}' +
    '#rtxMic svg{width:22px;height:22px}' +
    '#rtxMic.on{background:#B3261E;border-color:#B3261E;color:#fff;animation:rtxPulse 1.1s infinite}' +
    '@keyframes rtxPulse{0%{box-shadow:0 0 0 0 rgba(179,38,30,.5)}100%{box-shadow:0 0 0 12px rgba(179,38,30,0)}}' +
    '#rtxVoiceBar{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#F3F5F8;border-top:1px solid #DCE3EA;font:600 12.5px Inter,sans-serif;color:#334155}' +
    '#rtxVoiceBar .st{flex:1;min-width:0}' +
    '#rtxVoiceBar button{border:1.5px solid #0E7C86;background:#fff;color:#0E7C86;border-radius:999px;padding:3px 10px;font:700 12px Inter,sans-serif;cursor:pointer}' +
    '#rtxVoiceBar button.on{background:#0E7C86;color:#fff}';
  document.head.appendChild(css);

  
  function pickVoice(l) {
    var want = l === 'hi' ? 'hi' : 'en-in';
    var v = voices.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf(want) === 0; })[0];
    if (!v && l !== 'hi') v = voices.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf('en') === 0; })[0];
    return v || null;
  }
  function cleanText(node) {
    var c = node.cloneNode(true);
    var warns = Array.prototype.slice.call(c.querySelectorAll('.rtx-warn'));
    var keep = '';
    warns.forEach(function (w) { if (/108/.test(w.textContent)) keep = ' ' + w.textContent; w.parentNode.removeChild(w); });
    Array.prototype.forEach.call(c.querySelectorAll('li'), function (li) { li.textContent = li.textContent + '.'; });
    var tmp = document.createElement('div'); tmp.innerHTML = c.innerHTML.replace(/<[^>]+>/g, ' ');
    var t = (tmp.textContent || '') + keep;
    return t.replace(/\s+/g, ' ').replace(/[\u{1F300}-\u{1FAFF}]/gu, '').trim();
  }
  function say(text, onend) {
    if (!synth || !text) { if (onend) onend(); return; }
    synth.cancel();
    var l = DEV.test(text) ? 'hi' : 'en';
    
    var parts = text.match(/[^.।!?]+[.।!?]*/g) || [text];
    var chunks = [], cur = '';
    parts.forEach(function (p) { if ((cur + p).length > 180) { if (cur) chunks.push(cur); cur = p; } else cur += p; });
    if (cur) chunks.push(cur);
    var i = 0;
    function next() {
      if (i >= chunks.length) { setStatus(); if (onend) onend(); return; }
      var u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = l === 'hi' ? 'hi-IN' : 'en-IN';
      var v = pickVoice(l); if (v) u.voice = v;
      u.rate = 0.95;
      u.onend = next; u.onerror = function () { setStatus(); if (onend) onend(); };
      synth.speak(u);
    }
    setStatus(T('Speaking…', 'बोल रहा हूं…'));
    next();
  }
  function stopSpeaking() { if (synth) synth.cancel(); }

  function setStatus(s) {
    var st = $('#rtxVoiceBar .st'); if (!st) return;
    st.textContent = s || (SR ? T('Tap the mic and ask in Hindi or English', 'माइक दबाकर हिंदी या English में पूछें') : T('Voice input needs Chrome or Edge', 'वॉइस इनपुट के लिए Chrome या Edge चाहिए'));
  }
  function stopListening() {
    conversation = false;
    if (rec) { try { rec.abort(); } catch (e) {} }
    listening = false;
    var m = $('#rtxMic'); if (m) m.classList.remove('on');
  }
  function startListening() {
    if (!SR) { setStatus(T('Voice input is not supported in this browser. Please use Chrome or Edge.', 'इस ब्राउज़र में वॉइस इनपुट नहीं चलता। कृपया Chrome या Edge इस्तेमाल करें।')); return; }
    stopSpeaking();
    if (listening) { stopListening(); setStatus(); return; }
    rec = new SR();
    rec.lang = lang() === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    var finalText = '';
    rec.onstart = function () {
      listening = true; $('#rtxMic').classList.add('on');
      setStatus(T('Listening… speak now', 'सुन रहा हूं… बोलिए'));
    };
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += tr; else interim += tr;
      }
      var inp = $('#rtxInput'); if (inp) inp.value = (finalText + ' ' + interim).trim();
    };
    rec.onerror = function (e) {
      listening = false; $('#rtxMic').classList.remove('on');
      var msg = e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? T('Microphone is blocked. Allow the mic in the browser address bar and try again.', 'माइक बंद है। ब्राउज़र के एड्रेस बार में माइक की अनुमति दें और फिर कोशिश करें।')
        : e.error === 'no-speech' ? T('I did not hear anything. Tap the mic and try again.', 'कुछ सुनाई नहीं दिया। माइक दबाकर फिर बोलिए।')
        : e.error === 'network' ? T('Voice needs internet in Chrome. Please check your connection.', 'Chrome में वॉइस के लिए इंटरनेट चाहिए। कनेक्शन जांचें।')
        : T('Voice error: ', 'वॉइस में दिक्कत: ') + e.error;
      conversation = false;
      setStatus(msg);
    };
    rec.onend = function () {
      var wasListening = listening;
      listening = false; var m = $('#rtxMic'); if (m) m.classList.remove('on');
      var inp = $('#rtxInput');
      var q = inp ? inp.value.trim() : '';
      if (wasListening && q) {
        speakNext = true;
        $('#rtxChat form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      } else if (wasListening) {
        setStatus(T('I did not catch that. Tap the mic and try again.', 'समझ नहीं आया। माइक दबाकर फिर बोलिए।'));
      }
    };
    try { rec.start(); } catch (e) { setStatus(String(e)); }
  }

  
  function attach() {
    var chat = $('#rtxChat');
    if (!chat || $('#rtxMic', chat)) return;
    var form = $('form', chat);
    var send = $('#rtxSend', chat);
    var mic = document.createElement('button');
    mic.type = 'button'; mic.id = 'rtxMic';
    mic.setAttribute('aria-label', 'Speak');
    mic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>';
    form.insertBefore(mic, send);
    mic.addEventListener('click', startListening);

    var bar = document.createElement('div');
    bar.id = 'rtxVoiceBar';
    bar.innerHTML = '<span class="st"></span><button type="button" id="rtxSpk"></button><button type="button" id="rtxStop"></button>';
    chat.insertBefore(bar, form);
    function labels() {
      var s = $('#rtxSpk', bar), st = $('#rtxStop', bar);
      s.textContent = (speakAll ? '🔊 ' : '🔇 ') + T('Read replies', 'जवाब बोलें');
      s.classList.toggle('on', speakAll);
      st.textContent = '⏹ ' + T('Stop', 'रोकें');
      if (!listening && !(synth && synth.speaking)) setStatus();
    }
    $('#rtxSpk', bar).addEventListener('click', function () {
      speakAll = !speakAll;
      try { localStorage.setItem(KEY, speakAll ? '1' : '0'); } catch (e) {}
      if (!speakAll) stopSpeaking();
      labels();
    });
    $('#rtxStop', bar).addEventListener('click', function () { stopSpeaking(); stopListening(); setStatus(); });
    labels();
    // keep labels in the right language when the user switches EN/हिं
    chat.addEventListener('click', function (e) { if (e.target.closest('.rtx-lang button')) setTimeout(labels, 80); });
    var sw = $('#rtLang'); if (sw) sw.addEventListener('click', function () { setTimeout(labels, 80); });

 
    var msgs = $('#rtxMsgs', chat);
    var seen = msgs.children.length;
    new MutationObserver(function () {
      for (; seen < msgs.children.length; seen++) {
        var n = msgs.children[seen];
        if (n.classList.contains('bot') && (speakNext || speakAll)) {
          var text = cleanText(n);
          speakNext = false;
          say(text);
        }
      }
    }).observe(msgs, { childList: true });

    
    var close = $('.rtx-close', chat);
    if (close) close.addEventListener('click', function () { stopSpeaking(); stopListening(); });
  }

  function init() {
    attach();
    
    new MutationObserver(function () { attach(); }).observe(document.body, { childList: true });
  }
  window.addEventListener('beforeunload', stopSpeaking);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
