(function () {
  var LANG_KEY = 'respitrust_lang';
  var lang = 'en';
  try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) {}

  var DICT = {
    'RespiTrust': 'रेस्पीट्रस्ट',
    'Home': 'मुख्य पृष्ठ',
    'About': 'हमारे बारे में',
    'FAQs': 'अक्सर पूछे सवाल',
    'Features': 'खूबियाँ',
    'Upload': 'अपलोड',
    'History': 'पुराने नतीजे',
    'Log out': 'लॉग आउट',
    'Get Started': 'शुरू करें',
    'Get started': 'शुरू करें',
    'Analyze an X-ray': 'एक्स-रे जाँचें',
    'See how it works': 'देखें यह कैसे काम करता है',
    'Quick links': 'ज़रूरी लिंक',
    'Search: pneumonia, X-ray, explainability…': 'खोजें: निमोनिया, एक्स-रे…',

  
    'AI-assisted chest X-ray screening': 'AI की मदद से छाती के एक्स-रे की जाँच',
    'Explainable AI for': 'समझ में आने वाला AI —',
    'Pneumonia Detection': 'निमोनिया की पहचान',
    'Upload a chest X-ray and get a bacterial / viral / normal prediction in seconds — with Grad-CAM, saliency and LIME explainability so you can see exactly why.':
      'छाती का एक्स-रे अपलोड करें और कुछ ही सेकंड में पाएँ — बैक्टीरियल / वायरल / सामान्य। साथ में तस्वीर पर दिखेगा कि AI ने कहाँ देखा और क्यों।',
    'Explainable by design': 'हर नतीजा समझाया जाता है',
    'Results in seconds': 'नतीजा कुछ ही सेकंड में',
    'Grad-CAM · Saliency · LIME': 'Grad-CAM · सैलिएंसी · LIME',

  
    'About RespiTrust': 'रेस्पीट्रस्ट के बारे में',
    'Built for trust, not just accuracy': 'सिर्फ़ सटीकता नहीं, भरोसे के लिए बना',
    'RespiTrust is an AI-assisted chest X-ray screening tool. It classifies scans as Normal, Bacterial pneumonia or Viral pneumonia, and shows the exact lung regions that drove the prediction — so the result is something a clinician can actually check, not a black box.':
      'रेस्पीट्रस्ट छाती के एक्स-रे की जाँच में मदद करने वाला AI टूल है। यह एक्स-रे को सामान्य, बैक्टीरियल निमोनिया या वायरल निमोनिया में बाँटता है, और फेफड़ों का वह हिस्सा भी दिखाता है जिसके आधार पर नतीजा आया — ताकि डॉक्टर उसे खुद जाँच सकें।',
    'Three-class classification in a few seconds': 'कुछ ही सेकंड में तीन में से एक नतीजा',
    'Region-of-concern highlighting on every scan': 'हर एक्स-रे पर चिंता वाला हिस्सा चिह्नित',
    'Full test history saved to your account': 'आपके खाते में सारे पुराने नतीजे सुरक्षित',
    'Speed': 'रफ़्तार',
    'Coverage': 'क्या पहचानता है',
    'Normal · Bacterial · Viral': 'सामान्य · बैक्टीरियल · वायरल',
    'Transparency': 'पारदर्शिता',
    'Visual explanation on every scan': 'हर एक्स-रे पर तस्वीर से समझाइश',
    'Privacy': 'गोपनीयता',
    'Your scans, your account only': 'आपके एक्स-रे सिर्फ़ आपके खाते में',

    
    'Frequently asked questions': 'अक्सर पूछे जाने वाले सवाल',
    'How does RespiTrust work?': 'रेस्पीट्रस्ट कैसे काम करता है?',
    'Upload a chest X-ray and RespiTrust classifies it as Normal, Bacterial pneumonia or Viral pneumonia in a few seconds, and highlights the lung regions that most influenced that result.':
      'छाती का एक्स-रे अपलोड करें। रेस्पीट्रस्ट कुछ सेकंड में बताता है कि वह सामान्य, बैक्टीरियल या वायरल निमोनिया जैसा है, और फेफड़ों का वह हिस्सा दिखाता है जिसने नतीजे को सबसे ज़्यादा प्रभावित किया।',
    'Who can use this platform?': 'इसका उपयोग कौन कर सकता है?',
    "Built for clinicians and students who want a fast, explainable second read on a chest X-ray. It's a screening aid, not a replacement for a radiologist's diagnosis.":
      'यह डॉक्टरों और छात्रों के लिए बना है जो एक्स-रे पर जल्दी और समझने लायक दूसरी राय चाहते हैं। यह जाँच में मदद करने वाला साधन है, रेडियोलॉजिस्ट की जाँच का विकल्प नहीं।',
    'Is my data kept anywhere?': 'क्या मेरा डेटा कहीं सुरक्षित रहता है?',
    "Once you log in, every scan you analyze is saved to your account's history so you can track a patient's results over time and see how their condition is trending.":
      'लॉग इन करने के बाद आप जो भी एक्स-रे जाँचते हैं वह आपके खाते की हिस्ट्री में सुरक्षित हो जाता है, ताकि समय के साथ मरीज़ के नतीजे और हालत में बदलाव देखा जा सके।',
    "Does this replace a doctor's diagnosis?": 'क्या यह डॉक्टर की जाँच की जगह लेता है?',
    'No. RespiTrust is a screening aid meant to support a faster, more transparent first read — every result should still be confirmed by a qualified doctor or radiologist.':
      'नहीं। यह सिर्फ़ शुरुआती जाँच में मदद करता है — हर नतीजे की पुष्टि किसी योग्य डॉक्टर या रेडियोलॉजिस्ट से ज़रूर करवाएँ।',
    'What image formats can I upload?': 'कौन सी फ़ोटो अपलोड कर सकते हैं?',
    "RespiTrust accepts standard chest X-ray images in JPG or PNG format. Just upload the scan and you'll get your result in seconds.":
      'छाती के एक्स-रे की JPG या PNG फ़ोटो चलेगी। बस स्कैन अपलोड करें, नतीजा कुछ सेकंड में मिल जाएगा।',

    
    'Everything you need for a reliable read': 'भरोसेमंद जाँच के लिए सब कुछ',
    'Grad-CAM, saliency maps and LIME on every prediction, not just a confidence number.':
      'हर नतीजे के साथ Grad-CAM, सैलिएंसी मैप और LIME — सिर्फ़ प्रतिशत नहीं।',
    'Upload a scan and get a full breakdown — prediction, confidence and region of concern — almost instantly.':
      'स्कैन अपलोड करें और लगभग तुरंत पूरा ब्योरा पाएँ — नतीजा, भरोसे का प्रतिशत और चिंता वाला हिस्सा।',
    'OTP-secured login': 'OTP से सुरक्षित लॉग इन',
    'Passwordless mobile OTP login with instant verification — no passwords to manage or leak.':
      'मोबाइल OTP से लॉग इन — कोई पासवर्ड याद रखने या लीक होने का झंझट नहीं।',
    'Trend-aware history': 'रुझान के साथ पुराने नतीजे',
    "Every scan is saved to your account, and RespiTrust flags whether a patient looks like they're improving or worsening.":
      'हर स्कैन आपके खाते में सुरक्षित रहता है, और रेस्पीट्रस्ट बताता है कि मरीज़ की हालत सुधर रही है या बिगड़ रही है।',

    
    'Explainable AI for pneumonia detection — a screening aid for chest X-rays, built with transparency at the core.':
      'निमोनिया की पहचान के लिए समझाने वाला AI — छाती के एक्स-रे की जाँच में मदद, पारदर्शिता के साथ।',
    'Academic project — not a certified medical diagnostic tool.':
      'यह एक कॉलेज प्रोजेक्ट है — प्रमाणित मेडिकल जाँच उपकरण नहीं।',

    
    'Log in to RespiTrust': 'रेस्पीट्रस्ट में लॉग इन करें',
    "Enter your mobile number — we'll send a one-time code to verify it's you.":
      'अपना मोबाइल नंबर डालें — पुष्टि के लिए हम एक बार वाला कोड (OTP) भेजेंगे।',
    'Mobile number': 'मोबाइल नंबर',
    '10-digit mobile number': '10 अंकों का मोबाइल नंबर',
    'Send OTP': 'OTP भेजें',
    'Sending…': 'भेजा जा रहा है…',
    'Code sent to': 'कोड भेजा गया:',
    '6-digit code': '6 अंकों का कोड',
    'Verify & log in': 'जाँचें और लॉग इन करें',
    'Verifying…': 'जाँच हो रही है…',
    'Change number / resend code': 'नंबर बदलें / कोड दोबारा भेजें',
    'Demo mode — no SMS is actually sent. Your OTP is': 'डेमो मोड — असल में SMS नहीं जाता। आपका OTP है:',
    '. Type it below.': '। इसे नीचे डालें।',
    'OTP sent.': 'OTP भेज दिया गया।',
    'Mobile number must be exactly 10 digits.': 'मोबाइल नंबर ठीक 10 अंकों का होना चाहिए।',
    'Enter a valid 10-digit mobile number.': 'सही 10 अंकों का मोबाइल नंबर डालें।',
    'Enter the 6-digit code.': '6 अंकों का कोड डालें।',
    'Request a new OTP first.': 'पहले नया OTP मँगवाएँ।',
    'OTP has expired. Please request a new one.': 'OTP की समय-सीमा खत्म हो गई। कृपया नया OTP मँगवाएँ।',
    'Incorrect or expired OTP.': 'OTP गलत है या खत्म हो चुका है।',

    
    'Upload a chest X-ray': 'छाती का एक्स-रे अपलोड करें',
    'Get a Normal / Bacterial / Viral prediction in seconds — with Grad-CAM, saliency and LIME so you can see exactly why.':
      'कुछ ही सेकंड में पाएँ सामान्य / बैक्टीरियल / वायरल का नतीजा — साथ में तस्वीर से समझ भी कि AI ने कहाँ देखा।',
    'Click or drag a chest X-ray image here': 'यहाँ छाती के एक्स-रे की फ़ोटो चुनें या खींचकर छोड़ें',
    'Frontal chest X-rays only · JPG or PNG': 'सिर्फ़ सामने से लिया छाती का एक्स-रे · JPG या PNG',
    'Choose file': 'फ़ाइल चुनें',
    'Analyze image': 'जाँच शुरू करें',
    "This image can't be analysed": 'इस फ़ोटो की जाँच नहीं हो सकती',
    'RespiTrust analyses frontal chest X-rays only. Please choose a chest X-ray image (JPG or PNG) and try again.':
      'रेस्पीट्रस्ट सिर्फ़ सामने से लिए छाती के एक्स-रे की जाँच करता है। कृपया छाती के एक्स-रे की फ़ोटो (JPG या PNG) चुनकर दोबारा कोशिश करें।',
    'Analyzing X-ray…': 'एक्स-रे की जाँच हो रही है…',

  
    'This image is too small to be a usable X-ray. Please upload the original chest X-ray file (at least 128 x 128 pixels).':
      'यह फ़ोटो एक्स-रे के लिए बहुत छोटी है। कृपया छाती के एक्स-रे की असली फ़ाइल अपलोड करें (कम से कम 128 x 128 पिक्सल)।',
    'This image has an unusual shape for a chest X-ray. Please upload the full, uncropped frontal chest X-ray.':
      'इस फ़ोटो की बनावट छाती के एक्स-रे जैसी नहीं है। कृपया बिना कटा, पूरा, सामने से लिया छाती का एक्स-रे अपलोड करें।',
    'This looks like a colour photograph, not a chest X-ray. RespiTrust can only analyse grayscale chest X-ray images.':
      'यह रंगीन फ़ोटो लग रही है, छाती का एक्स-रे नहीं। रेस्पीट्रस्ट सिर्फ़ ग्रे (काले-सफ़ेद) एक्स-रे की जाँच कर सकता है।',
    'This image does not appear to contain a chest X-ray (it looks blank or almost uniform). Please upload a frontal chest X-ray.':
      'इस फ़ोटो में छाती का एक्स-रे नहीं दिखता (यह खाली या एक जैसी लग रही है)। कृपया सामने से लिया छाती का एक्स-रे अपलोड करें।',
    'This looks like a document or screenshot, not a chest X-ray. Please upload a frontal chest X-ray image.':
      'यह कोई कागज़ या स्क्रीनशॉट लग रहा है, छाती का एक्स-रे नहीं। कृपया छाती के एक्स-रे की फ़ोटो अपलोड करें।',
    'This image could not be checked. Please upload a standard JPG or PNG chest X-ray.':
      'इस फ़ोटो की जाँच नहीं हो सकी। कृपया JPG या PNG में छाती का एक्स-रे अपलोड करें।',
    'This image does not look like a frontal chest X-ray, so RespiTrust cannot analyse it. Please upload a chest X-ray image only.': 'यह फ़ोटो सामने से लिए गए छाती के एक्स-रे जैसी नहीं लग रही, इसलिए रेस्पीट्रस्ट इसकी जाँच नहीं कर सकता। कृपया सिर्फ़ छाती के एक्स-रे की फ़ोटो अपलोड करें।',
    'Please upload an image file (JPG/PNG).': 'कृपया फ़ोटो फ़ाइल (JPG/PNG) अपलोड करें।',
    'Could not read the uploaded image.': 'अपलोड की गई फ़ोटो पढ़ी नहीं जा सकी।',

    
    'Prediction result': 'जाँच का नतीजा',
    'Prediction': 'नतीजा',
    'confidence': 'भरोसा',
    'What this means': 'इसका मतलब क्या है',
    'Probability breakdown': 'संभावना का ब्योरा',
    'Bacterial pneumonia': 'बैक्टीरियल निमोनिया',
    'Viral pneumonia': 'वायरल निमोनिया',
    'Normal': 'सामान्य',
    'Explainability': 'AI ने कहाँ देखा',
    'Grad-CAM': 'Grad-CAM',
    'Saliency map': 'सैलिएंसी मैप',
    'LIME': 'LIME',
    "Highlights the lung regions that most influenced the model's prediction, warmer areas mattered more.":
      'फेफड़ों के वे हिस्से जिन्होंने AI के नतीजे को सबसे ज़्यादा प्रभावित किया — जितना गर्म (लाल/पीला) रंग, उतना ज़्यादा असर।',
    'Shows pixel-level gradients — brighter points are areas the model was most sensitive to.':
      'बारीक स्तर पर दिखाता है कि कौन से बिंदु सबसे अहम रहे — जितना चमकदार बिंदु, उतना ज़्यादा असर।',
    'Outlines the image superpixels that contributed positively to the predicted class.':
      'तस्वीर के वे टुकड़े जिन्होंने इस नतीजे का साथ दिया, किनारों से चिह्नित किए गए हैं।',
    'Region of concern': 'चिंता वाला हिस्सा',
    'Model focused on the lower-left lung field.': 'AI ने मुख्य रूप से निचले-बाएँ फेफड़े के हिस्से पर ध्यान दिया।',
    'Saved to your test history.': 'आपकी हिस्ट्री में सुरक्षित कर दिया गया।',
    'Log in to save this result to your history.': 'इस नतीजे को हिस्ट्री में सुरक्षित करने के लिए लॉग इन करें।',
    'Listen to result': '🔊 नतीजा सुनें',
    'Stop': '⏹ रोकें',
    'No focal abnormality detected — attention was spread evenly across both lungs.':
      'कोई ख़ास गड़बड़ी वाला हिस्सा नहीं मिला — AI का ध्यान दोनों फेफड़ों पर बराबर रहा।',

    
    'Your account': 'आपका खाता',
    'Test history & condition trend': 'पुराने नतीजे और हालत का रुझान',
    'Every scan you analyze is saved here, so you can see how the condition is changing over time.':
      'आप जो भी एक्स-रे जाँचते हैं वह यहाँ सुरक्षित रहता है, ताकि समय के साथ हालत में बदलाव देखा जा सके।',
    'Condition trend': 'हालत का रुझान',
    'Loading…': 'लोड हो रहा है…',
    'Past tests': 'पुरानी जाँचें',
    'No tests yet — analyze an X-ray to start building history.':
      'अभी कोई जाँच नहीं — एक्स-रे जाँचें, हिस्ट्री यहाँ बनने लगेगी।',
    'Could not load history': 'हिस्ट्री लोड नहीं हो सकी',
    'Not enough history yet': 'अभी रुझान बताने लायक जाँचें नहीं हैं',
    'Analyze a couple more X-rays to start seeing a trend.': 'रुझान देखने के लिए कुछ और एक्स-रे जाँचें।',
    'Looking better': 'हालत बेहतर दिख रही है',
    'Needs attention': 'ध्यान देने की ज़रूरत है',
    'Stable': 'स्थिर',
    'Result changed': 'नतीजा बदल गया',
    'The most recent scan came back Normal after a previous pneumonia result.':
      'पिछली बार निमोनिया आया था, और ताज़ा एक्स-रे सामान्य आया है।',
    'The most recent scan flagged pneumonia after a previous Normal result.':
      'पिछली बार एक्स-रे सामान्य था, और ताज़ा एक्स-रे में निमोनिया के संकेत मिले हैं।',
    'Not logged in.': 'आप लॉग इन नहीं हैं।'
  };

  
  var WORD = { Normal: 'सामान्य', Bacteria: 'बैक्टीरियल', Virus: 'वायरल',
               Bacterial: 'बैक्टीरियल', Viral: 'वायरल' };
  var SIDE = { left: 'बाएँ', right: 'दाएँ' };
  var PART = { upper: 'ऊपरी', lower: 'निचले' };
  var PART2 = { upper: 'ऊपरी', lower: 'निचला' };

  
  function whereHi(w) {
    var m;
    if ((m = w.match(/^in the (upper|lower) part of the (left|right) lung$/))) return SIDE[m[2]] + ' फेफड़े के ' + PART[m[1]] + ' हिस्से में';
    if ((m = w.match(/^in the (upper|lower) part of the lungs$/))) return 'फेफड़ों के ' + PART[m[1]] + ' हिस्से में';
    if (w === 'in the middle of the lungs') return 'फेफड़ों के बीच में';
    if (w === 'in the lungs') return 'फेफड़ों में';
    return w;
  }

  var PATTERNS = [
    
    [/Good news — this X-ray looks Normal\. The AI is (\d+)% sure it did not find signs of pneumonia in the lungs\./g,
      function (m, p) { return 'अच्छी खबर — यह एक्स-रे सामान्य दिख रहा है। AI को ' + p + '% भरोसा है कि फेफड़ों में निमोनिया के कोई लक्षण नहीं मिले।'; }],
    [/This X-ray shows patterns that look like Bacterial pneumonia, mostly (.+?)\. The AI is (\d+)% sure about this\. Bacterial pneumonia is usually treated with antibiotics, so please get this confirmed by a doctor before starting any treatment\./g,
      function (m, w, p) { return 'इस एक्स-रे में बैक्टीरियल निमोनिया जैसे निशान दिख रहे हैं, ज़्यादातर ' + whereHi(w) + '। AI को ' + p + '% भरोसा है। बैक्टीरियल निमोनिया का इलाज आमतौर पर एंटीबायोटिक से होता है, इसलिए कोई भी इलाज शुरू करने से पहले डॉक्टर से पुष्टि ज़रूर करवाएँ।'; }],
    [/This X-ray shows patterns that look like Viral pneumonia, mostly (.+?)\. The AI is (\d+)% sure about this\. Viral pneumonia is usually managed differently from the bacterial kind, so please have a doctor confirm the result\./g,
      function (m, w, p) { return 'इस एक्स-रे में वायरल निमोनिया जैसे निशान दिख रहे हैं, ज़्यादातर ' + whereHi(w) + '। AI को ' + p + '% भरोसा है। वायरल निमोनिया का इलाज बैक्टीरियल से अलग होता है, इसलिए कृपया डॉक्टर से नतीजे की पुष्टि करवाएँ।'; }],
    [/The AI finished analyzing this X-ray with (\d+)% confidence\./g,
      function (m, p) { return 'AI ने इस एक्स-रे की जाँच ' + p + '% भरोसे के साथ पूरी की।'; }],
    [/ The AI is not very confident about this one \(below 60%\), so it should not be relied on by itself — please have a radiologist take a look\./g,
      function () { return ' इस बार AI को ज़्यादा भरोसा नहीं है (60% से कम), इसलिए सिर्फ़ इसी पर निर्भर न रहें — कृपया किसी रेडियोलॉजिस्ट/डॉक्टर को दिखाएँ।'; }],
    [/ The Grad-CAM, saliency and LIME tabs below show, in different ways, exactly which part of the X-ray the AI focused on to reach this result\./g,
      function () { return ' नीचे के Grad-CAM, सैलिएंसी और LIME टैब अलग-अलग तरीकों से दिखाते हैं कि AI ने एक्स-रे के किस हिस्से को देखकर यह नतीजा निकाला।'; }],

    
    [/Model has focused primarily on the central lung field\./g,
      function () { return 'AI ने मुख्य रूप से फेफड़े के बीच वाले हिस्से पर ध्यान दिया।'; }],
    [/Model has focused primarily on the (upper|lower|middle)-(left|right|central) lung field\./g,
      function (m, v, s) {
        if (s === 'central') return 'AI ने मुख्य रूप से फेफड़ों के ' + (v === 'middle' ? 'बीच वाले' : PART[v] + ' बीच वाले') + ' हिस्से पर ध्यान दिया।';
        if (v === 'middle') return 'AI ने मुख्य रूप से ' + SIDE[s] + ' फेफड़े के बीच वाले हिस्से पर ध्यान दिया।';
        return 'AI ने मुख्य रूप से ' + SIDE[s] + ' फेफड़े के ' + PART[v] + ' हिस्से पर ध्यान दिया।';
      }],
    [/ \(Low confidence — recommend manual review by a radiologist\.\)/g,
      function () { return ' (कम भरोसा — कृपया किसी रेडियोलॉजिस्ट से जँचवाएँ।)'; }],

  
    [/The last two scans both came back (Normal|Bacteria|Virus)\./g,
      function (m, w) { return 'पिछले दोनों एक्स-रे का नतीजा ' + WORD[w] + ' रहा।'; }],
    [/The prediction changed from (Normal|Bacteria|Virus) to (Normal|Bacteria|Virus)\./g,
      function (m, a, b) { return 'नतीजा ' + WORD[a] + ' से बदलकर ' + WORD[b] + ' हो गया।'; }],
    [/Could not reach the RespiTrust backend at /g, function () { return 'रेस्पीट्रस्ट सर्वर तक पहुँच नहीं हो सकी: '; }]
  ];

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function translate(text) {
    var key = norm(text);
    if (!key) return null;
    if (Object.prototype.hasOwnProperty.call(DICT, key)) return DICT[key];
    var out = text, changed = false;
    for (var i = 0; i < PATTERNS.length; i++) {
      var next = out.replace(PATTERNS[i][0], PATTERNS[i][1]);
      if (next !== out) { out = next; changed = true; }
    }
    return changed ? out : null;
  }
  var store = new WeakMap(); 
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1 };

  function applyNode(n) {
    var v = n.nodeValue;
    if (!v || !v.trim()) return;
    var rec = store.get(n);
    if (!rec || v !== rec.shown) rec = { orig: v, shown: v };   
    var target = rec.orig;
    if (lang === 'hi') {
      var lead = rec.orig.match(/^\s*/)[0], trail = rec.orig.match(/\s*$/)[0];
      var hi = translate(rec.orig);
      if (hi !== null) target = lead + hi + trail;
    }
    if (n.nodeValue !== target) n.nodeValue = target;
    rec.shown = target;
    store.set(n, rec);
  }

  var ATTRS = ['placeholder', 'alt', 'title', 'aria-label'];
  function applyAttrs(el) {
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      var k = 'rtOrig' + a.replace(/-/g, '');
      if (el.dataset[k] === undefined) el.dataset[k] = el.getAttribute(a);
      var orig = el.dataset[k];
      var hi = (lang === 'hi') ? translate(orig) : null;
      el.setAttribute(a, hi !== null ? hi : orig);
    });
  }

  function walk(root) {
    if (root.nodeType === 3) { applyNode(root); return; }
    if (root.nodeType !== 1 || SKIP[root.tagName]) return;
    applyAttrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }

  var observer = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === 'characterData') applyNode(m.target);
      else if (m.type === 'childList') m.addedNodes.forEach(walk);
    });
  });

  function applyAll() {
    document.documentElement.setAttribute('lang', lang === 'hi' ? 'hi' : 'en');
    walk(document.body);
    refreshToggle();
    refreshListen();
  }

  var toggleEl;
  function buildToggle() {
    var css = document.createElement('style');
    css.textContent =
      '#rtLang{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;gap:0;' +
      'background:#fff;border:2px solid #0f766e;border-radius:999px;overflow:hidden;' +
      'box-shadow:0 6px 20px rgba(0,0,0,.18);font-family:inherit}' +
      '#rtLang button{border:0;background:transparent;padding:10px 18px;font-size:16px;font-weight:700;' +
      'color:#0f766e;cursor:pointer;font-family:inherit}' +
      '#rtLang button.on{background:#0f766e;color:#fff}' +
      '.rt-listen{margin-top:12px;padding:11px 20px;font-size:16px;font-weight:700;border-radius:10px;' +
      'border:2px solid #0f766e;background:#fff;color:#0f766e;cursor:pointer;font-family:inherit}' +
      '.rt-listen.playing{background:#0f766e;color:#fff}';
    document.head.appendChild(css);

    toggleEl = document.createElement('div');
    toggleEl.id = 'rtLang';
    toggleEl.setAttribute('role', 'group');
    toggleEl.innerHTML = '<button type="button" data-l="en">English</button><button type="button" data-l="hi">हिंदी</button>';
    toggleEl.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-l]');
      if (b) setLang(b.getAttribute('data-l'));
    });
    document.body.appendChild(toggleEl);
  }
  function refreshToggle() {
    if (!toggleEl) return;
    toggleEl.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-l') === lang);
    });
  }

  function setLang(l) {
    lang = l === 'hi' ? 'hi' : 'en';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    stopSpeaking();
    applyAll();
  }

  var listenBtn;
  function stopSpeaking() {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    if (listenBtn) { listenBtn.classList.remove('playing'); setListenLabel(false); }
  }
  function setListenLabel(playing) {
    if (!listenBtn) return;
    var en = playing ? 'Stop' : 'Listen to result';
    listenBtn.dataset.rtKey = en;
    listenBtn.textContent = (lang === 'hi') ? DICT[en] : (playing ? '⏹ Stop' : '🔊 Listen to result');
  }
  function refreshListen() { if (listenBtn) setListenLabel(listenBtn.classList.contains('playing')); }

  function buildListen() {
    var target = document.getElementById('plainExplanation');
    if (!target || !('speechSynthesis' in window)) return;
    listenBtn = document.createElement('button');
    listenBtn.type = 'button';
    listenBtn.className = 'rt-listen';
    listenBtn.setAttribute('data-rt-skip', '1');
    target.parentNode.appendChild(listenBtn);
    setListenLabel(false);
    listenBtn.addEventListener('click', function () {
      var synth = window.speechSynthesis;
      if (listenBtn.classList.contains('playing') || synth.speaking) { stopSpeaking(); return; }
      var title = (document.getElementById('predictionLabel') || {}).textContent || '';
      var text = (title ? title + '. ' : '') + target.textContent;
      var u = new SpeechSynthesisUtterance(text);
      u.lang = (lang === 'hi') ? 'hi-IN' : 'en-IN';
      u.rate = 0.9;
      var voices = synth.getVoices();
      var v = voices.find(function (x) { return x.lang && x.lang.toLowerCase().indexOf(lang === 'hi' ? 'hi' : 'en-in') === 0; });
      if (v) u.voice = v;
      u.onend = u.onerror = function () { listenBtn.classList.remove('playing'); setListenLabel(false); };
      listenBtn.classList.add('playing');
      setListenLabel(true);
      synth.speak(u);
    });
  }
  
  function init() {
    buildToggle();
    buildListen();
    applyAll();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.RespiTrustI18n = { setLang: setLang, translate: translate, get lang() { return lang; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();