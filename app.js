// Milo the Robot — Interactive Face Engine & Gemini Command Simulator

const EMOTIONS = {
  neutral: {
    title: "Normal",
    primary: "#72DDF7",
    secondary: "#A7F3FF",
    glow: "rgba(114, 221, 247, 0.30)",
    speech: "Merhaba! Ben Milo. Masaüstünde seni dinliyor ve etrafı takip ediyorum.",
    state: "DİNLİYOR • GEMINI 2.5 FLASH"
  },
  veryHappy: {
    title: "Çok mutlu",
    primary: "#FFE66D",
    secondary: "#FF9F1C",
    glow: "rgba(255, 230, 109, 0.32)",
    speech: "Harika bir haber! Bugün tüm görevlerini tamamladık, kutlama dansı yapıyorum!",
    state: "MOTOR: DANS • NEŞELİ"
  },
  happy: {
    title: "Mutlu",
    primary: "#00D4AA",
    secondary: "#55E6C1",
    glow: "rgba(0, 212, 170, 0.30)",
    speech: "Toplantın saat 14:30'da takvime eklendi ve hatırlatıcın kuruldu.",
    state: "TAKVİM GÜNCELLENDİ"
  },
  listening: {
    title: "Dinliyor",
    primary: "#7AFBFF",
    secondary: "#00D4AA",
    glow: "rgba(122, 251, 255, 0.34)",
    speech: "Seni dinliyorum... 'Elimde ne var?' veya 'Anneme mesaj at' diyebilirsin.",
    state: "MİKROFON AKTİF • TÜRKÇE ASR"
  },
  thoughtful: {
    title: "Düşünceli",
    primary: "#B794F4",
    secondary: "#7B61FF",
    glow: "rgba(183, 148, 244, 0.32)",
    speech: "Kameradan elindeki nesneyi ve Google Drive notlarını karşılaştırıyorum...",
    state: "DÜŞÜNÜYOR • MULTIMODAL ANALİZ"
  },
  surprised: {
    title: "Şaşırmış",
    primary: "#FFB800",
    secondary: "#FFD166",
    glow: "rgba(255, 184, 0, 0.32)",
    speech: "Vay canına! Elinde yeni bir ESP32 prototip kartı tutuyorsun!",
    state: "GÖRSEL TESPİT • KAMERA AKTİF"
  },
  sad: {
    title: "Üzgün",
    primary: "#5B8FF9",
    secondary: "#9EC5FF",
    glow: "rgba(91, 143, 249, 0.28)",
    speech: "Dışarıda sağanak yağmur başlıyor, şemsiyeni almayı unutma lütfen.",
    state: "HAVA DURUMU UYARISI"
  },
  angry: {
    title: "Kızgın",
    primary: "#FF4560",
    secondary: "#FF7A59",
    glow: "rgba(255, 69, 96, 0.30)",
    speech: "Pil seviyem kritik sınıra yaklaşıyor! Beni şarja takmazsan kilitleneceğim.",
    state: "VOLTAJ KORUMA UYARISI"
  },
  sleeping: {
    title: "Uyuyor",
    primary: "#3A4A6B",
    secondary: "#1A2340",
    glow: "rgba(58, 74, 107, 0.24)",
    speech: "Zzz... Uyku modundayım. Uyandırmak için ekrana dokun veya seslen.",
    state: "UYKU MODU • DÜŞÜK GÜÇ"
  }
};

const COMMAND_SCENARIOS = [
  {
    id: "vision",
    utterance: "“Milo, şu an elimde ne var? Bakıp anlatır mısın?”",
    tag: "analyzeCamera",
    toolCall: 'analyzeCamera(question: "Elimde ne var?")',
    emotion: "surprised",
    motorSteps: [
      { cmd: "STOP (S)", ms: 100 },
      { cmd: "FORWARD (F)", ms: 260 }
    ],
    response: "Kameradan baktım! Elinde siyah kılıflı bir AirPods kutusu ve yanında kahve kupası tutuyorsun."
  },
  {
    id: "calendar",
    utterance: "“Yarın sabah 10:00’a Ürün Lansmanı toplantısı ekle ve 08:30’a alarm kur.”",
    tag: "Calendar + AlarmKit",
    toolCall: 'createCalendarEvent(title: "Ürün Lansmanı", startDate: "2026-11-15T10:00") + setAlarm(time: "08:30")',
    emotion: "happy",
    motorSteps: [
      { cmd: "LEFT (L)", ms: 220 },
      { cmd: "RIGHT (R)", ms: 220 }
    ],
    response: "Yarın 10:00 için 'Ürün Lansmanı' takvime eklendi (15 dk önce bildirimli) ve 08:30 Milo alarmın kuruldu!"
  },
  {
    id: "whatsapp",
    utterance: "“Ahmet’e WhatsApp’tan ‘Robotiğin yeni yüzü Milo hazır!’ diye mesaj yaz.”",
    tag: "Contacts + WhatsApp",
    toolCall: 'searchContacts(query: "Ahmet") → sendWhatsAppMessage(contactOrNumber: "Ahmet", message: "Robotiğin yeni yüzü Milo hazır!")',
    emotion: "veryHappy",
    motorSteps: [
      { cmd: "FORWARD (F)", ms: 320 },
      { cmd: "LEFT (L)", ms: 180 },
      { cmd: "RIGHT (R)", ms: 180 }
    ],
    response: "Rehberde Ahmet Yılmaz'ı buldum. WhatsApp sohbetini mesaj taslağın hazır olarak açtım, tek dokunuşla gönderebilirsin."
  },
  {
    id: "workspace",
    utterance: "“Son gelen önemli e-postamı özetle ve selfie çekip Google Drive’a kaydet.”",
    tag: "Gmail + Drive",
    toolCall: 'listUnreadEmails(limit: 1) + takePhotoAndUploadToDrive(folder: "Milo Selfies")',
    emotion: "listening",
    motorSteps: [
      { cmd: "BACKWARD (B)", ms: 240 },
      { cmd: "STOP (S)", ms: 120 }
    ],
    response: "Sol gözümü kamera lensine dönüştürdüm, 3-2-1 çektim! Fotoğrafın galeriye ve Google Drive'a yüklendi."
  },
  {
    id: "netgsm",
    utterance: "“Ekibe Netgsm üzerinden ‘Milo sunucusu aktif’ SMS’i gönder ve feneri aç.”",
    tag: "Netgsm + Cihaz",
    toolCall: 'sendNetgsmSMS(group: "Ekip", text: "Milo sunucusu aktif") + setFlashlight(on: true)',
    emotion: "thoughtful",
    motorSteps: [
      { cmd: "RIGHT (R)", ms: 300 },
      { cmd: "LEFT (L)", ms: 300 }
    ],
    response: "iPhone'un flaş fenerini açtım ve Netgsm bulut entegrasyonuyla ekip numaralarına bilgilendirme SMS'ini ilettim."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const screenEl = document.getElementById("milo-screen");
  const emoTitleEl = document.getElementById("hud-emotion-title");
  const speechBubbleEl = document.getElementById("ai-speech-bubble");
  const stateCapsuleEl = document.getElementById("hud-state-text");
  const leftEye = document.getElementById("eye-left");
  const rightEye = document.getElementById("eye-right");
  const mouthEl = document.getElementById("milo-mouth");
  const emoButtons = document.querySelectorAll(".emo-btn");
  const trackingBtn = document.getElementById("toggle-tracking-btn");
  const speakBtn = document.getElementById("trigger-speak-btn");
  const autoCycleBtn = document.getElementById("toggle-autocycle-btn");
  const splitContainer = document.getElementById("face-body-split");

  let currentEmotionKey = "neutral";
  let autoCycleTimer = null;
  let isAutoCycling = true;

  function setEmotion(key) {
    const data = EMOTIONS[key];
    if (!data) return;
    currentEmotionKey = key;

    // Update CSS Custom Properties dynamically on :root and screen
    root.style.setProperty("--emo-primary", data.primary);
    root.style.setProperty("--emo-secondary", data.secondary);
    root.style.setProperty("--emo-glow", data.glow);

    screenEl.setAttribute("data-emotion", key);
    emoTitleEl.textContent = data.title;
    speechBubbleEl.textContent = data.speech;
    stateCapsuleEl.textContent = data.state;

    emoButtons.forEach((btn) => {
      const active = btn.dataset.emotion === key;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  // Emotion switcher click handlers
  emoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      stopAutoCycle();
      setEmotion(btn.dataset.emotion);
    });
  });

  // Toggle ARKit Eye Tracking split panel
  if (trackingBtn && splitContainer) {
    trackingBtn.addEventListener("click", () => {
      const isOpen = splitContainer.classList.toggle("tracking-open");
      trackingBtn.setAttribute("aria-pressed", isOpen ? "true" : "false");
      const labelSpan = trackingBtn.querySelector(".tracking-label");
      if (labelSpan) {
        labelSpan.textContent = isOpen ? "TAKİP AÇIK" : "TAKİP";
      }
    });
  }

  // Cute Robot Voice / Mouth animation simulation
  if (speakBtn && mouthEl) {
    speakBtn.addEventListener("click", () => {
      speakBtn.setAttribute("aria-pressed", "true");
      stateCapsuleEl.textContent = "KONUŞUYOR • DSP SES SENTEZİ";
      let ticks = 0;
      const interval = setInterval(() => {
        mouthEl.classList.toggle("speaking");
        ticks += 1;
        if (ticks >= 10) {
          clearInterval(interval);
          mouthEl.classList.remove("speaking");
          speakBtn.setAttribute("aria-pressed", "false");
          stateCapsuleEl.textContent = EMOTIONS[currentEmotionKey].state;
        }
      }, 160);
    });
  }

  // Natural blinking loop (respects reduced motion)
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReducedMotion && leftEye && rightEye) {
    setInterval(() => {
      if (currentEmotionKey === "sleeping") return;
      leftEye.classList.add("blinking");
      rightEye.classList.add("blinking");
      setTimeout(() => {
        leftEye.classList.remove("blinking");
        rightEye.classList.remove("blinking");
      }, 110);
    }, 3200);
  }

  // Auto-cycle emotions with Accessible Pause/Play button (WCAG 2.2.2 compliant)
  const emotionOrder = Object.keys(EMOTIONS);
  let cycleIdx = 0;

  function startAutoCycle() {
    if (prefersReducedMotion) {
      isAutoCycling = false;
      updateAutoCycleButton();
      return;
    }
    isAutoCycling = true;
    updateAutoCycleButton();
    clearInterval(autoCycleTimer);
    autoCycleTimer = setInterval(() => {
      cycleIdx = (cycleIdx + 1) % emotionOrder.length;
      setEmotion(emotionOrder[cycleIdx]);
    }, 4200);
  }

  function stopAutoCycle() {
    isAutoCycling = false;
    clearInterval(autoCycleTimer);
    updateAutoCycleButton();
  }

  function updateAutoCycleButton() {
    if (!autoCycleBtn) return;
    // Per Modern Web Guidance `motion`: when button text switches between Pause and Play, do NOT set aria-pressed
    autoCycleBtn.textContent = isAutoCycling ? "⏸ Otomatik Duygu: Duraklat" : "▶ Otomatik Duygu: Oynat";
  }

  if (autoCycleBtn) {
    autoCycleBtn.addEventListener("click", () => {
      if (isAutoCycling) {
        stopAutoCycle();
      } else {
        startAutoCycle();
      }
    });
  }

  startAutoCycle();

  // Command Playground Simulator
  const promptButtons = document.querySelectorAll(".prompt-btn");
  const termTool = document.getElementById("term-tool");
  const termEmotion = document.getElementById("term-emotion");
  const termMotors = document.getElementById("term-motors");
  const termSpeech = document.getElementById("term-speech");

  function renderScenario(index) {
    const item = COMMAND_SCENARIOS[index];
    if (!item) return;

    promptButtons.forEach((b, idx) => {
      b.setAttribute("aria-selected", idx === index ? "true" : "false");
    });

    if (termTool) termTool.textContent = item.toolCall;
    if (termEmotion) {
      const emoObj = EMOTIONS[item.emotion];
      termEmotion.textContent = `${item.emotion} (${emoObj ? emoObj.title : ""})`;
    }
    if (termMotors) {
      termMotors.innerHTML = "";
      item.motorSteps.forEach((step) => {
        const span = document.createElement("span");
        span.className = "motor-chip";
        span.textContent = `${step.cmd} • ${step.ms}ms`;
        termMotors.appendChild(span);
      });
    }
    if (termSpeech) termSpeech.textContent = item.response;

    // Also reflect emotion on Milo's hero face
    stopAutoCycle();
    setEmotion(item.emotion);
  }

  promptButtons.forEach((btn, idx) => {
    btn.addEventListener("click", () => renderScenario(idx));
  });

  // Modal Dialog (`<dialog>`) for Architecture Specs
  const openModalBtn = document.getElementById("open-arch-modal");
  const archDialog = document.getElementById("arch-dialog");
  if (openModalBtn && archDialog) {
    openModalBtn.addEventListener("click", () => {
      archDialog.showModal();
    });
  }
});
