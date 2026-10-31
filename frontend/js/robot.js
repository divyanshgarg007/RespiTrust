
(function () {
  'use strict';
  if (window.__rtRobot) return; window.__rtRobot = 1;

  var path = (location.pathname || '').toLowerCase();
  var ROLE = /doctor\.html/.test(path) ? 'doctor' : /admin\.html/.test(path) ? 'admin' : 'user';
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var synth = window.speechSynthesis;
  var DEV = /[ऀ-ॿ]/;
  var LK = 'respitrust_robot_lang', SK = 'respitrust_robot_speak';

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  var lang = store(LK) || store('respitrust_lang') || 'en';
  if (lang !== 'hi') lang = 'en';
  var speakOn = store(SK) !== '0';           // robot speaks by default
  function T(en, hi) { return lang === 'hi' ? hi : en; }
  function $(s, r) { return (r || document).querySelector(s); }


  var DISC = {
    en: 'I am a helper robot, not a doctor. In an emergency call 108.',
    hi: 'मैं एक सहायक रोबोट हूं, डॉक्टर नहीं। इमरजेंसी में 108 पर कॉल करें।'
  };
  var KB = {
    user: [
      { k: ['emergency', 'urgent', 'breath', 'saans', 'सांस', 'साँस', 'chest pain', 'सीने', 'seene', 'blue', '108'],
        en: 'If you have trouble breathing, chest pain, blue lips, or very high fever, do not wait for the app. Call 108 or go to the nearest hospital right now.',
        hi: 'अगर सांस लेने में दिक्कत, सीने में दर्द, होंठ नीले या बहुत तेज़ बुखार है, तो ऐप का इंतज़ार न करें। अभी 108 पर कॉल करें या नज़दीकी अस्पताल जाएं।' },
      { k: ['upload', 'xray', 'x-ray', 'scan', 'अपलोड', 'एक्स', 'how', 'kaise', 'कैसे', 'use'],
        en: 'To check an X-ray: log in with your phone number and OTP, tap upload, choose a clear chest X-ray photo, and press analyze. You get the result with a heat-map showing which area the AI looked at.',
        hi: 'एक्स-रे जांचने के लिए: फोन नंबर और OTP से लॉगिन करें, अपलोड दबाएं, साफ़ चेस्ट एक्स-रे की फोटो चुनें और जांच दबाएं। नतीजे के साथ हीट-मैप मिलेगा जो दिखाता है कि AI ने कौन सा हिस्सा देखा।' },
      { k: ['otp', 'login', 'log in', 'लॉगिन', 'phone', 'mobile', 'number', 'नंबर'],
        en: 'Patients log in with a phone number and a one-time password. This is a demo OTP for the project. Doctors and admins use their own email and password pages.',
        hi: 'मरीज़ फोन नंबर और वन-टाइम पासवर्ड से लॉगिन करते हैं। यह प्रोजेक्ट के लिए डेमो OTP है। डॉक्टर और एडमिन का ईमेल-पासवर्ड वाला अलग पेज है।' },
      { k: ['bacteria', 'bacterial', 'virus', 'viral', 'normal', 'result', 'नतीजा', 'रिज़ल्ट', 'रिजल्ट', 'बैक्टीरिया', 'वायरस', 'confidence'],
        en: 'The AI sorts a chest X-ray into three groups: Bacterial pneumonia, Viral pneumonia, or Normal, and shows a confidence percentage. If the confidence is low, treat it as unsure and ask a doctor. Bacterial and viral look similar on X-ray, so this is the hardest part.',
        hi: 'AI चेस्ट एक्स-रे को तीन में बांटता है: बैक्टीरियल निमोनिया, वायरल निमोनिया या नॉर्मल, और भरोसे का प्रतिशत दिखाता है। भरोसा कम हो तो उसे अनिश्चित मानें और डॉक्टर से पूछें। बैक्टीरियल और वायरल एक्स-रे में मिलते-जुलते दिखते हैं, इसलिए यही सबसे कठिन हिस्सा है।' },
      { k: ['accuracy', 'accurate', 'sahi', 'सही', 'एक्यूरेसी', 'certified', 'certificate', 'सर्टिफ'],
        en: 'Our doctor certificate, signed by Dr. Ashish Jaiswal, states an overall diagnostic accuracy of 85 percent. Our own test on 701 images gave about 95 percent, but that is a lab test and not a clinical proof. It is a screening aid, not a diagnosis.',
        hi: 'हमारे डॉक्टर सर्टिफिकेट पर डॉ. आशीष जायसवाल के हस्ताक्षर हैं और उसमें कुल 85 प्रतिशत डायग्नोस्टिक एक्यूरेसी लिखी है। हमारे अपने 701 इमेज के टेस्ट में लगभग 95 प्रतिशत आया, लेकिन वह लैब टेस्ट है, क्लिनिकल सबूत नहीं। यह स्क्रीनिंग की मदद है, डायग्नोसिस नहीं।' },
      { k: ['medicine', 'dawai', 'दवा', 'दवाई', 'tablet', 'antibiotic', 'dose', 'treatment', 'ilaj', 'इलाज'],
        en: 'I cannot prescribe medicine or doses. Bacterial pneumonia is usually treated with antibiotics and viral with rest, fluids and fever care, but only a doctor can decide. Use the "Send to doctor" button to share your scan with a doctor.',
        hi: 'मैं दवा या डोज़ नहीं बता सकता। बैक्टीरियल निमोनिया में आमतौर पर एंटीबायोटिक और वायरल में आराम, तरल और बुखार की देखभाल होती है, पर फैसला सिर्फ डॉक्टर करेगा। अपना स्कैन डॉक्टर को भेजने के लिए "Send to doctor" बटन दबाएं।' },
      { k: ['doctor', 'डॉक्टर', 'send', 'bhej', 'भेज', 'case', 'consult'],
        en: 'After a scan, open your history and tap "Send to doctor". A verified doctor reviews the scan and replies in the case chat. Tick the consent box first, because the doctor will see your scan.',
        hi: 'स्कैन के बाद हिस्ट्री खोलें और "Send to doctor" दबाएं। वेरिफाइड डॉक्टर स्कैन देखकर केस चैट में जवाब देंगे। पहले सहमति वाला बॉक्स टिक करें, क्योंकि डॉक्टर आपका स्कैन देखेंगे।' },
      { k: ['history', 'पुराने', 'purane', 'हिस्ट्री', 'previous', 'old'],
        en: 'Your earlier scans are saved against your phone number. Open History to view any old X-ray and its result again.',
        hi: 'आपके पुराने स्कैन आपके फोन नंबर के साथ सेव रहते हैं। पुराना एक्स-रे और उसका नतीजा फिर देखने के लिए हिस्ट्री खोलें।' },
      { k: ['privacy', 'safe', 'data', 'secure', 'सुरक्षित', 'प्राइवेसी', 'डेटा'],
        en: 'Your scans are tied to your phone number. Doctors see only the cases you send, with your number partly hidden. Chat with the helper may be saved for quality checks.',
        hi: 'आपके स्कैन आपके फोन नंबर से जुड़े हैं। डॉक्टर सिर्फ वही केस देखते हैं जो आप भेजें, और आपका नंबर आधा छिपा रहता है। हेल्पर से चैट क्वालिटी जांच के लिए सेव हो सकती है।' },
      { k: ['explain', 'heatmap', 'heat', 'grad', 'lime', 'saliency', 'हीट', 'why'],
        en: 'The heat-map shows where the AI looked. Red areas had the most influence on the answer. We show three methods, Grad-CAM, Saliency and LIME, so you can see the AI is not a black box.',
        hi: 'हीट-मैप दिखाता है कि AI ने कहां देखा। लाल हिस्से का जवाब पर सबसे ज़्यादा असर था। हम तीन तरीके दिखाते हैं, Grad-CAM, Saliency और LIME, ताकि साफ़ दिखे कि AI ब्लैक बॉक्स नहीं है।' }
    ],
    doctor: [
      { k: ['login', 'log in', 'password', 'पासवर्ड', 'लॉगिन', 'email', 'ईमेल', 'account'],
        en: 'Log in with the email and password the admin gave you. After 5 wrong passwords the email is locked for 5 minutes. Please change the first password after logging in.',
        hi: 'एडमिन से मिले ईमेल और पासवर्ड से लॉगिन करें। 5 बार गलत पासवर्ड पर ईमेल 5 मिनट के लिए लॉक हो जाता है। पहली बार लॉगिन के बाद पासवर्ड बदल लें।' },
      { k: ['claim', 'take', 'open', 'new', 'case', 'केस', 'क्लेम', 'लें', 'start', 'shuru'],
        en: 'In the list on the left, open a case with status Open and press Claim. Once you claim it, the case is yours and other doctors cannot see it. Only after claiming do you see the patient phone number in masked form and the previous scans.',
        hi: 'बाईं लिस्ट में Open स्टेटस वाला केस खोलें और Claim दबाएं। क्लेम करते ही केस आपका हो जाता है और बाकी डॉक्टर उसे नहीं देख सकते। क्लेम के बाद ही मरीज़ का आधा छिपा नंबर और पुराने स्कैन दिखते हैं।' },
      { k: ['review', 'verdict', 'agree', 'disagree', 'need more', 'रिव्यू', 'सहमत', 'असहमत', 'opinion', 'राय'],
        en: 'In the review box choose a verdict: Agree with AI, Disagree, or Need more tests. Write your note for the patient and save. The status becomes Reviewed and the patient is notified.',
        hi: 'रिव्यू बॉक्स में अपना फैसला चुनें: AI से सहमत, असहमत, या और जांच चाहिए। मरीज़ के लिए नोट लिखकर सेव करें। स्टेटस Reviewed हो जाएगा और मरीज़ को खबर मिलेगी।' },
      { k: ['xray', 'x-ray', 'image', 'zoom', 'heatmap', 'एक्स', 'इमेज', 'जूम', 'view'],
        en: 'Click the X-ray to zoom, click again to zoom out. Use the small thumbnails to switch between the original scan and the heat-map views, and compare with the AI result and confidence on the right.',
        hi: 'एक्स-रे पर क्लिक करके ज़ूम करें, दोबारा क्लिक पर वापस। छोटे थंबनेल से ओरिजिनल स्कैन और हीट-मैप बदलकर देखें, और दाईं तरफ AI का नतीजा और भरोसा मिलाएं।' },
      { k: ['chat', 'message', 'reply', 'patient', 'मैसेज', 'चैट', 'जवाब', 'मरीज़', 'मरीज'],
        en: 'Type your message below the thread and press Send. The patient sees it in their "My doctor cases" window. Do not share your own phone number or prescribe doses over this chat unless your hospital rules allow it.',
        hi: 'थ्रेड के नीचे मैसेज लिखकर Send दबाएं। मरीज़ को वह उनकी "My doctor cases" विंडो में दिखेगा। अपना फोन नंबर न दें और डोज़ तभी लिखें जब आपके अस्पताल के नियम इजाज़त दें।' },
      { k: ['privacy', 'mask', 'phone', 'number', 'secret', 'प्राइवेसी', 'नंबर', 'सुरक्षा', 'security', 'audit'],
        en: 'Patient numbers are masked. You see only your own claimed cases. Every view and review is written to an audit log that the admin can check.',
        hi: 'मरीज़ का नंबर छिपा रहता है। आप सिर्फ अपने क्लेम किए केस देखते हैं। हर देखना और रिव्यू एक ऑडिट लॉग में लिखा जाता है जिसे एडमिन देख सकता है।' },
      { k: ['accuracy', 'ai', 'model', 'wrong', 'galat', 'गलत', 'एक्यूरेसी', 'trust', 'bacteria', 'virus'],
        en: 'The AI is a screening aid with about 95 percent on our own test set, and the certificate states 85 percent. Bacterial versus viral is the weakest part, so your judgement is final. Low confidence means unsure.',
        hi: 'AI एक स्क्रीनिंग सहायक है, हमारे अपने टेस्ट में लगभग 95 प्रतिशत और सर्टिफिकेट में 85 प्रतिशत। बैक्टीरियल बनाम वायरल सबसे कमज़ोर हिस्सा है, इसलिए आपका फैसला अंतिम है। कम भरोसे का मतलब अनिश्चित।' },
      { k: ['logout', 'sign out', 'लॉगआउट', 'exit'],
        en: 'Use the Logout button at the top right. Your session also ends by itself after 12 hours.',
        hi: 'ऊपर दाईं तरफ Logout बटन दबाएं। 12 घंटे बाद सेशन अपने आप भी खत्म हो जाता है।' }
    ],
    admin: [
      { k: ['login', 'password', 'पासवर्ड', 'लॉगिन', 'forgot', 'reset', 'बदल', 'change'],
        en: 'Admin logs in with email and password. To reset a doctor password, open the Doctors tab and use the password button for that doctor. Change the default admin password after the first login.',
        hi: 'एडमिन ईमेल और पासवर्ड से लॉगिन करता है। डॉक्टर का पासवर्ड रीसेट करने के लिए Doctors टैब में उस डॉक्टर का पासवर्ड बटन दबाएं। पहले लॉगिन के बाद डिफ़ॉल्ट एडमिन पासवर्ड बदल दें।' },
      { k: ['overview', 'stats', 'dashboard', 'count', 'total', 'ओवरव्यू', 'आंकड़े', 'summary'],
        en: 'The Overview tab shows totals: users, scans, cases, doctors, and chatbot messages, so you can see how the app is being used.',
        hi: 'Overview टैब में कुल यूज़र, स्कैन, केस, डॉक्टर और चैटबॉट मैसेज दिखते हैं, ताकि पता चले ऐप कैसे इस्तेमाल हो रहा है।' },
      { k: ['doctor', 'add', 'create', 'डॉक्टर', 'जोड़', 'नया', 'disable', 'enable', 'active', 'बंद'],
        en: 'In the Doctors tab you can see all doctors and switch an account on or off. To create a new doctor account, run create_doctor.py from the backend folder with name, email and password. A disabled doctor cannot log in.',
        hi: 'Doctors टैब में सभी डॉक्टर दिखते हैं और खाता चालू या बंद कर सकते हैं। नया डॉक्टर बनाने के लिए backend फोल्डर से create_doctor.py नाम, ईमेल और पासवर्ड के साथ चलाएं। बंद किया डॉक्टर लॉगिन नहीं कर सकता।' },
      { k: ['conversation', 'message', 'chat', 'baat', 'बात', 'मैसेज', 'चैट', 'talk', 'doctor patient'],
        en: 'Open the Cases tab and click a case to read the full doctor and patient conversation with the X-ray. The Messages tab lists all of them together.',
        hi: 'Cases टैब में किसी केस पर क्लिक करके एक्स-रे के साथ डॉक्टर और मरीज़ की पूरी बातचीत पढ़ें। Messages टैब में सब एक साथ दिखती हैं।' },
      { k: ['bot', 'chatbot', 'chatlog', 'log', 'चैटबॉट', 'helper', 'robot'],
        en: 'The Chatbot logs tab shows what users asked the helper bot and what it answered. Use it to find questions the bot could not answer and improve it.',
        hi: 'Chatbot logs टैब में दिखता है कि यूज़र ने हेल्पर बॉट से क्या पूछा और उसने क्या जवाब दिया। इससे वे सवाल मिलते हैं जिनका जवाब बॉट नहीं दे पाया, और उसे सुधार सकते हैं।' },
      { k: ['users', 'user', 'patient', 'यूज़र', 'मरीज़', 'history', 'scan', 'स्कैन'],
        en: 'The Users tab lists patients and their scans. Admin can see everything, so please handle this data carefully and only for project work.',
        hi: 'Users टैब में मरीज़ और उनके स्कैन की लिस्ट है। एडमिन सब कुछ देख सकता है, इसलिए यह डेटा सावधानी से और सिर्फ प्रोजेक्ट के काम के लिए इस्तेमाल करें।' },
      { k: ['audit', 'security', 'safe', 'privacy', 'ऑडिट', 'सुरक्षा', 'who', 'kisne'],
        en: 'The Audit tab records who logged in, who viewed or reviewed which case, and when. Staff passwords are stored hashed, and five wrong tries lock an email for five minutes.',
        hi: 'Audit टैब में दर्ज होता है कि किसने लॉगिन किया, किसने कौन सा केस कब देखा या रिव्यू किया। पासवर्ड हैश करके रखे जाते हैं और पांच गलत कोशिश पर ईमेल पांच मिनट के लिए लॉक हो जाता है।' }
    ]
  };
  var COMMON = [
    { k: ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'हेलो', 'हाय', 'hii'],
      en: 'Hello! I am the RespiTrust robot. Ask me anything about this page, in Hindi or English.',
      hi: 'नमस्ते! मैं RespiTrust रोबोट हूं। इस पेज के बारे में हिंदी या English में कुछ भी पूछिए।' },
    { k: ['thank', 'thanks', 'shukriya', 'धन्यवाद', 'शुक्रिया', 'थैंक'],
      en: 'You are welcome! Ask me anything else.', hi: 'आपका स्वागत है! कुछ और पूछना हो तो पूछिए।' },
    { k: ['who are you', 'your name', 'tum kaun', 'कौन हो', 'तुम कौन', 'aap kaun', 'आप कौन', 'naam', 'नाम'],
      en: 'I am the RespiTrust talking robot, made by Team Fourmula Coders of ABES Institute of Technology. I answer from a fixed knowledge list, I am not a generative AI.',
      hi: 'मैं RespiTrust का बोलने वाला रोबोट हूं, ABES Institute of Technology की Team Fourmula Coders ने बनाया है। मैं तय की हुई जानकारी से जवाब देता हूं, मैं जनरेटिव AI नहीं हूं।' },
    { k: ['language', 'bhasha', 'भाषा', 'hindi', 'english', 'हिंदी'],
      en: 'You can talk to me in Hindi or English. Use the EN and Hindi buttons on top of this window, and tap the mic to speak.',
      hi: 'आप मुझसे हिंदी या English में बात कर सकते हैं। इस विंडो के ऊपर EN और हिंदी बटन दबाएं और बोलने के लिए माइक दबाएं।' }
  ];
  var CHIPS = {
    user: [['How do I check an X-ray?', 'एक्स-रे कैसे जांचें?'], ['What do results mean?', 'नतीजे का मतलब?'], ['Send to doctor', 'डॉक्टर को भेजें'], ['Which medicine?', 'कौन सी दवा?']],
    doctor: [['How to claim a case?', 'केस क्लेम कैसे करें?'], ['How to review?', 'रिव्यू कैसे करें?'], ['Patient privacy', 'मरीज़ की प्राइवेसी'], ['Can I trust the AI?', 'क्या AI पर भरोसा करें?']],
    admin: [['Show me what each tab does', 'हर टैब क्या करता है?'], ['Add a doctor', 'डॉक्टर कैसे जोड़ें?'], ['Read conversations', 'बातचीत कैसे पढ़ें?'], ['Chatbot logs', 'चैटबॉट लॉग']]
  };
  var GREET = {
    user: ['Hello! I am your RespiTrust robot. Ask me how to check an X-ray, what the results mean, or how to reach a doctor.', 'नमस्ते! मैं आपका RespiTrust रोबोट हूं। पूछिए कि एक्स-रे कैसे जांचें, नतीजे का क्या मतलब है, या डॉक्टर तक कैसे पहुंचें।'],
    doctor: ['Hello Doctor! I can guide you on claiming cases, reviewing scans and chatting with patients.', 'नमस्ते डॉक्टर! मैं केस क्लेम करने, स्कैन रिव्यू और मरीज़ से चैट में आपकी मदद कर सकता हूं।'],
    admin: ['Hello Admin! I can explain the dashboard, doctors, conversations, chatbot logs and security.', 'नमस्ते एडमिन! मैं डैशबोर्ड, डॉक्टर, बातचीत, चैटबॉट लॉग और सुरक्षा समझा सकता हूं।']
  };

  function norm(s) { return String(s).toLowerCase(); }
  function answer(q) {
    var s = norm(q), best = null, bestScore = 0;
    var list = KB[ROLE].concat(COMMON);
    list.forEach(function (it) {
      var sc = 0;
      it.k.forEach(function (w) { if (s.indexOf(norm(w)) > -1) sc += w.length > 3 ? 2 : 1; });
      if (sc > bestScore) { bestScore = sc; best = it; }
    });
    var hi = DEV.test(q) || lang === 'hi';
    if (!best) {
      return hi ? 'माफ़ कीजिए, यह मुझे पूरी तरह समझ नहीं आया। आप पूछ सकते हैं: ' + CHIPS[ROLE].map(function (c) { return c[1]; }).join(', ') + '।'
                : 'Sorry, I did not fully get that. You can ask: ' + CHIPS[ROLE].map(function (c) { return c[0]; }).join(', ') + '.';
    }
    var out = hi ? best.hi : best.en;
    if (ROLE === 'user' && /medicine|dawai|दवा|दवाई|tablet|antibiotic|dose|treatment|ilaj|इलाज|result|नतीजा|bacteria|virus/.test(s)) out += ' ' + (hi ? DISC.hi : DISC.en);
    return out;
  }


  var st = document.createElement('style');
  st.textContent =
    '#rtRobFab{position:fixed;left:16px;bottom:16px;width:68px;height:68px;border-radius:50%;border:0;padding:0;background:#fff;box-shadow:0 6px 22px rgba(15,42,67,.35);cursor:pointer;z-index:2147483000;display:grid;place-items:center}' +
    '#rtRobFab:hover{transform:scale(1.06)}#rtRobFab svg{width:56px;height:56px}' +
    '#rtRobFab .tip{position:absolute;left:76px;bottom:18px;background:#0F2A43;color:#fff;font:600 12.5px Inter,Segoe UI,sans-serif;padding:6px 10px;border-radius:10px;white-space:nowrap;pointer-events:none}' +
    '#rtRob{position:fixed;left:16px;bottom:96px;width:360px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 14px 50px rgba(15,42,67,.4);z-index:2147483000;display:none;flex-direction:column;overflow:hidden;font:14px Inter,Segoe UI,sans-serif;color:#1F2937}' +
    '#rtRob.open{display:flex}' +
    '#rtRob .hd{background:linear-gradient(120deg,#0E2F52,#0E7C86);color:#fff;padding:10px 12px;display:flex;align-items:center;gap:10px}' +
    '#rtRob .hd svg{width:46px;height:46px;background:#fff;border-radius:50%;flex:none}' +
    '#rtRob .hd .nm{flex:1;min-width:0;line-height:1.2}#rtRob .hd .nm b{display:block;font-size:15px}#rtRob .hd .nm span{font-size:11.5px;opacity:.85}' +
    '#rtRob .hd button{border:1.5px solid #fff;background:transparent;color:#fff;border-radius:999px;padding:2px 9px;font:700 12px Inter,sans-serif;cursor:pointer}' +
    '#rtRob .hd button.on{background:#fff;color:#0E2F52}' +
    '#rtRob .hd .x{border:0;font-size:20px;padding:0 4px}' +
    '#rtRobMsgs{flex:1;overflow:auto;padding:12px;background:#F3F5F8;display:flex;flex-direction:column;gap:8px}' +
    '#rtRobMsgs .m{max-width:88%;padding:8px 11px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}' +
    '#rtRobMsgs .bot{background:#fff;border:1px solid #DCE3EA;align-self:flex-start}' +
    '#rtRobMsgs .me{background:#0E7C86;color:#fff;align-self:flex-end}' +
    '#rtRob .chips{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px 0;background:#F3F5F8}' +
    '#rtRob .chips button{border:1.5px solid #0E7C86;background:#fff;color:#0E7C86;border-radius:999px;padding:3px 10px;font:600 12px Inter,sans-serif;cursor:pointer}' +
    '#rtRob .bar{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#F3F5F8;border-top:1px solid #DCE3EA;font:600 12.5px Inter,sans-serif;color:#334155}' +
    '#rtRob .bar .s{flex:1;min-width:0}' +
    '#rtRob .bar button{border:1.5px solid #0E7C86;background:#fff;color:#0E7C86;border-radius:999px;padding:3px 10px;font:700 12px Inter,sans-serif;cursor:pointer}' +
    '#rtRob .bar button.on{background:#0E7C86;color:#fff}' +
    '#rtRob form{display:flex;gap:6px;padding:8px;border-top:1px solid #DCE3EA}' +
    '#rtRob form input{flex:1;min-width:0;border:1.5px solid #DCE3EA;border-radius:10px;padding:8px 10px;font:14px Inter,sans-serif}' +
    '#rtRob form button{border:0;border-radius:10px;padding:0 12px;font:700 14px Inter,sans-serif;cursor:pointer;background:#0E7C86;color:#fff}' +
    '#rtRob form #rtRobMic{background:#fff;color:#0E7C86;border:1.5px solid #0E7C86;width:44px;display:grid;place-items:center;padding:0}' +
    '#rtRob form #rtRobMic svg{width:22px;height:22px}' +
    '#rtRob form #rtRobMic.on{background:#B3261E;border-color:#B3261E;color:#fff;animation:rtRobP 1.1s infinite}' +
    '@keyframes rtRobP{0%{box-shadow:0 0 0 0 rgba(179,38,30,.5)}100%{box-shadow:0 0 0 12px rgba(179,38,30,0)}}' +
    '.rtbot .eye{animation:rtBlink 4s infinite;transform-origin:center;transform-box:fill-box}' +
    '@keyframes rtBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
    '.rtbot.talk .mouth{animation:rtTalk .22s infinite alternate;transform-origin:center;transform-box:fill-box}' +
    '@keyframes rtTalk{from{transform:scaleY(.4)}to{transform:scaleY(1.6)}}' +
    '.rtbot.listen .ant{fill:#B3261E}.rtbot .ant{fill:#0E7C86}' +
    '@media(max-width:480px){#rtRob{left:8px;bottom:90px;width:calc(100vw - 16px)}}';
  document.head.appendChild(st);

  var BOT = '<svg class="rtbot" viewBox="0 0 64 64" aria-hidden="true">' +
    '<line x1="32" y1="6" x2="32" y2="13" stroke="#0F2A43" stroke-width="2.5"/><circle class="ant" cx="32" cy="5" r="3.5"/>' +
    '<rect x="10" y="13" width="44" height="38" rx="12" fill="#E8F1F6" stroke="#0F2A43" stroke-width="2.5"/>' +
    '<rect x="4" y="26" width="6" height="12" rx="3" fill="#0F2A43"/><rect x="54" y="26" width="6" height="12" rx="3" fill="#0F2A43"/>' +
    '<ellipse class="eye" cx="24" cy="30" rx="4.5" ry="5.5" fill="#0F2A43"/><ellipse class="eye" cx="40" cy="30" rx="4.5" ry="5.5" fill="#0F2A43"/>' +
    '<circle cx="25.5" cy="28" r="1.5" fill="#fff"/><circle cx="41.5" cy="28" r="1.5" fill="#fff"/>' +
    '<rect class="mouth" x="25" y="40" width="14" height="4" rx="2" fill="#0E7C86"/>' +
    '<circle cx="17" cy="40" r="2.6" fill="#F4A6A0" opacity=".7"/><circle cx="47" cy="40" r="2.6" fill="#F4A6A0" opacity=".7"/>' +
    '<rect x="22" y="52" width="20" height="8" rx="3" fill="#0E7C86"/></svg>';

  
  var fab, panel, msgs, input, statusEl, spkBtn, micBtn;
  function bots() { return Array.prototype.slice.call(document.querySelectorAll('.rtbot')); }
  function setFace(cls, on) { bots().forEach(function (b) { b.classList.toggle(cls, on); }); }
  function setStatus(s) {
    if (!statusEl) return;
    statusEl.textContent = s || (SR ? T('Tap the mic and talk', 'माइक दबाकर बोलिए') : T('Voice input needs Chrome or Edge', 'वॉइस इनपुट के लिए Chrome या Edge चाहिए'));
  }
  function add(cls, text) {
    var d = document.createElement('div'); d.className = 'm ' + cls; d.textContent = text;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; return d;
  }

 
  var voices = [];
  function loadVoices() { if (synth) voices = synth.getVoices() || []; }
  if (synth) { loadVoices(); if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); }
  function pickVoice(l) {
    var want = l === 'hi' ? 'hi' : 'en-in';
    var v = voices.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf(want) === 0; })[0];
    if (!v && l !== 'hi') v = voices.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf('en') === 0; })[0];
    return v || null;
  }
  function say(text) {
    if (!synth || !text) return;
    synth.cancel();
    var l = DEV.test(text) ? 'hi' : 'en';
    var parts = text.match(/[^.।!?]+[.।!?]*/g) || [text], chunks = [], cur = '';
    parts.forEach(function (p) { if ((cur + p).length > 180) { if (cur) chunks.push(cur); cur = p; } else cur += p; });
    if (cur) chunks.push(cur);
    var i = 0;
    function done() { setFace('talk', false); setStatus(); }
    function next() {
      if (i >= chunks.length) return done();
      var u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = l === 'hi' ? 'hi-IN' : 'en-IN';
      var v = pickVoice(l); if (v) u.voice = v;
      u.rate = 0.95; u.onend = next; u.onerror = done;
      synth.speak(u);
    }
    setFace('talk', true); setStatus(T('Speaking…', 'बोल रहा हूं…'));
    next();
  }
  function stopSpeaking() { if (synth) synth.cancel(); setFace('talk', false); }

  function reply(q, forceSpeak) {
    add('me', q);
    var a = answer(q);
    var d = add('bot', a);
    if (speakOn || forceSpeak) say(a);
    return d;
  }

  
  var rec = null, listening = false;
  function stopListening() {
    if (rec) { try { rec.abort(); } catch (e) {} }
    listening = false; micBtn.classList.remove('on'); setFace('listen', false);
  }
  function startListening() {
    if (!SR) { setStatus(T('Voice input is not supported here. Please use Chrome or Edge.', 'यहां वॉइस इनपुट नहीं चलता। कृपया Chrome या Edge इस्तेमाल करें।')); return; }
    stopSpeaking();
    if (listening) { stopListening(); setStatus(); return; }
    rec = new SR();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    var fin = '';
    rec.onstart = function () { listening = true; micBtn.classList.add('on'); setFace('listen', true); setStatus(T('Listening… speak now', 'सुन रहा हूं… बोलिए')); };
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += tr; else interim += tr;
      }
      input.value = (fin + ' ' + interim).trim();
    };
    rec.onerror = function (e) {
      listening = false; micBtn.classList.remove('on'); setFace('listen', false);
      setStatus(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? T('Microphone is blocked. Allow the mic in the address bar and try again.', 'माइक बंद है। एड्रेस बार में माइक की अनुमति दें और फिर कोशिश करें।')
        : e.error === 'no-speech' ? T('I heard nothing. Tap the mic and try again.', 'कुछ सुनाई नहीं दिया। माइक दबाकर फिर बोलिए।')
        : e.error === 'network' ? T('Voice needs internet in Chrome.', 'Chrome में वॉइस के लिए इंटरनेट चाहिए।')
        : T('Voice error: ', 'वॉइस में दिक्कत: ') + e.error);
    };
    rec.onend = function () {
      var was = listening; listening = false; micBtn.classList.remove('on'); setFace('listen', false);
      var q = input.value.trim();
      if (was && q) { input.value = ''; reply(q, true); }   // spoken question gets a spoken answer
      else if (was) setStatus(T('I did not catch that. Try again.', 'समझ नहीं आया। फिर बोलिए।'));
    };
    try { rec.start(); } catch (e) { setStatus(String(e)); }
  }


  function chipsRender(box) {
    box.textContent = '';
    CHIPS[ROLE].forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = T(c[0], c[1]);
      b.addEventListener('click', function () { reply(b.textContent, false); });
      box.appendChild(b);
    });
  }
  function labels() {
    $('#rtRobEn').classList.toggle('on', lang === 'en');
    $('#rtRobHi').classList.toggle('on', lang === 'hi');
    spkBtn.textContent = (speakOn ? '🔊 ' : '🔇 ') + T('Voice on', 'आवाज़ चालू');
    spkBtn.classList.toggle('on', speakOn);
    $('#rtRobStop').textContent = '⏹ ' + T('Stop', 'रोकें');
    input.placeholder = T('Type or tap the mic…', 'लिखें या माइक दबाएं…');
    $('#rtRob .nm span').textContent = ROLE === 'doctor' ? T('Doctor helper', 'डॉक्टर सहायक') : ROLE === 'admin' ? T('Admin helper', 'एडमिन सहायक') : T('Patient helper', 'मरीज़ सहायक');
    chipsRender($('#rtRob .chips'));
    if (!listening && !(synth && synth.speaking)) setStatus();
  }
  function setLang(l) {
    lang = l; store(LK, l); stopSpeaking(); stopListening(); labels();
    var g = GREET[ROLE]; var t = l === 'hi' ? g[1] : g[0];
    add('bot', t); if (speakOn) say(t);
  }
  var greeted = false;
  function open() {
    panel.classList.add('open'); var tip = $('.tip', fab); if (tip) tip.remove();
    if (!greeted) { greeted = true; var g = GREET[ROLE]; var t = T(g[0], g[1]); add('bot', t); if (speakOn) say(t); }
    setTimeout(function () { input.focus(); }, 50);
  }
  function close() { panel.classList.remove('open'); stopSpeaking(); stopListening(); }

  function build() {
    fab = document.createElement('button');
    fab.id = 'rtRobFab'; fab.type = 'button'; fab.setAttribute('aria-label', 'Talk to the robot');
    fab.innerHTML = BOT + '<span class="tip">' + T('Talk to me! 🎤', 'मुझसे बात करें! 🎤') + '</span>';
    panel = document.createElement('div'); panel.id = 'rtRob'; panel.setAttribute('role', 'dialog');
    panel.innerHTML =
      '<div class="hd">' + BOT + '<div class="nm"><b>RespiTrust Robot</b><span></span></div>' +
      '<button type="button" id="rtRobEn">EN</button><button type="button" id="rtRobHi">हिंदी</button><button type="button" class="x" id="rtRobX" aria-label="Close">×</button></div>' +
      '<div id="rtRobMsgs"></div><div class="chips"></div>' +
      '<div class="bar"><span class="s"></span><button type="button" id="rtRobSpk"></button><button type="button" id="rtRobStop"></button></div>' +
      '<form><button type="button" id="rtRobMic" aria-label="Speak"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg></button>' +
      '<input id="rtRobIn" autocomplete="off" maxlength="300"><button type="submit">➤</button></form>';
    document.body.appendChild(fab); document.body.appendChild(panel);
    msgs = $('#rtRobMsgs'); input = $('#rtRobIn'); statusEl = $('#rtRob .bar .s'); spkBtn = $('#rtRobSpk'); micBtn = $('#rtRobMic');
    fab.addEventListener('click', function () { panel.classList.contains('open') ? close() : open(); });
    $('#rtRobX').addEventListener('click', close);
    $('#rtRobEn').addEventListener('click', function () { setLang('en'); });
    $('#rtRobHi').addEventListener('click', function () { setLang('hi'); });
    spkBtn.addEventListener('click', function () { speakOn = !speakOn; store(SK, speakOn ? '1' : '0'); if (!speakOn) stopSpeaking(); labels(); });
    $('#rtRobStop').addEventListener('click', function () { stopSpeaking(); stopListening(); setStatus(); });
    micBtn.addEventListener('click', startListening);
    $('#rtRob form').addEventListener('submit', function (e) {
      e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = ''; reply(q, false);
    });
    labels();
    window.addEventListener('beforeunload', stopSpeaking);
    setTimeout(function () { var t = $('.tip', fab); if (t) t.remove(); }, 9000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
