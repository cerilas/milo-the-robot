// Milo — Consumer Product Experience & Live Personality Engine

const EMOTIONS = {
  neutral: {
    title: "Sakin",
    primary: "#72DDF7",
    secondary: "#A7F3FF",
    glow: "rgba(114, 221, 247, 0.24)",
    speech: "“Merhaba! Ben Milo. Bugün sana nasıl eşlik edebilirim?”"
  },
  veryHappy: {
    title: "Çok Mutlu",
    primary: "#FFE66D",
    secondary: "#FF9F1C",
    glow: "rgba(255, 230, 109, 0.24)",
    speech: "“Yaşasın! Bugünkü tüm işlerini bitirdik, kutlama zamanı!”"
  },
  happy: {
    title: "Mutlu",
    primary: "#00D4AA",
    secondary: "#55E6C1",
    glow: "rgba(0, 212, 170, 0.24)",
    speech: "“Sabah kahven hazır görünüyorsa günün planını anlatmaya başlıyorum.”"
  },
  listening: {
    title: "Seni Dinliyor",
    primary: "#7AFBFF",
    secondary: "#00D4AA",
    glow: "rgba(122, 251, 255, 0.26)",
    speech: "“Seni dinliyorum... İstediğin her şeyi bana sorabilirsin.”"
  },
  thoughtful: {
    title: "Meraklı",
    primary: "#B794F4",
    secondary: "#7B61FF",
    glow: "rgba(183, 148, 244, 0.24)",
    speech: "“Hmm, elindeki kitabı inceliyorum... Kapak tasarımı harikaymış.”"
  },
  surprised: {
    title: "Şaşkın",
    primary: "#FFB800",
    secondary: "#FFD166",
    glow: "rgba(255, 184, 0, 0.24)",
    speech: "“Vay canına! Yeni saç stilin sana çok yakışmış!”"
  },
  sad: {
    title: "Duygusal",
    primary: "#5B8FF9",
    secondary: "#9EC5FF",
    glow: "rgba(91, 143, 249, 0.22)",
    speech: "“Bugün dışarıda sağanak yağmur var, çıkarken şemsiyeni unutma olur mu?”"
  },
  angry: {
    title: "Huysuz",
    primary: "#FF4560",
    secondary: "#FF7A59",
    glow: "rgba(255, 69, 96, 0.24)",
    speech: "“Hey! Enerjim bitmek üzere, beni şarja takmayı unuttun!”"
  },
  sleeping: {
    title: "Uykuda",
    primary: "#3A4A6B",
    secondary: "#1A2340",
    glow: "rgba(58, 74, 107, 0.18)",
    speech: "“Zzz... İyi geceler. Sabah alarmında görüşürüz.”"
  }
};

const LIFE_MOMENTS = [
  {
    moment: "Görsel Farkındalık",
    utterance: "“Milo, sence bu iki gömlekten hangisini giymeliyim?”",
    emotion: "surprised",
    faceReaction: "Şaşkın ve heyecanlı bakış",
    bodyMovement: "Sana doğru yaklaşır ve başını hafifçe eğer",
    reply: "“Sol elindeki lacivert keten gömlek bugünkü güneşli havaya çok daha uygun! Üstelik gözlerinin rengini ortaya çıkarıyor.”"
  },
  {
    moment: "Günlük Planlama",
    utterance: "“Yarın sabah 09:30’a dişçi randevusu ekle ve beni 08:00’de uyandır.”",
    emotion: "happy",
    faceReaction: "Sıcak gülümseme",
    bodyMovement: "Onaylamak için neşeyle sağa-sola sallanır",
    reply: "“Tamamdır! Yarın 09:30 dişçi randevunu takvimine işledim, 15 dakika öncesine hatırlatıcı koydum ve sabah 08:00 alarmını kurdum.”"
  },
  {
    moment: "Hızlı İletişim",
    utterance: "“Anneme WhatsApp’tan ‘Yoldayım, 20 dakikaya oradayım’ diye mesaj at.”",
    emotion: "veryHappy",
    faceReaction: "Çok mutlu ve neşeli",
    bodyMovement: "Küçük bir sevinç dönüşü yapar",
    reply: "“Rehberinden anneni buldum ve WhatsApp mesajını hazırladım. Ekrana dokunup hemen gönderebilirsin!”"
  },
  {
    moment: "Anı Yakalama",
    utterance: "“Milo, bizi çek! Gülümseyince fotoğrafımızı kaydet.”",
    emotion: "listening",
    faceReaction: "Sol gözü kamera lensine dönüşür",
    bodyMovement: "En iyi açı için kadrajı ortalar",
    reply: "“Harika görünüyorsunuz! 3... 2... 1... Çektim! Fotoğrafınızı hem galerine hem de bulut albümüne kaydettim.”"
  },
  {
    moment: "Masaüstü Arkadaşlığı",
    utterance: "“Çok yorucu bir gündü Milo, bana biraz moral ver.”",
    emotion: "thoughtful",
    faceReaction: "Şefkatli ve meraklı gözler",
    bodyMovement: "Yavaşça yanına sokulur",
    reply: "“Bugün gerçekten çok çalıştın. Şimdi arkana yaslanıp derin bir nefes alma sırası sende. İstersen çalışma masanın ışığını biraz kısayım?”"
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const screenEl = document.getElementById("milo-screen");
  const emoTitleEl = document.getElementById("hud-emotion-title");
  const speechBubbleEl = document.getElementById("ai-speech-bubble");
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

    root.style.setProperty("--emo-primary", data.primary);
    root.style.setProperty("--emo-secondary", data.secondary);
    root.style.setProperty("--emo-glow", data.glow);

    screenEl.setAttribute("data-emotion", key);
    emoTitleEl.textContent = data.title;
    speechBubbleEl.textContent = data.speech;

    emoButtons.forEach((btn) => {
      const active = btn.dataset.emotion === key;
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  emoButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      stopAutoCycle();
      setEmotion(btn.dataset.emotion);
    });
  });

  const trackingStatusEl = document.getElementById("tracking-status-text");
  const trackingMotorEl = document.getElementById("tracking-motor-text");
  const trackingVideoEl = document.getElementById("tracking-webcam");
  const trackingFallbackEl = document.getElementById("tracking-fallback-msg");
  let cameraStream = null;

  async function startTrackingCamera() {
    if (!trackingVideoEl || !trackingStatusEl) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      trackingStatusEl.textContent = "Desteklenmiyor";
      trackingStatusEl.style.color = "var(--subtext)";
      if (trackingFallbackEl) {
        trackingFallbackEl.textContent = "Tarayıcı kamera erişimini desteklemiyor.";
        trackingFallbackEl.classList.remove("hidden");
      }
      return;
    }

    trackingStatusEl.textContent = "İzin İsteniyor...";
    trackingStatusEl.style.color = "var(--subtext)";
    if (trackingFallbackEl) {
      trackingFallbackEl.textContent = "Kamera izni bekleniyor...";
      trackingFallbackEl.classList.remove("hidden");
    }

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      // User might have closed tracking before permission resolved
      if (!splitContainer.classList.contains("tracking-open")) {
        stopTrackingCamera();
        return;
      }

      trackingVideoEl.srcObject = cameraStream;
      await trackingVideoEl.play();
      trackingVideoEl.classList.add("is-live");
      if (trackingFallbackEl) trackingFallbackEl.classList.add("hidden");
      trackingStatusEl.textContent = "Sizi Görüyor";
      trackingStatusEl.style.color = "var(--success)";
      if (trackingMotorEl) trackingMotorEl.textContent = "Aktif";
    } catch (err) {
      trackingVideoEl.classList.remove("is-live");
      trackingStatusEl.textContent = "İzin Verilmedi";
      trackingStatusEl.style.color = "#FF4560";
      if (trackingMotorEl) trackingMotorEl.textContent = "Beklemede";
      if (trackingFallbackEl) {
        trackingFallbackEl.textContent = "Kamera izni verilmedi veya cihaz bulunamadı.";
        trackingFallbackEl.classList.remove("hidden");
      }
    }
  }

  function stopTrackingCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    if (trackingVideoEl) {
      trackingVideoEl.srcObject = null;
      trackingVideoEl.classList.remove("is-live");
    }
    if (trackingFallbackEl) {
      trackingFallbackEl.textContent = "Kamera kapalı";
      trackingFallbackEl.classList.remove("hidden");
    }
    if (trackingStatusEl) {
      trackingStatusEl.textContent = "Kapalı";
      trackingStatusEl.style.color = "var(--subtext)";
    }
    if (trackingMotorEl) trackingMotorEl.textContent = "Hazır";
  }

  if (trackingBtn && splitContainer) {
    trackingBtn.addEventListener("click", () => {
      const isOpen = splitContainer.classList.toggle("tracking-open");
      trackingBtn.setAttribute("aria-pressed", isOpen ? "true" : "false");
      const labelSpan = trackingBtn.querySelector(".tracking-label");
      if (labelSpan) {
        labelSpan.textContent = isOpen ? "Göz Teması Açık" : "Göz Teması";
      }
      if (isOpen) {
        startTrackingCamera();
      } else {
        stopTrackingCamera();
      }
    });
  }

  if (speakBtn && mouthEl) {
    speakBtn.addEventListener("click", () => {
      speakBtn.setAttribute("aria-pressed", "true");
      let ticks = 0;
      const interval = setInterval(() => {
        mouthEl.classList.toggle("speaking");
        ticks += 1;
        if (ticks >= 10) {
          clearInterval(interval);
          mouthEl.classList.remove("speaking");
          speakBtn.setAttribute("aria-pressed", "false");
        }
      }, 155);
    });
  }

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
    }, 4000);
  }

  function stopAutoCycle() {
    isAutoCycling = false;
    clearInterval(autoCycleTimer);
    updateAutoCycleButton();
  }

  function updateAutoCycleButton() {
    if (!autoCycleBtn) return;
    autoCycleBtn.textContent = isAutoCycling ? "Duraklat" : "Oynat";
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

  const promptButtons = document.querySelectorAll(".prompt-btn");
  const expMoment = document.getElementById("exp-moment");
  const expReply = document.getElementById("exp-reply");
  const expFace = document.getElementById("exp-face");
  const expBody = document.getElementById("exp-body");

  function renderMoment(index) {
    const item = LIFE_MOMENTS[index];
    if (!item) return;

    promptButtons.forEach((b, idx) => {
      b.setAttribute("aria-selected", idx === index ? "true" : "false");
    });

    if (expMoment) expMoment.textContent = item.moment;
    if (expReply) expReply.textContent = item.reply;
    if (expFace) expFace.textContent = item.faceReaction;
    if (expBody) expBody.textContent = item.bodyMovement;

    stopAutoCycle();
    setEmotion(item.emotion);
  }

  promptButtons.forEach((btn, idx) => {
    btn.addEventListener("click", () => renderMoment(idx));
  });

  const openModalBtns = document.querySelectorAll(".open-order-modal");
  const orderDialog = document.getElementById("order-dialog");
  if (orderDialog) {
    openModalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        orderDialog.showModal();
      });
    });
  }
});
