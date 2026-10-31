(function(){
  const API_BASE = window.RESPITRUST_API_BASE
    || (window.location.hostname ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000');
  function fetchWithTimeout(url, options, timeoutMs){
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 12000);
    return fetch(url, Object.assign({}, options, {signal: controller.signal}))
      .finally(() => clearTimeout(timer));
  }

  const TOKEN_KEY = 'respitrust_token';
  const PHONE_KEY = 'respitrust_phone';
 function getToken(){ return localStorage.getItem(TOKEN_KEY); }
  function getPhone(){ return localStorage.getItem(PHONE_KEY); }
  function setSession(token, phone){
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(PHONE_KEY, phone);
  }
  function clearSession(){
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PHONE_KEY);
  }
   const screens = {
    hero: document.getElementById('heroScreen'),
    info: document.getElementById('infoScreen'),
    login: document.getElementById('loginScreen'),
    app: document.getElementById('appScreen'),
    history: document.getElementById('historyScreen'),
  };
  function showScreen(name, anchorId, push){
    if (push === undefined) push = true;
    Object.values(screens).forEach(el => { if (el) el.style.display = 'none'; });
    if (screens[name]) screens[name].style.display = 'block';
    if (anchorId){
      requestAnimationFrame(() => {
        const target = document.getElementById(anchorId);
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    } else {
      window.scrollTo(0, 0);
    }
    if (name === 'app'){
      document.getElementById('navUserPhone').textContent = getPhone() || '';
      requestAnimationFrame(() => document.getElementById('uploadSection').classList.add('visible'));
    }
    if (name === 'history'){
      document.getElementById('historyNavUserPhone').textContent = getPhone() || '';
      loadHistory();
    }
    try{ sessionStorage.setItem('respitrust_screen', name); }catch(e){}
    if (push){
      history.pushState({screen:name, anchor:anchorId || null}, '', '#' + name);
    }
  }
  window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (!state || !state.screen){
      showScreen('hero', null, false);
      return;
    }
    if ((state.screen === 'app' || state.screen === 'history') && !getToken()){
      showScreen('login', null, false);
      return;
    }
    showScreen(state.screen, state.anchor, false);
  });
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target || !screens.info || !screens.info.contains(target)) return;
    e.preventDefault();
    if (screens.info.style.display === 'none'){
      showScreen('info', id);
    } else {
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });

  function requireAuthOrLogin(){
    if (getToken()){
      showScreen('app');
    } else {
      showScreen('login');
    }
  }

  function logout(){
    const token = getToken();
    clearSession();
    showScreen('hero');
    if (token){
      fetch(`${API_BASE}/api/auth/logout`, {
        method:'POST',
        headers:{ 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
  }
  const landingGetStartedBtn = document.getElementById('landingGetStartedBtn');
  const heroLearnMoreBtn = document.getElementById('heroLearnMoreBtn');
  const footerGetStartedBtn = document.getElementById('footerGetStartedBtn');
  const ctaGetStartedBtn = document.getElementById('ctaGetStartedBtn');
  const footerHomeBtn = document.getElementById('footerHomeBtn');
 if (landingGetStartedBtn) landingGetStartedBtn.addEventListener('click', () => showScreen('info', 'about'));
  if (heroLearnMoreBtn) heroLearnMoreBtn.addEventListener('click', () => showScreen('info', 'services'));
  if (footerGetStartedBtn) footerGetStartedBtn.addEventListener('click', requireAuthOrLogin);
  if (ctaGetStartedBtn) ctaGetStartedBtn.addEventListener('click', requireAuthOrLogin);
  if (footerHomeBtn) footerHomeBtn.addEventListener('click', e => { e.preventDefault(); showScreen('hero'); });

  const heroNavAnalyzeBtn = document.getElementById('heroNavAnalyzeBtn');
  const infoNavAnalyzeBtn = document.getElementById('infoNavAnalyzeBtn');
  if (heroNavAnalyzeBtn) heroNavAnalyzeBtn.addEventListener('click', requireAuthOrLogin);
  if (infoNavAnalyzeBtn) infoNavAnalyzeBtn.addEventListener('click', requireAuthOrLogin);


  const heroNavMap = {heroNavAboutBtn:'about', heroNavServicesBtn:'services', heroNavFeaturesBtn:'features'};
  Object.keys(heroNavMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); showScreen('info', heroNavMap[id]); });
  });
  const infoNavHomeBtn = document.getElementById('infoNavHomeBtn');
  if (infoNavHomeBtn) infoNavHomeBtn.addEventListener('click', e => { e.preventDefault(); showScreen('hero'); });
 document.querySelectorAll('#landingAccordion .accordion-head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('#landingAccordion .accordion-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
  const loginPhone = document.getElementById('loginPhone');
  const loginOtp = document.getElementById('loginOtp');
  const loginStepEmail = document.getElementById('loginStepEmail'); 
  const loginStepOtp = document.getElementById('loginStepOtp');    
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const otpPhoneLabel = document.getElementById('otpPhoneLabel');
  const demoOtpNote = document.getElementById('demoOtpNote');
  const authError = document.getElementById('authError');
 function setAuthError(msg){ authError.textContent = msg || ''; }
  function normalizePhone(raw){
    return (raw || '').replace(/\D/g, '');
  }
 if (loginPhone){
    loginPhone.addEventListener('input', () => {
   
      const digits = normalizePhone(loginPhone.value);
      if (loginPhone.value !== digits.slice(0, 10)) loginPhone.value = digits.slice(0, 10);
      if (digits.length > 10){
        setAuthError('Mobile number must be exactly 10 digits.');
      } else {
        setAuthError('');
      }
    });
    loginPhone.addEventListener('keydown', e => {
      if (e.key === 'Enter' && sendOtpBtn) sendOtpBtn.click();
    });
  }

  if (sendOtpBtn){
    sendOtpBtn.addEventListener('click', async () => {
      const phone = normalizePhone(loginPhone.value);
      setAuthError('');
      if (!/^\d{10}$/.test(phone)){
        setAuthError('Enter a valid 10-digit mobile number.');
        return;
      }
      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending…';
      try{
        const res = await fetchWithTimeout(`${API_BASE}/api/auth/request-otp`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({phone})
        }, 12000);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || 'Could not send OTP.');

        otpPhoneLabel.textContent = phone;
        loginStepEmail.style.display = 'none';
        loginStepOtp.style.display = 'block';

        try{ sessionStorage.setItem('respitrust_pending_phone', phone); }catch(e){}
        loginOtp.value = '';   // never auto-fill — the user types the code
        if (data.demo_otp){
          // DEMO MODE: no real SMS is sent, so the code is shown here to be typed in.
          demoOtpNote.innerHTML = `Demo mode — no SMS is actually sent. Your OTP is <strong>${data.demo_otp}</strong>. Type it below.`;
        } else {
          demoOtpNote.textContent = 'OTP sent.';
        }
        loginOtp.focus();
      } catch(err){
        if (err.name === 'AbortError'){
          setAuthError('The RespiTrust backend did not respond in time. Check that the API server is running at ' + API_BASE + ' and try again.');
        } else {
          setAuthError('Could not reach the RespiTrust backend. Make sure the API server is running at ' + API_BASE + '. (' + err.message + ')');
        }
      } finally {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
      }
    });
  }

  if (verifyOtpBtn){
    verifyOtpBtn.addEventListener('click', async () => {
      const phone = normalizePhone(loginPhone.value);
      const code = loginOtp.value.trim();
      setAuthError('');
      if (!code){
        setAuthError('Enter the 6-digit code.');
        return;
      }
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.textContent = 'Verifying…';
      try{
        const res = await fetchWithTimeout(`${API_BASE}/api/auth/verify-otp`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({phone, code})
        }, 12000);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || 'Incorrect or expired OTP.');

        setSession(data.token, data.phone);
        try{ sessionStorage.removeItem('respitrust_pending_phone'); }catch(e){}
        loginStepOtp.style.display = 'none';
        loginStepEmail.style.display = 'block';
        loginPhone.value = '';
        loginOtp.value = '';
        showScreen('app');
      } catch(err){
        if (err.name === 'AbortError'){
          setAuthError('The RespiTrust backend did not respond in time. Check that the API server is running at ' + API_BASE + ' and try again.');
        } else {
          setAuthError(err.message);
        }
      } finally {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify & log in';
      }
    });
  }

  if (resendOtpBtn){
    resendOtpBtn.addEventListener('click', () => {
      try{ sessionStorage.removeItem('respitrust_pending_phone'); }catch(e){}
      setAuthError('');
      loginStepOtp.style.display = 'none';
      loginStepEmail.style.display = 'block';
    });
  }


  ['navHomeBtn','historyNavHomeBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); showScreen('app'); });
  });
  ['navHistoryBtn','historyNavHistoryBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { e.preventDefault(); showScreen('history'); });
  });
  ['logoutBtn','historyLogoutBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', logout);
  });

  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const previewRow = document.getElementById('previewRow');
  const previewImg = document.getElementById('previewImg');
  const fileName = document.getElementById('fileName');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loadingBox = document.getElementById('loadingBox');
  const resultSection = document.getElementById('resultSection');
  const resultCard = document.getElementById('resultCard');
  const predictionLabel = document.getElementById('predictionLabel');
  const confidenceNum = document.getElementById('confidenceNum');
  const historySaveNote = document.getElementById('historySaveNote');

  let currentFile = null;

  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file){
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      currentFile = file;
      previewImg.src = e.target.result;
      fileName.textContent = file.name;
      previewRow.style.display = 'flex';
      resultSection.style.display = 'none';
      loadingBox.style.display = 'none';
      hideUploadError();
    };
    reader.readAsDataURL(file);
  }

  function showUploadError(message){
    const box = document.getElementById('uploadError');
    document.getElementById('uploadErrorText').textContent = message;
    box.style.display = 'flex';
    box.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  function hideUploadError(){
    const box = document.getElementById('uploadError');
    if (box) box.style.display = 'none';
  }

  analyzeBtn.addEventListener('click', () => {
    if (!currentFile) return;
    resultSection.style.display = 'none';
    loadingBox.style.display = 'flex';
    runAnalysis();
  });

  function plainRegion(regionText){
    if (!regionText) return 'in the lungs';
    const text = regionText.toLowerCase();
    if (text.includes('central')) return 'in the middle of the lungs';
    const vertical = text.includes('upper') ? 'upper' : (text.includes('lower') ? 'lower' : '');
    const horizontal = text.includes('left') ? 'left' : (text.includes('right') ? 'right' : '');
    if (vertical && horizontal) return `in the ${vertical} part of the ${horizontal} lung`;
    if (vertical) return `in the ${vertical} part of the lungs`;
    return 'in the lungs';
  }

  function buildPlainExplanation(top, confidence, regionText, lowConfidence){
    const pct = Math.round(confidence * 100);
    const where = plainRegion(regionText);
    let msg = '';

    if (top === 'normal'){
      msg = `Good news — this X-ray looks Normal. The AI is ${pct}% sure it did not find signs of pneumonia in the lungs.`;
    } else if (top === 'bacteria'){
      msg = `This X-ray shows patterns that look like Bacterial pneumonia, mostly ${where}. The AI is ${pct}% sure about this. Bacterial pneumonia is usually treated with antibiotics, so please get this confirmed by a doctor before starting any treatment.`;
    } else if (top === 'virus'){
      msg = `This X-ray shows patterns that look like Viral pneumonia, mostly ${where}. The AI is ${pct}% sure about this. Viral pneumonia is usually managed differently from the bacterial kind, so please have a doctor confirm the result.`;
    } else {
      msg = `The AI finished analyzing this X-ray with ${pct}% confidence.`;
    }

    if (lowConfidence){
      msg += ' The AI is not very confident about this one (below 60%), so it should not be relied on by itself — please have a radiologist take a look.';
    }

    msg += ' The Grad-CAM, saliency and LIME tabs below show, in different ways, exactly which part of the X-ray the AI focused on to reach this result.';
    return msg;
  }

  async function runAnalysis(){
    let data;
    try {
      const formData = new FormData();
      formData.append('file', currentFile);
      const token = getToken();

      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail = errBody.detail;
        if (res.status === 422 && detail && typeof detail === 'object' && detail.code === 'not_chest_xray') {
          loadingBox.style.display = 'none';
          showUploadError(detail.message);
          return;
        }

        const msg = (typeof detail === 'string') ? detail : (detail && detail.message) || `Server returned ${res.status}`;
        const serverErr = new Error(msg);
        serverErr.fromServer = true;
        throw serverErr;
      }
      hideUploadError();
      data = await res.json();
    } catch (err) {
      loadingBox.style.display = 'none';
      if (err.fromServer) {
        showUploadError(err.message);
      } else {
        alert(
          'Could not reach the RespiTrust backend.\n\n' +
          'Make sure the API server is running (uvicorn main:app) at ' + API_BASE + '.\n\n' +
          'Details: ' + err.message
        );
      }
      return;
    }

    loadingBox.style.display = 'none';

    const top = data.prediction_key;                 
    const probs = data.probabilities;                 
    const labels = {bacteria:'Bacterial pneumonia', normal:'Normal', virus:'Viral pneumonia'};

    resultCard.className = 'result-card ' + top;
    predictionLabel.textContent = labels[top];
    confidenceNum.textContent = Math.round(data.confidence*100) + '%';

    historySaveNote.textContent = data.saved_to_history
      ? 'Saved to your test history.'
      : 'Log in to save this result to your history.';

    document.getElementById('plainExplanation').textContent =
      buildPlainExplanation(top, data.confidence, data.region_text, data.low_confidence_warning);

    const icons = {
      normal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
      bacteria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
      virus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>'
    };
    document.getElementById('resultIcon').innerHTML = icons[top];

    document.getElementById('pctBacteria').textContent = Math.round(probs.bacteria*100)+'%';
    document.getElementById('pctNormal').textContent = Math.round(probs.normal*100)+'%';
    document.getElementById('pctVirus').textContent = Math.round(probs.virus*100)+'%';

    requestAnimationFrame(() => {
      document.getElementById('barBacteria').style.width = (probs.bacteria*100)+'%';
      document.getElementById('barNormal').style.width = (probs.normal*100)+'%';
      document.getElementById('barVirus').style.width = (probs.virus*100)+'%';
    });

    document.getElementById('regionText').textContent =
      (top === 'normal' && !data.low_confidence_warning)
        ? 'No focal abnormality detected — attention was spread evenly across both lungs.'
        : data.region_text + (data.low_confidence_warning ? ' (Low confidence — recommend manual review by a radiologist.)' : '');

    drawImageOnCanvas('canvas-gradcam', data.explainability.gradcam);
    drawImageOnCanvas('canvas-saliency', data.explainability.saliency);
    if (data.explainability.lime) {
      drawImageOnCanvas('canvas-lime', data.explainability.lime);
    } else {
      const ctx = document.getElementById('canvas-lime').getContext('2d');
      ctx.clearRect(0, 0, 400, 400);
    }

    resultSection.classList.remove('visible');
    resultSection.style.display = 'block';
    requestAnimationFrame(() => {
      resultSection.classList.add('visible');
    });
    resultSection.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function drawImageOnCanvas(canvasId, dataUrl){
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.xai-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
  const trendBanner = document.getElementById('trendBanner');
  const trendHeadline = document.getElementById('trendHeadline');
  const trendDetail = document.getElementById('trendDetail');
  const historyList = document.getElementById('historyList');
  const historyEmpty = document.getElementById('historyEmpty');

  const LABELS = {bacteria:'Bacterial pneumonia', normal:'Normal', virus:'Viral pneumonia'};

  async function loadHistory(){
    const token = getToken();
    if (!token){ showScreen('login'); return; }

    trendHeadline.textContent = 'Loading…';
    trendDetail.textContent = '';
    trendBanner.className = 'trend-banner';
    historyList.querySelectorAll('.history-card').forEach(el => el.remove());
    historyEmpty.style.display = 'none';

    try {
      const res = await fetch(`${API_BASE}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401){ logout(); return; }
      if (!res.ok) throw new Error('Server returned ' + res.status);
      const data = await res.json();

      trendHeadline.textContent = data.trend.headline;
      trendDetail.textContent = data.trend.detail;
      trendBanner.className = 'trend-banner ' + data.trend.trend;  
       if (!data.entries.length){
        historyEmpty.style.display = 'block';
        return;
      }
       data.entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'history-card';
        const date = new Date(entry.created_at * 1000).toLocaleString();
        card.innerHTML = `
          <img src="${API_BASE}${entry.image_url}?token=${encodeURIComponent(token)}" alt="X-ray thumbnail">
          <div class="history-card-main">
            <div class="history-card-top">
              <span class="history-badge ${entry.prediction_key}">${LABELS[entry.prediction_key]}</span>
              <span class="history-card-date">${date}</span>
            </div>
            <p class="history-card-region">${entry.region_text || ''}</p>
          </div>
          <div class="history-card-conf">${Math.round(entry.confidence*100)}%</div>
        `;
        historyList.appendChild(card);
      });
    } catch(err){
      trendHeadline.textContent = 'Could not load history';
      trendDetail.textContent = 'Could not reach the RespiTrust backend at ' + API_BASE + '. (' + err.message + ')';
    }
  }
 let startScreen = 'hero';
  try{ startScreen = sessionStorage.getItem('respitrust_screen') || 'hero'; }catch(e){}
  if ((startScreen === 'app' || startScreen === 'history') && !getToken()) startScreen = 'login';
  if (getToken() && startScreen === 'login') startScreen = 'app';
  if (!screens[startScreen]) startScreen = 'hero';
  history.replaceState({screen:startScreen, anchor:null}, '', '#' + startScreen);
  showScreen(startScreen, null, false);
  if (startScreen === 'login'){
    let pending = null;
    try{ pending = sessionStorage.getItem('respitrust_pending_phone'); }catch(e){}
    if (pending){
      otpPhoneLabel.textContent = pending;
      loginStepEmail.style.display = 'none';
      loginStepOtp.style.display = 'block';
      demoOtpNote.textContent = 'Page was refreshed — if you can\'t see your code, tap "Change number / resend code".';
    }
  }
})();