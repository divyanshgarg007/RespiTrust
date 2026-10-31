
(function () {
  'use strict';


  var CERT = {
    accuracy: 85,
    dataset: '1000+',
    date: '12/9/2026',
    name: 'Dr. Ashish Jaiswal',
    title: 'Senior Physician',
    quals: 'MBBS, MD (Gold Medalist), FCCP, FCCS (U.S.A.), MERS (Europe)',
    speciality: 'Diabetes, BP & Chest Specialist',
    reg: 'MP-8006',
    clinic: 'Shashi Wellness Centre',
    hospital: 'Kashvi Multi Speciality Hospital',
    address: 'Plot No. 85, Iteda, Opp. Cherry County, Ek Murti Gol Chakkar, Greater Noida West',
    image: 'assets/doctor-certificate.jpg'
  };

  function lang() {
    try { if (window.RespiTrustI18n) return window.RespiTrustI18n.lang; } catch (e) {}
    try { return localStorage.getItem('respitrust_lang') || 'en'; } catch (e) { return 'en'; }
  }
  function T(en, hi) { return lang() === 'hi' ? hi : en; }
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  var SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>';

 
  var LABEL = {
    bacteria: { en: 'Bacterial pneumonia', hi: 'बैक्टीरियल निमोनिया' },
    virus:    { en: 'Viral pneumonia',     hi: 'वायरल निमोनिया' },
    normal:   { en: 'Normal',              hi: 'सामान्य (नॉर्मल)' }
  };
  function lbl(k) { return LABEL[k] ? LABEL[k][lang()] : k; }

  var RED_EN = ['Difficulty breathing, or breathing very fast', 'Blue or grey lips / fingertips', 'Confusion or extreme drowsiness',
    'Chest pain that keeps getting worse', 'Oxygen level (pulse oximeter) below 94%', 'Fever for more than 3 days, or you cannot drink fluids'];
  var RED_HI = ['सांस लेने में तकलीफ़ या बहुत तेज़ सांस', 'होंठ या उंगलियां नीली / भूरी पड़ना', 'भ्रम (कन्फ्यूज़न) या बहुत ज़्यादा नींद',
    'सीने का दर्द जो बढ़ता जाए', 'पल्स ऑक्सीमीटर पर ऑक्सीजन 94% से कम', '3 दिन से ज़्यादा बुखार, या पानी भी न पी पाना'];

  var ADVICE = {
    bacteria: {
      sum: {
        en: 'The scan pattern looks like bacterial pneumonia. This usually needs a doctor-prescribed antibiotic course, so please see a doctor soon (ideally within 24 hours).',
        hi: 'स्कैन का पैटर्न बैक्टीरियल निमोनिया जैसा है। इसमें आमतौर पर डॉक्टर की लिखी एंटीबायोटिक चलती है, इसलिए जल्दी (हो सके तो 24 घंटे में) डॉक्टर को दिखाएं।'
      },
      steps: {
        en: ['Meet a physician or chest specialist soon and show this report and the X-ray.', 'Doctor may advise tests: blood tests (CBC, CRP), sputum test, oxygen level check, sometimes a CT scan.',
          'Take the full antibiotic course exactly as prescribed, even if you feel better after 2 to 3 days.', 'Rest, drink plenty of warm fluids, eat light food, avoid smoke and dust.',
          'A follow-up chest X-ray after about 6 to 8 weeks is often advised to confirm the lungs have cleared.'],
        hi: ['जल्दी किसी फिज़िशियन या चेस्ट स्पेशलिस्ट से मिलें और यह रिपोर्ट व X-ray दिखाएं।', 'डॉक्टर कुछ जांचें बता सकते हैं: ब्लड टेस्ट (CBC, CRP), बलगम की जांच, ऑक्सीजन लेवल, कभी-कभी CT स्कैन।',
          'डॉक्टर ने जितने दिन की एंटीबायोटिक लिखी है, पूरा कोर्स लें, चाहे 2-3 दिन में आराम लगने लगे।', 'आराम करें, खूब गुनगुना पानी/तरल लें, हल्का खाना खाएं, धुएं और धूल से बचें।',
          'फेफड़े साफ़ हुए या नहीं, यह देखने के लिए करीब 6-8 हफ़्ते बाद दोबारा चेस्ट X-ray अक्सर बताया जाता है।']
      },
      med: {
        en: 'Doctors commonly prescribe antibiotics for bacterial pneumonia (for example amoxicillin, amoxicillin-clavulanate, azithromycin or doxycycline; severe cases get injections in hospital). The choice, dose and number of days are decided by the doctor, so do not start or buy antibiotics on your own. Paracetamol is commonly used for fever and body ache, as per the label or your doctor.',
        hi: 'बैक्टीरियल निमोनिया में डॉक्टर आमतौर पर एंटीबायोटिक देते हैं (जैसे amoxicillin, amoxicillin-clavulanate, azithromycin या doxycycline; गंभीर केस में अस्पताल में इंजेक्शन)। कौन सी दवा, कितनी मात्रा और कितने दिन, यह डॉक्टर तय करता है, इसलिए खुद से एंटीबायोटिक न लें। बुखार/बदन दर्द में पैरासिटामोल आम तौर पर दी जाती है, पर्चे या लेबल के हिसाब से।'
      }
    },
    virus: {
      sum: {
        en: 'The scan pattern looks like viral pneumonia. Antibiotics do not work on viruses, so treatment is mostly supportive. Still, a doctor should confirm and watch for complications.',
        hi: 'स्कैन का पैटर्न वायरल निमोनिया जैसा है। वायरस पर एंटीबायोटिक काम नहीं करती, इसलिए इलाज ज़्यादातर सहायक (आराम, तरल, लक्षणों की दवा) होता है। फिर भी डॉक्टर से पुष्टि कराएं।'
      },
      steps: {
        en: ['See a doctor to confirm, especially if you are a child, elderly, pregnant, diabetic or have asthma / heart / lung disease.', 'Rest well and drink plenty of fluids (water, ORS, soups).',
          'Monitor fever and breathing. If an oximeter is available, check oxygen level a few times a day.', 'Doctor may check for flu or other viral infection and decide if any antiviral is needed.',
          'If it does not improve in 2 to 3 days, or gets worse, go back to the doctor: a bacterial infection can follow a viral one.'],
        hi: ['पुष्टि के लिए डॉक्टर को दिखाएं, खासकर अगर मरीज़ बच्चा, बुज़ुर्ग, गर्भवती, डायबिटीज़ या अस्थमा/दिल/फेफड़ों का रोगी हो।', 'पूरा आराम करें और खूब तरल लें (पानी, ORS, सूप)।',
          'बुखार और सांस पर नज़र रखें। ऑक्सीमीटर हो तो दिन में कुछ बार ऑक्सीजन देखें।', 'डॉक्टर फ्लू या दूसरे वायरस की जांच करके तय करेंगे कि कोई एंटीवायरल दवा चाहिए या नहीं।',
          '2-3 दिन में आराम न मिले या हालत बिगड़े तो दोबारा डॉक्टर के पास जाएं, क्योंकि वायरल के बाद बैक्टीरियल इन्फ़ेक्शन भी हो सकता है।']
      },
      med: {
        en: 'Antibiotics are usually not needed for viral pneumonia and taking them without need can cause harm. Doctors treat the symptoms: paracetamol for fever and pain (as per label / doctor), fluids, rest, and sometimes an antiviral such as oseltamivir only if influenza is confirmed. Avoid giving cough syrups to young children unless a doctor says so.',
        hi: 'वायरल निमोनिया में आमतौर पर एंटीबायोटिक की ज़रूरत नहीं होती और बिना ज़रूरत लेना नुक़सान कर सकता है। डॉक्टर लक्षणों का इलाज करते हैं: बुखार/दर्द में पैरासिटामोल (लेबल या डॉक्टर के अनुसार), तरल, आराम, और फ्लू पक्का होने पर ही कभी-कभी oseltamivir जैसी एंटीवायरल। छोटे बच्चों को डॉक्टर के कहे बिना खांसी का सिरप न दें।'
      }
    },
    normal: {
      sum: {
        en: 'No pneumonia pattern was found on this X-ray. That is reassuring, but an AI screen cannot rule out every problem, so if you still have symptoms please see a doctor.',
        hi: 'इस X-ray में निमोनिया का पैटर्न नहीं मिला। यह अच्छी बात है, लेकिन AI स्क्रीनिंग हर बीमारी को नकार नहीं सकती, इसलिए लक्षण बने रहें तो डॉक्टर को दिखाएं।'
      },
      steps: {
        en: ['If cough, fever or breathlessness continues for more than 1 to 2 weeks, consult a doctor even with a normal X-ray.', 'Other causes (asthma, allergy, acid reflux, TB, heart problems) may need other tests.',
          'Stay healthy: do not smoke, avoid dust and smoke, wash hands, keep up with flu and pneumococcal vaccines (ask your doctor).', 'Keep this result in your history to compare later if symptoms return.'],
        hi: ['खांसी, बुखार या सांस फूलना 1-2 हफ़्ते से ज़्यादा रहे तो X-ray नॉर्मल होने पर भी डॉक्टर से मिलें।', 'दूसरे कारण (अस्थमा, एलर्जी, एसिड रिफ्लक्स, TB, दिल की दिक्कत) में अलग जांच लग सकती है।',
          'स्वस्थ रहें: धूम्रपान न करें, धूल-धुएं से बचें, हाथ धोएं, फ्लू और न्यूमोकोकल वैक्सीन के बारे में डॉक्टर से पूछें।', 'लक्षण लौटें तो तुलना के लिए यह रिज़ल्ट हिस्ट्री में रखें।']
      },
      med: {
        en: 'No medicine is needed for a normal X-ray on its own. If you have symptoms, a doctor will choose treatment for the actual cause. Please avoid taking antibiotics or steroids without a prescription.',
        hi: 'सिर्फ़ नॉर्मल X-ray के लिए किसी दवा की ज़रूरत नहीं। लक्षण हों तो डॉक्टर असली कारण के हिसाब से इलाज तय करेंगे। बिना पर्चे के एंटीबायोटिक या स्टेरॉयड न लें।'
      }
    }
  };
  function disclaimer() {
    return T('This is general information, not a prescription. The final diagnosis and medicines must come from a qualified doctor.',
      'यह सामान्य जानकारी है, पर्चा नहीं। अंतिम निदान और दवाएं योग्य डॉक्टर ही तय करें।');
  }
  function list(arr) { return '<ul>' + arr.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
  function red() { return list(lang() === 'hi' ? RED_HI : RED_EN); }

  
  var modalOpen = null;
  function openModal(inner, extraClass, onClose) {
    closeModal();
    var m = el('div', 'rtx-modal');
    var s = el('div', 'rtx-sheet ' + (extraClass || ''));
    var x = el('button', 'rtx-x', '&times;');
    x.type = 'button'; x.setAttribute('aria-label', 'Close');
    s.appendChild(x);
    var body = el('div', '', inner);
    s.appendChild(body);
    m.appendChild(s);
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    x.addEventListener('click', closeModal);
    document.body.appendChild(m);
    modalOpen = { node: m, onClose: onClose, body: body };
    return modalOpen;
  }
  function closeModal() {
    if (modalOpen) {
      if (modalOpen.node.parentNode) modalOpen.node.parentNode.removeChild(modalOpen.node);
      if (modalOpen.onClose) modalOpen.onClose();
      modalOpen = null;
    }
  }

  function certSummary() {
    return T('Clinically reviewed by ' + CERT.name + ' (' + CERT.title + '). Certified overall diagnostic accuracy of ' + CERT.accuracy + '% on ' + CERT.dataset + ' verified chest X-rays.',
      CERT.name + ' (सीनियर फिज़िशियन) द्वारा क्लिनिकली समीक्षित। ' + CERT.dataset + ' सत्यापित चेस्ट X-ray पर कुल डायग्नोस्टिक सटीकता ' + CERT.accuracy + '% प्रमाणित।');
  }
  function certCardHTML(withBtn) {
    return '<div class="rtx-seal">' + SHIELD + '</div>' +
      '<div class="rtx-cert-main"><h3>' + T('Doctor certified', 'डॉक्टर द्वारा प्रमाणित') + '</h3><p>' + certSummary() + '</p></div>' +
      '<div class="rtx-cert-acc"><b>' + CERT.accuracy + '%</b><span>' + T('certified accuracy', 'प्रमाणित सटीकता') + '</span></div>' +
      (withBtn ? '<button type="button" class="rtx-btn rtx-open-cert">' + T('View certificate', 'प्रमाणपत्र देखें') + '</button>' : '');
  }
  function openCert() {
    var h = '<h2>' + T('Doctor certification', 'डॉक्टर प्रमाणन') + '</h2>' +
      '<p style="margin:0;color:#157F4B;font-weight:700">' + SHIELD.replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px"') + ' ' +
      T('Clinical performance certified: ' + CERT.accuracy + '% overall diagnostic accuracy', 'क्लिनिकल प्रदर्शन प्रमाणित: कुल डायग्नोस्टिक सटीकता ' + CERT.accuracy + '%') + '</p>' +
      '<div class="rtx-doc">' +
      '<div><b>' + CERT.name + '</b>, ' + CERT.title + '</div>' +
      '<div><b>' + T('Qualifications', 'योग्यता') + ':</b> ' + CERT.quals + '</div>' +
      '<div><b>' + T('Speciality', 'विशेषज्ञता') + ':</b> ' + CERT.speciality + '</div>' +
      '<div><b>' + T('Registration no.', 'पंजीकरण नं.') + ':</b> ' + CERT.reg + '</div>' +
      '<div><b>' + T('Practice', 'प्रैक्टिस') + ':</b> ' + CERT.clinic + ' &middot; ' + CERT.hospital + '</div>' +
      '<div><b>' + T('Address', 'पता') + ':</b> ' + CERT.address + '</div>' +
      '<div><b>' + T('Certificate date', 'प्रमाणपत्र की तारीख') + ':</b> ' + CERT.date + '</div>' +
      '</div>' +
      '<p style="margin:0 0 6px;font-size:14.5px">' + T(
        'The certificate states that RespiTrust underwent clinical validation and performance assessment for chest radiography interpretation. Based on evaluation and model training using a dataset exceeding ' + CERT.dataset + ' verified chest X-rays, the system demonstrates an overall diagnostic accuracy of ' + CERT.accuracy + '%.',
        'प्रमाणपत्र के अनुसार RespiTrust की चेस्ट रेडियोग्राफ़ी की व्याख्या के लिए क्लिनिकल वैलिडेशन और प्रदर्शन जांच हुई है। ' + CERT.dataset + ' से ज़्यादा सत्यापित चेस्ट X-ray के डेटासेट पर मूल्यांकन और मॉडल प्रशिक्षण के आधार पर सिस्टम की कुल डायग्नोस्टिक सटीकता ' + CERT.accuracy + '% है।') + '</p>' +
      '<img class="rtx-certimg" src="' + CERT.image + '" alt="Signed doctor certificate">' +
      '<p class="rtx-note">' + T('Tap the certificate to zoom. RespiTrust is a screening aid and does not replace a doctor. Always confirm results with a qualified physician.',
        'ज़ूम करने के लिए प्रमाणपत्र पर टैप करें। RespiTrust एक स्क्रीनिंग सहायक है, डॉक्टर का विकल्प नहीं। नतीजे हमेशा योग्य डॉक्टर से पक्के कराएं।') + '</p>';
    var m = openModal(h);
    var img = $('.rtx-certimg', m.body);
    img.addEventListener('click', function () {
      var big = img.classList.toggle('big');
      img.style.maxWidth = big ? 'none' : '100%';
      img.style.width = big ? '180%' : '100%';
    });
  }

  function buildBadge() {
    var b = $('#rtxBadge');
    if (!b) { b = el('button', ''); b.id = 'rtxBadge'; b.type = 'button'; document.body.appendChild(b); b.addEventListener('click', openCert); }
    b.innerHTML = SHIELD + '<span>' + T('Doctor Certified · ' + CERT.accuracy + '%', 'डॉक्टर प्रमाणित · ' + CERT.accuracy + '%') + '</span>';
  }

  function buildCertSlots() {
    // hero chip
    var row = $('#heroScreen .hero-trust-row');
    if (row && !$('#rtxHeroChip')) {
      var c = el('span', 'hero-chip chip-teal rtx-chip-cert');
      c.id = 'rtxHeroChip';
      c.addEventListener('click', openCert);
      row.appendChild(c);
    }
    var hc = $('#rtxHeroChip');
    if (hc) hc.innerHTML = SHIELD.replace('<svg', '<svg style="width:16px;height:16px"') + ' ' + T('Doctor certified · ' + CERT.accuracy + '% accuracy', 'डॉक्टर प्रमाणित · ' + CERT.accuracy + '% सटीकता');

    // card before the footer on the about page
    var footer = $('#infoScreen footer.site-footer');
    if (footer && !$('#rtxCertInfo')) {
      var holder = el('div', 'container'); holder.id = 'rtxCertInfo';
      holder.appendChild(el('div', 'rtx-cert'));
      footer.parentNode.insertBefore(holder, footer);
    }
    // strip in the result section (after the "saved" note)
    var note = $('#historySaveNote');
    if (note && !$('#rtxCertResult')) {
      var r = el('div', 'rtx-cert'); r.id = 'rtxCertResult';
      note.parentNode.insertBefore(r, note.nextSibling);
    }
    ['#rtxCertInfo .rtx-cert', '#rtxCertResult'].forEach(function (sel) {
      var n = $(sel);
      if (n) { n.innerHTML = certCardHTML(true); var b = $('.rtx-open-cert', n); if (b) b.addEventListener('click', openCert); }
    });
  }


  function resultKey() {
    var rc = $('#resultCard');
    if (!rc) return null;
    var m = rc.className.match(/\b(bacteria|virus|normal)\b/);
    return m ? m[1] : null;
  }
  function renderAdvice() {
    var key = resultKey();
    var sec = $('#resultSection');
    if (!key || !sec) return;
    var a = ADVICE[key], L = lang();
    var card = $('#rtxAdvice');
    if (!card) { card = el('div', 'card rtx-advice'); card.id = 'rtxAdvice'; sec.appendChild(card); }
    card.className = 'card rtx-advice ' + key;
    card.innerHTML =
      '<h2>' + T('What to do next', 'आगे क्या करें') + '</h2>' +
      '<p style="margin:4px 0 0;font-weight:600">' + lbl(key) + '</p>' +
      '<p style="margin:6px 0 0">' + a.sum[L] + '</p>' +
      '<h3>' + T('Suggested next steps', 'सुझाए गए अगले कदम') + '</h3>' + list(a.steps[L]) +
      '<h3>' + T('About medicines (general information)', 'दवाओं के बारे में (सामान्य जानकारी)') + '</h3><p style="margin:0;font-size:14.5px">' + a.med[L] + '</p>' +
      '<div class="rtx-red"><h3>' + T('Go to a doctor or emergency right away if', 'तुरंत डॉक्टर / इमरजेंसी जाएं अगर') + '</h3>' + red() + '</div>' +
      '<p class="rtx-note">' + disclaimer() + '</p>' +
      '<div class="rtx-actions"><button type="button" class="rtx-btn solid" id="rtxAskBot">' + T('Ask the assistant about this result', 'इस रिज़ल्ट के बारे में असिस्टेंट से पूछें') + '</button></div>';
    $('#rtxAskBot', card).addEventListener('click', function () {
      openChat(); botAsk(T('What does my result mean and what should I do?', 'मेरे रिज़ल्ट का क्या मतलब है और मुझे क्या करना चाहिए?'));
    });
  }

  
  var KB = [
    { id: 'emergency', k: ['emergency', 'urgent', 'ambulance', 'breathless', 'cant breathe', "can't breathe", 'blue lips', 'chest pain', 'danger', 'serious', 'इमरजेंसी', 'सांस नहीं', 'साँस नहीं', 'सांस फूल', 'तकलीफ', 'खतरा', 'खतरनाक', 'सीने में दर्द', 'saans', 'emergency kab'],
      en: function () { return '<b>Please do not wait. Go to a doctor or emergency right away if you have:</b>' + red() + '<div class="rtx-warn">In India you can call <b>108</b> for an ambulance.</div>'; },
      hi: function () { return '<b>इंतज़ार न करें। इन लक्षणों में तुरंत डॉक्टर / इमरजेंसी जाएं:</b>' + red() + '<div class="rtx-warn">भारत में एम्बुलेंस के लिए <b>108</b> पर कॉल करें।</div>'; } },

    { id: 'result', k: ['my result', 'result mean', 'what does my', 'report', 'prediction', 'confidence', 'मेरा रिज़ल्ट', 'रिजल्ट', 'रिपोर्ट', 'नतीजा', 'मतलब', 'result', 'kya aaya', 'kitna percent'],
      en: function () { return resultAnswer('en'); }, hi: function () { return resultAnswer('hi'); } },

    { id: 'medicine', k: ['medicine', 'medication', 'tablet', 'drug', 'antibiotic', 'syrup', 'dawa', 'dawai', 'दवा', 'दवाई', 'गोली', 'एंटीबायोटिक', 'सिरप', 'paracetamol', 'which medicine', 'konsi'],
      en: function () { return medAnswer('en'); }, hi: function () { return medAnswer('hi'); } },

    { id: 'next', k: ['next', 'treatment', 'cure', 'what should i do', 'what to do', 'ilaj', 'ilaaj', 'इलाज', 'आगे', 'क्या करूं', 'क्या करें', 'उपचार', 'aage kya', 'follow up', 'doctor ko', 'test'],
      en: function () { return nextAnswer('en'); }, hi: function () { return nextAnswer('hi'); } },

    { id: 'home', k: ['home care', 'home remedy', 'rest', 'diet', 'food', 'eat', 'drink', 'ghar', 'gharelu', 'घरेलू', 'आराम', 'खाना', 'परहेज', 'डाइट', 'steam', 'bhaap'],
      en: function () { return '<b>Home care while you recover (along with the doctor\'s treatment):</b>' + list(['Rest and sleep enough.', 'Drink plenty of warm fluids, water, ORS or soup.', 'Eat light, fresh food such as khichdi, dal, fruit.', 'Sleep with your head and chest slightly raised if coughing at night.', 'Stay away from smoke, dust and cold air. Do not smoke.', 'Cover your mouth when you cough and wash hands often.']) + '<div class="rtx-warn">' + disclaimer() + '</div>'; },
      hi: function () { return '<b>ठीक होने के दौरान घर पर देखभाल (डॉक्टर के इलाज के साथ):</b>' + list(['पूरा आराम और नींद लें।', 'खूब गुनगुना पानी, ORS या सूप लें।', 'हल्का ताज़ा खाना खाएं, जैसे खिचड़ी, दाल, फल।', 'रात को खांसी हो तो सिर और सीना थोड़ा ऊंचा रखकर सोएं।', 'धुएं, धूल और ठंडी हवा से बचें। धूम्रपान न करें।', 'खांसते समय मुंह ढकें और हाथ बार-बार धोएं।']) + '<div class="rtx-warn">' + disclaimer() + '</div>'; } },

    { id: 'what', k: ['what is pneumonia', 'pneumonia', 'nimonia', 'निमोनिया', 'न्यूमोनिया', 'symptom', 'लक्षण', 'क्या है', 'kya hota'],
      en: function () { return '<b>Pneumonia</b> is an infection of the lungs. The tiny air sacs fill with fluid or pus, which causes cough, fever, chills, chest pain, tiredness and breathlessness. It can be caused by bacteria, viruses or (rarely) fungi. It is more dangerous in children, the elderly and people with other illnesses.'; },
      hi: function () { return '<b>निमोनिया</b> फेफड़ों का इन्फ़ेक्शन है। फेफड़ों की छोटी हवा की थैलियों में पानी या मवाद भर जाता है, जिससे खांसी, बुखार, कंपकंपी, सीने में दर्द, थकान और सांस फूलना होता है। यह बैक्टीरिया, वायरस या (कम) फंगस से हो सकता है। बच्चों, बुज़ुर्गों और दूसरी बीमारी वालों में ज़्यादा ख़तरनाक है।'; } },

    { id: 'bv', k: ['bacterial', 'viral', 'difference', 'bacteria', 'virus', 'फर्क', 'अंतर', 'बैक्टीरिया', 'वायरल', 'वायरस', 'farak', 'kya antar'],
      en: function () { return '<b>Bacterial vs viral pneumonia</b>' + list(['<b>Bacterial:</b> often starts suddenly with high fever and a cough with phlegm. Usually treated with antibiotics prescribed by a doctor. On X-ray it often shows one dense patch (lobar).', '<b>Viral:</b> often follows a cold or flu, with milder, gradual symptoms. Antibiotics do not work, treatment is rest, fluids and symptom relief. On X-ray it often shows patchy changes in both lungs.']) + 'RespiTrust separates these two and also says Normal.'; },
      hi: function () { return '<b>बैक्टीरियल बनाम वायरल निमोनिया</b>' + list(['<b>बैक्टीरियल:</b> अक्सर अचानक तेज़ बुखार और बलगम वाली खांसी से शुरू होता है। आमतौर पर डॉक्टर की लिखी एंटीबायोटिक से इलाज। X-ray में अक्सर एक घना धब्बा दिखता है।', '<b>वायरल:</b> अक्सर सर्दी-ज़ुकाम/फ्लू के बाद, हल्के और धीरे बढ़ते लक्षण। एंटीबायोटिक काम नहीं करती, इलाज आराम, तरल और लक्षणों की राहत। X-ray में अक्सर दोनों फेफड़ों में बिखरे बदलाव दिखते हैं।']) + 'RespiTrust इन दोनों को अलग करता है और नॉर्मल भी बताता है।'; } },

    { id: 'cert', k: ['certif', 'accuracy', 'accurate', 'trust', 'reliable', 'doctor approved', 'verified', 'सटीक', 'प्रमाण', 'भरोसा', 'सर्टिफ', 'कितना सही', 'kitna sahi', 'sahi hai'],
      en: function () { return '<b>Doctor certified.</b> ' + certSummary() + '<br>Tap the green <b>Doctor Certified</b> badge (bottom-left) to see the certificate and the doctor\'s details.<div class="rtx-warn">Accuracy is never 100%. Always confirm with a doctor.</div>'; },
      hi: function () { return '<b>डॉक्टर प्रमाणित।</b> ' + certSummary() + '<br>प्रमाणपत्र और डॉक्टर का विवरण देखने के लिए नीचे-बाएं हरे <b>डॉक्टर प्रमाणित</b> बैज पर टैप करें।<div class="rtx-warn">सटीकता कभी 100% नहीं होती। हमेशा डॉक्टर से पुष्टि कराएं।</div>'; } },

    { id: 'doctor', k: ['who is the doctor', 'which doctor', 'doctor name', 'dr ', 'ashish', 'jaiswal', 'डॉक्टर कौन', 'डॉक्टर का नाम', 'डॉ', 'आशीष', 'जायसवाल', 'hospital', 'अस्पताल', 'kashvi'],
      en: function () { return '<b>' + CERT.name + '</b>, ' + CERT.title + '<br>' + CERT.quals + '<br>' + CERT.speciality + '<br>Reg. no. ' + CERT.reg + '<br>' + CERT.clinic + ' &middot; ' + CERT.hospital + ', ' + CERT.address + '.'; },
      hi: function () { return '<b>' + CERT.name + '</b>, सीनियर फिज़िशियन<br>' + CERT.quals + '<br>डायबिटीज़, BP और चेस्ट स्पेशलिस्ट<br>पंजीकरण नं. ' + CERT.reg + '<br>' + CERT.clinic + ' &middot; ' + CERT.hospital + ', ' + CERT.address + '।'; } },

    { id: 'xai', k: ['grad-cam', 'gradcam', 'heatmap', 'saliency', 'lime', 'explain', 'highlight', 'colour', 'color', 'हीटमैप', 'हाइलाइट', 'समझाओ', 'रंग', 'लाल'],
      en: function () { return '<b>Explainability</b> shows where the AI looked:' + list(['<b>Grad-CAM:</b> warm (red/yellow) areas of the lungs influenced the decision most.', '<b>Saliency:</b> bright dots are pixels the model was most sensitive to.', '<b>LIME:</b> yellow outlines mark image regions that supported the predicted class.']) + 'Doctors can compare these with what they see on the film.'; },
      hi: function () { return '<b>एक्सप्लेनेबिलिटी</b> दिखाती है कि AI ने कहां देखा:' + list(['<b>Grad-CAM:</b> फेफड़ों के गर्म रंग (लाल/पीले) हिस्से फ़ैसले में सबसे ज़्यादा असरदार रहे।', '<b>Saliency:</b> चमकीले बिंदु वे पिक्सल हैं जिनके प्रति मॉडल सबसे संवेदनशील था।', '<b>LIME:</b> पीली रेखाओं वाले हिस्से अनुमानित क्लास का समर्थन करते हैं।']) + 'डॉक्टर इन्हें फ़िल्म से मिलाकर देख सकते हैं।'; } },

    { id: 'how', k: ['how to use', 'how does', 'how it work', 'upload', 'use app', 'kaise', 'कैसे', 'इस्तेमाल', 'अपलोड', 'steps', 'guide'],
      en: function () { return '<b>How to use RespiTrust</b>' + list(['Log in with your phone number and the OTP.', 'Tap <b>Analyze an X-ray</b> and upload a chest X-ray image (JPG/PNG).', 'Read the result, the explanation images and the "What to do next" card.', 'Open <b>History</b> to see all past X-rays and your trend.', 'Use the 🔊 button and the English/हिंदी switch if you prefer.']) + 'Only chest X-rays are accepted.'; },
      hi: function () { return '<b>RespiTrust कैसे इस्तेमाल करें</b>' + list(['फ़ोन नंबर और OTP से लॉग इन करें।', '<b>Analyze an X-ray</b> दबाकर चेस्ट X-ray की फ़ोटो (JPG/PNG) अपलोड करें।', 'रिज़ल्ट, समझाने वाली तस्वीरें और "आगे क्या करें" कार्ड पढ़ें।', '<b>History</b> में पुराने सभी X-ray और ट्रेंड देखें।', 'चाहें तो 🔊 बटन और English/हिंदी स्विच इस्तेमाल करें।']) + 'सिर्फ़ चेस्ट X-ray स्वीकार होते हैं।'; } },

    { id: 'history', k: ['history', 'old x-ray', 'previous', 'past', 'trend', 'हिस्ट्री', 'पुराने', 'पिछले', 'पुरानी', 'purane', 'pichle'],
      en: function () { return 'Open the <b>History</b> page from the top menu. Tap any past X-ray to open it in full size with its result, date and next-step advice. Use the arrows to move between scans, and the + / click on the picture to zoom.'; },
      hi: function () { return 'ऊपर के मेन्यू से <b>History</b> पेज खोलें। किसी भी पुराने X-ray पर टैप करें, वह बड़ा खुलेगा और उसका रिज़ल्ट, तारीख और आगे की सलाह दिखेगी। स्कैन बदलने के लिए तीर दबाएं और ज़ूम के लिए तस्वीर पर क्लिक करें।'; } },

    { id: 'privacy', k: ['privacy', 'safe', 'data', 'secure', 'stored', 'private', 'गोपनीय', 'सुरक्षित', 'डेटा', 'प्राइवेसी', 'surakshit'],
      en: function () { return 'Your scans and results are saved only under your own phone number and are shown only after you log in. Please do not upload a scan that shows your name or ID.'; },
      hi: function () { return 'आपके स्कैन और रिज़ल्ट सिर्फ़ आपके फ़ोन नंबर के नाम से सेव होते हैं और लॉग इन के बाद ही दिखते हैं। जिस स्कैन पर नाम या ID लिखी हो, उसे अपलोड न करें।'; } },

    { id: 'prevent', k: ['prevent', 'vaccine', 'avoid', 'bachav', 'बचाव', 'वैक्सीन', 'टीका', 'रोकथाम'],
      en: function () { return '<b>Prevention</b>' + list(['Pneumococcal and yearly flu vaccines (ask your doctor, especially for children, 60+ and chronic patients).', 'Do not smoke and avoid second-hand smoke.', 'Wash hands, treat colds early, keep rooms ventilated.', 'Eat well, sleep well and stay active.']); },
      hi: function () { return '<b>बचाव</b>' + list(['न्यूमोकोकल और सालाना फ्लू वैक्सीन (डॉक्टर से पूछें, खासकर बच्चों, 60+ और पुराने रोगियों के लिए)।', 'धूम्रपान न करें और दूसरों के धुएं से बचें।', 'हाथ धोएं, सर्दी का इलाज जल्दी करें, कमरे में हवा आने दें।', 'अच्छा खाएं, अच्छी नींद लें और सक्रिय रहें।']); } },

    { id: 'hi', k: ['hindi', 'english', 'language', 'हिंदी', 'अंग्रेज़ी', 'अंग्रेजी', 'भाषा', 'bhasha'],
      en: function () { return 'I understand English and Hindi. Use the <b>EN | हिं</b> switch at the top of this chat, or just type in Hindi.'; },
      hi: function () { return 'मैं हिंदी और अंग्रेज़ी दोनों समझता हूं। इस चैट के ऊपर <b>EN | हिं</b> स्विच दबाएं या सीधे हिंदी में लिखें।'; } },

    { id: 'hello', k: ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'हेलो', 'हाय', 'namaskar'],
      en: function () { return 'Hello! I am the RespiTrust assistant. Ask me about your result, pneumonia, medicines, what to do next, or how to use the app.'; },
      hi: function () { return 'नमस्ते! मैं RespiTrust असिस्टेंट हूं। आप अपने रिज़ल्ट, निमोनिया, दवाओं, आगे के इलाज या ऐप इस्तेमाल करने के बारे में पूछ सकते हैं।'; } },

    { id: 'thanks', k: ['thanks', 'thank you', 'thx', 'धन्यवाद', 'शुक्रिया', 'dhanyavad', 'shukriya'],
      en: function () { return 'You are welcome! Get well soon. Please show your report to a doctor.'; },
      hi: function () { return 'आपका स्वागत है! जल्दी स्वस्थ हों। अपनी रिपोर्ट डॉक्टर को ज़रूर दिखाएं।'; } }
  ];

  function resultAnswer(L) {
    var key = resultKey();
    var conf = ($('#confidenceNum') || {}).textContent || '';
    if (!key || !isVisible($('#resultSection'))) {
      return L === 'hi' ? 'अभी कोई रिज़ल्ट खुला नहीं है। पहले <b>Analyze an X-ray</b> से चेस्ट X-ray अपलोड करें, फिर मैं रिज़ल्ट समझा दूंगा। पुराने रिज़ल्ट के लिए History खोलें।'
        : 'No result is open right now. Upload a chest X-ray with <b>Analyze an X-ray</b> and I will explain it. For older results, open History.';
    }
    var a = ADVICE[key];
    return (L === 'hi' ? '<b>आपका रिज़ल्ट:</b> ' : '<b>Your result:</b> ') + LABEL[key][L] + (conf ? ' (' + conf + ')' : '') + '<br>' + a.sum[L] +
      '<div class="rtx-warn">' + (L === 'hi' ? 'कॉन्फ़िडेंस AI का भरोसा है, डॉक्टर की पुष्टि नहीं। ' : 'Confidence is the AI\'s certainty, not a doctor\'s confirmation. ') + disclaimer() + '</div>';
  }
  function medAnswer(L) {
    var key = resultKey();
    var intro = '';
    if (key && isVisible($('#resultSection'))) {
      intro = (L === 'hi' ? '<b>आपके रिज़ल्ट (' + LABEL[key].hi + ') के हिसाब से:</b><br>' : '<b>For your result (' + LABEL[key].en + '):</b><br>') + ADVICE[key].med[L];
    } else {
      intro = L === 'hi'
        ? '<b>सामान्य जानकारी:</b><br>बैक्टीरियल निमोनिया में डॉक्टर एंटीबायोटिक देते हैं। वायरल निमोनिया में एंटीबायोटिक नहीं चलती, आराम, तरल और बुखार की दवा (पैरासिटामोल) से लक्षणों का इलाज होता है। कौन सी दवा, मात्रा और दिन डॉक्टर ही तय करता है। रिज़ल्ट खोलने पर मैं उसके हिसाब से बता सकता हूं।'
        : '<b>General information:</b><br>For bacterial pneumonia doctors prescribe antibiotics. Viral pneumonia does not respond to antibiotics, it is treated with rest, fluids and fever medicine (paracetamol). The exact medicine, dose and days are decided by the doctor. Open a result and I can tailor this.';
    }
    return intro + '<div class="rtx-warn">' + (L === 'hi' ? 'बिना डॉक्टर के पर्चे के एंटीबायोटिक/स्टेरॉयड न लें। बच्चों, गर्भवती और बुज़ुर्गों में खुराक अलग होती है। ' : 'Do not take antibiotics or steroids without a prescription. Doses differ for children, pregnancy and the elderly. ') + disclaimer() + '</div>';
  }
  function nextAnswer(L) {
    var key = resultKey();
    var k = (key && isVisible($('#resultSection'))) ? key : null;
    if (!k) {
      return (L === 'hi' ? '<b>आम तौर पर आगे के कदम:</b>' : '<b>Usual next steps:</b>') + list(L === 'hi'
        ? ['चेस्ट स्पेशलिस्ट / फिज़िशियन को रिपोर्ट दिखाएं।', 'ज़रूरत पर ब्लड टेस्ट, बलगम जांच, ऑक्सीजन लेवल या CT।', 'डॉक्टर की बताई दवा पूरा कोर्स लें।', '6-8 हफ़्ते बाद फ़ॉलो-अप X-ray (अगर डॉक्टर कहें)।']
        : ['Show the report to a chest specialist or physician.', 'Tests if needed: blood tests, sputum test, oxygen level or CT.', 'Take prescribed medicines for the full course.', 'Follow-up X-ray after 6 to 8 weeks if the doctor advises.']) +
        '<div class="rtx-warn">' + disclaimer() + '</div>';
    }
    var a = ADVICE[k];
    return '<b>' + LABEL[k][L] + '</b><br>' + a.sum[L] + list(a.steps[L]) + '<div class="rtx-warn">' + disclaimer() + '</div>';
  }
  function isVisible(n) { return !!(n && n.offsetParent !== null); }

  var DEV = /[ऀ-ॿ]/;
  function norm(s) { return s.toLowerCase().replace(/[?!.,]/g, ' '); }
  function answer(text) {
    var L = DEV.test(text) ? 'hi' : lang();
    var t = ' ' + norm(text) + ' ';
    var best = null, bestScore = 0;
    KB.forEach(function (it) {
      var sc = 0;
      it.k.forEach(function (w) {
        var wl = w.toLowerCase();
        if (wl.length <= 3 && !DEV.test(wl)) { if (t.indexOf(' ' + wl + ' ') > -1) sc += 1; }
        else if (t.indexOf(wl) > -1) sc += 2 + (wl.length > 7 ? 1 : 0);
      });
      if (it.id === 'emergency') sc *= 1.5;
      if (sc > bestScore) { bestScore = sc; best = it; }
    });
    if (!best) {
      return { L: L, html: L === 'hi'
        ? 'माफ़ कीजिए, मैं यह पूरी तरह समझ नहीं पाया। आप ये पूछ सकते हैं: रिज़ल्ट का मतलब, दवाइयां, आगे क्या करें, घरेलू देखभाल, इमरजेंसी के लक्षण या ऐप कैसे चलाएं। किसी भी चिंता में डॉक्टर से मिलें।'
        : 'Sorry, I did not fully understand. You can ask about: what your result means, medicines, what to do next, home care, emergency signs or how to use the app. For any worry, please see a doctor.' };
    }
    return { L: L, html: best[L]() };
  }

  var chatBuilt = false, chatOpen = false;
  function chips() {
    return lang() === 'hi'
      ? ['मेरे रिज़ल्ट का मतलब?', 'कौन सी दवा?', 'आगे क्या इलाज?', 'घरेलू देखभाल', 'इमरजेंसी कब?', 'बैक्टीरियल vs वायरल', 'सटीकता / प्रमाणपत्र', 'पुराने X-ray कैसे खोलें?']
      : ['What does my result mean?', 'Which medicines?', 'What treatment next?', 'Home care', 'When is it an emergency?', 'Bacterial vs viral', 'Accuracy / certificate', 'How to open old X-rays?'];
  }
  function msg(html, who) {
    var box = $('#rtxMsgs'); if (!box) return;
    var m = el('div', 'rtx-m ' + who);
    if (who === 'me') m.textContent = html; else m.innerHTML = html;
    box.appendChild(m);
    box.scrollTop = box.scrollHeight;
  }
  function botAsk(q) {
    msg(q, 'me');
    var r = answer(q);
    setTimeout(function () { msg(r.html, 'bot'); }, 250);
  }
  function renderChatChrome() {
    var c = $('#rtxChat'); if (!c) return;
    $('.rtx-chat-head b', c).textContent = T('RespiTrust Assistant', 'RespiTrust असिस्टेंट');
    $('.rtx-chat-head small', c).textContent = T('Hindi / English · general guidance only', 'हिंदी / English · सिर्फ़ सामान्य जानकारी');
    $('#rtxInput', c).placeholder = T('Type your question…', 'अपना सवाल लिखें…');
    $('#rtxSend', c).textContent = T('Send', 'भेजें');
    $$('.rtx-lang button', c).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === lang()); });
    var ch = $('.rtx-chips', c); ch.innerHTML = '';
    chips().forEach(function (q) {
      var b = el('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { botAsk(q); });
      ch.appendChild(b);
    });
  }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function buildChat() {
    if (chatBuilt) return;
    chatBuilt = true;
    var c = el('div', '');
    c.id = 'rtxChat';
    c.innerHTML =
      '<div class="rtx-chat-head"><div class="t"><b></b><small></small></div>' +
      '<div class="rtx-lang"><button type="button" data-l="en">EN</button><button type="button" data-l="hi">हिं</button></div>' +
      '<button type="button" class="rtx-close" aria-label="Close">&times;</button></div>' +
      '<div id="rtxMsgs"></div><div class="rtx-chips"></div>' +
      '<form class="rtx-in"><input id="rtxInput" type="text" autocomplete="off"><button id="rtxSend" type="submit"></button></form>';
    document.body.appendChild(c);
    $('.rtx-close', c).addEventListener('click', closeChat);
    $('.rtx-lang', c).addEventListener('click', function (e) {
      var b = e.target.closest('button[data-l]'); if (!b) return;
      if (window.RespiTrustI18n) window.RespiTrustI18n.setLang(b.getAttribute('data-l'));
      setTimeout(refreshAll, 30);
    });
    $('form', c).addEventListener('submit', function (e) {
      e.preventDefault();
      var i = $('#rtxInput'); var v = i.value.trim(); if (!v) return;
      i.value = ''; botAsk(v);
    });
    renderChatChrome();
    msg(T('Hello! I am the RespiTrust assistant. I can explain your result, pneumonia, medicines (general information), next treatment steps and how to use the app. Ask in Hindi or English.\n',
      'नमस्ते! मैं RespiTrust असिस्टेंट हूं। मैं आपका रिज़ल्ट, निमोनिया, दवाओं (सामान्य जानकारी), आगे के इलाज और ऐप के इस्तेमाल के बारे में बता सकता हूं। हिंदी या English में पूछें।') +
      '<div class="rtx-warn">' + disclaimer() + '</div>', 'bot');
  }
  function openChat() {
    buildChat();
    $('#rtxChat').classList.remove('rtx-hidden');
    $('#rtxChatFab').classList.add('rtx-hidden');
    chatOpen = true;
    setTimeout(function () { var i = $('#rtxInput'); if (i) i.focus(); }, 50);
  }
  function closeChat() {
    var c = $('#rtxChat'); if (c) c.classList.add('rtx-hidden');
    $('#rtxChatFab').classList.remove('rtx-hidden');
    chatOpen = false;
  }
  function buildFab() {
    var f = el('button', '', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4.5"/></svg>');
    f.id = 'rtxChatFab'; f.type = 'button';
    f.setAttribute('aria-label', 'Open assistant');
    f.addEventListener('click', openChat);
    document.body.appendChild(f);
  }

 
  function historyCards() { return $$('#historyList .history-card'); }
  function cardData(card) {
    var b = $('.history-badge', card);
    var m = b ? b.className.match(/\b(bacteria|virus|normal)\b/) : null;
    return {
      key: m ? m[1] : 'normal',
      src: ($('img', card) || {}).src || '',
      date: ($('.history-card-date', card) || {}).textContent || '',
      conf: ($('.history-card-conf', card) || {}).textContent || '',
      region: ($('.history-card-region', card) || {}).textContent || ''
    };
  }
  var hvIndex = 0;
  function openHistory(i) {
    var cards = historyCards();
    if (!cards.length) return;
    hvIndex = (i + cards.length) % cards.length;
    var d = cardData(cards[hvIndex]), a = ADVICE[d.key], L = lang();
    var h = '<div class="rtx-hv">' +
      '<div><div class="rtx-hv-img"><img src="' + d.src + '" alt="X-ray"></div>' +
      '<div class="rtx-hv-nav"><button type="button" class="rtx-btn" id="rtxPrev">&larr; ' + T('Newer', 'नया') + '</button>' +
      '<button type="button" class="rtx-btn" id="rtxNext">' + T('Older', 'पुराना') + ' &rarr;</button>' +
      '<button type="button" class="rtx-btn" id="rtxZoom">' + T('Zoom', 'ज़ूम') + '</button>' +
      '<a class="rtx-btn" style="text-decoration:none" href="' + d.src + '" target="_blank" rel="noopener">' + T('Open full image', 'पूरी इमेज खोलें') + '</a></div></div>' +
      '<div><h2>' + T('Past X-ray', 'पुराना X-ray') + ' ' + (hvIndex + 1) + '/' + cards.length + '</h2>' +
      '<p style="margin:6px 0"><span class="rtx-pill ' + d.key + '">' + lbl(d.key) + '</span> &nbsp;<b>' + d.conf + '</b> ' + T('confidence', 'कॉन्फ़िडेंस') + '</p>' +
      '<p style="margin:0;font-size:13px;color:#64748B">' + d.date + '</p>' +
      (d.region ? '<p style="margin:6px 0 0;font-size:14px">' + d.region + '</p>' : '') +
      '<h3>' + T('What it means', 'इसका मतलब') + '</h3><p style="margin:0;font-size:14px">' + a.sum[L] + '</p>' +
      '<h3>' + T('Next steps', 'अगले कदम') + '</h3>' + list(a.steps[L].slice(0, 3)) +
      '<p class="rtx-note">' + disclaimer() + '</p>' +
      '<div class="rtx-actions"><button type="button" class="rtx-btn solid" id="rtxHvAsk">' + T('Ask the assistant', 'असिस्टेंट से पूछें') + '</button></div></div></div>';
    var m = openModal(h, 'rtx-hv');
    var img = $('.rtx-hv-img img', m.body);
    function zoom() { img.classList.toggle('zoom'); }
    img.addEventListener('click', zoom);
    $('#rtxZoom', m.body).addEventListener('click', zoom);
    $('#rtxPrev', m.body).addEventListener('click', function () { openHistory(hvIndex - 1); });
    $('#rtxNext', m.body).addEventListener('click', function () { openHistory(hvIndex + 1); });
    $('#rtxHvAsk', m.body).addEventListener('click', function () {
      closeModal(); openChat();
      botAsk(T('My old X-ray shows ' + LABEL[d.key].en + '. What should I do?', 'मेरे पुराने X-ray में ' + LABEL[d.key].hi + ' है। मुझे क्या करना चाहिए?'));
    });
  }
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('#historyList .history-card');
    if (card) { openHistory(historyCards().indexOf(card)); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (modalOpen) closeModal(); else if (chatOpen) closeChat(); }
    else if (modalOpen && $('#rtxPrev')) {
      if (e.key === 'ArrowLeft') openHistory(hvIndex - 1);
      if (e.key === 'ArrowRight') openHistory(hvIndex + 1);
    }
  });


  function refreshAll() {
    buildBadge(); buildCertSlots(); renderAdvice(); renderChatChrome();
  }
  function init() {
    buildFab();
    refreshAll();
    var rc = $('#resultCard');
    if (rc) new MutationObserver(function () { renderAdvice(); }).observe(rc, { attributes: true, attributeFilter: ['class'] });
    var sw = $('#rtLang');
    if (sw) sw.addEventListener('click', function () { setTimeout(refreshAll, 40); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
