// Milo — Consumer Product Experience, Live Personality & Bilingual (TR/EN) Engine

const EMOTION_COLORS = {
  neutral:    { primary: "#72DDF7", secondary: "#A7F3FF", glow: "rgba(114, 221, 247, 0.24)" },
  veryHappy:  { primary: "#FFE66D", secondary: "#FF9F1C", glow: "rgba(255, 230, 109, 0.24)" },
  happy:      { primary: "#00D4AA", secondary: "#55E6C1", glow: "rgba(0, 212, 170, 0.24)" },
  listening:  { primary: "#7AFBFF", secondary: "#00D4AA", glow: "rgba(122, 251, 255, 0.26)" },
  thoughtful: { primary: "#B794F4", secondary: "#7B61FF", glow: "rgba(183, 148, 244, 0.24)" },
  surprised:  { primary: "#FFB800", secondary: "#FFD166", glow: "rgba(255, 184, 0, 0.24)" },
  sad:        { primary: "#5B8FF9", secondary: "#9EC5FF", glow: "rgba(91, 143, 249, 0.22)" },
  angry:      { primary: "#FF4560", secondary: "#FF7A59", glow: "rgba(255, 69, 96, 0.24)" },
  sleeping:   { primary: "#3A4A6B", secondary: "#1A2340", glow: "rgba(58, 74, 107, 0.18)" }
};

function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, part) => (acc !== undefined && acc !== null ? acc[part] : undefined), obj);
}

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
  const langToggleBtn = document.getElementById("lang-toggle");

  const trackingStatusEl = document.getElementById("tracking-status-text");
  const trackingMotorEl = document.getElementById("tracking-motor-text");
  const trackingVideoEl = document.getElementById("tracking-webcam");
  const trackingFallbackEl = document.getElementById("tracking-fallback-msg");

  const promptButtons = document.querySelectorAll(".prompt-btn");
  const expMoment = document.getElementById("exp-moment");
  const expReply = document.getElementById("exp-reply");
  const expFace = document.getElementById("exp-face");
  const expBody = document.getElementById("exp-body");

  let currentLang = localStorage.getItem("milo-lang") === "en" ? "en" : "tr";
  let currentEmotionKey = "neutral";
  let currentMomentIdx = 0;
  let autoCycleTimer = null;
  let isAutoCycling = true;
  let cameraStream = null;
  let trackingState = "closed"; // closed | requesting | active | denied | unsupported

  function t() {
    return window.MILO_I18N[currentLang];
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("milo-lang", lang);
    const dict = t();

    document.documentElement.lang = lang;
    document.title = dict.pageTitle;

    if (langToggleBtn) {
      langToggleBtn.textContent = lang === "tr" ? "EN" : "TR";
      langToggleBtn.setAttribute(
        "aria-label",
        lang === "tr" ? "Switch language to English" : "Dili Türkçeye çevir"
      );
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = getNestedValue(dict, el.dataset.i18n);
      if (typeof val === "string") {
        el.textContent = val;
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const val = getNestedValue(dict, el.dataset.i18nPlaceholder);
      if (typeof val === "string") {
        el.setAttribute("placeholder", val);
      }
    });

    // Update emotion buttons
    emoButtons.forEach((btn) => {
      const key = btn.dataset.emotion;
      const labelSpan = btn.querySelector(".emo-label");
      if (labelSpan && dict.emotions[key]) {
        labelSpan.textContent = dict.emotions[key].title;
      }
    });

    // Update prompt list items
    promptButtons.forEach((btn, idx) => {
      const m = dict.dialogue.moments[idx];
      if (!m) return;
      const utt = btn.querySelector(".prompt-utterance");
      const tag = btn.querySelector(".prompt-tag");
      if (utt) utt.textContent = m.utterance;
      if (tag) tag.textContent = m.tag;
    });

    // Refresh active moment card without stopping auto-cycle
    const activeMoment = dict.dialogue.moments[currentMomentIdx];
    if (activeMoment) {
      if (expMoment) expMoment.textContent = activeMoment.moment;
      if (expReply) expReply.textContent = activeMoment.reply;
      if (expFace) expFace.textContent = activeMoment.faceReaction;
      if (expBody) expBody.textContent = activeMoment.bodyMovement;
    }

    // Update tracking button & panel strings
    if (trackingBtn && splitContainer) {
      const isOpen = splitContainer.classList.contains("tracking-open");
      const labelSpan = trackingBtn.querySelector(".tracking-label");
      if (labelSpan) {
        labelSpan.textContent = isOpen ? dict.hud.eyeContactOn : dict.hud.eyeContact;
      }
      refreshTrackingText();
    }

    updateAutoCycleButton();
    setEmotion(currentEmotionKey);
  }

  function refreshTrackingText() {
    const dict = t();
    if (!trackingStatusEl) return;
    if (trackingState === "active") {
      trackingStatusEl.textContent = dict.hud.trackingStatusActive;
      if (trackingMotorEl) trackingMotorEl.textContent = dict.hud.motorActive;
    } else if (trackingState === "requesting") {
      trackingStatusEl.textContent = dict.hud.trackingStatusRequesting;
      if (trackingFallbackEl) trackingFallbackEl.textContent = dict.hud.trackingFallbackWaiting;
    } else if (trackingState === "denied") {
      trackingStatusEl.textContent = dict.hud.trackingStatusDenied;
      if (trackingMotorEl) trackingMotorEl.textContent = dict.hud.motorStandby;
      if (trackingFallbackEl) trackingFallbackEl.textContent = dict.hud.trackingFallbackDenied;
    } else if (trackingState === "unsupported") {
      trackingStatusEl.textContent = dict.hud.trackingStatusUnsupported;
      if (trackingFallbackEl) trackingFallbackEl.textContent = dict.hud.trackingFallbackUnsupported;
    } else {
      trackingStatusEl.textContent = dict.hud.trackingStatusClosed;
      if (trackingMotorEl) trackingMotorEl.textContent = dict.hud.motorReady;
      if (trackingFallbackEl) trackingFallbackEl.textContent = dict.hud.trackingFallbackClosed;
    }
  }

  function setEmotion(key) {
    const colors = EMOTION_COLORS[key];
    const copy = t().emotions[key];
    if (!colors || !copy) return;
    currentEmotionKey = key;

    root.style.setProperty("--emo-primary", colors.primary);
    root.style.setProperty("--emo-secondary", colors.secondary);
    root.style.setProperty("--emo-glow", colors.glow);

    screenEl.setAttribute("data-emotion", key);
    emoTitleEl.textContent = copy.title;
    speechBubbleEl.textContent = copy.speech;

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

  async function startTrackingCamera() {
    if (!trackingVideoEl || !trackingStatusEl) return;
    const dict = t();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      trackingState = "unsupported";
      trackingStatusEl.style.color = "var(--subtext)";
      if (trackingFallbackEl) trackingFallbackEl.classList.remove("hidden");
      refreshTrackingText();
      return;
    }

    trackingState = "requesting";
    trackingStatusEl.style.color = "var(--subtext)";
    if (trackingFallbackEl) trackingFallbackEl.classList.remove("hidden");
    refreshTrackingText();

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });

      if (!splitContainer.classList.contains("tracking-open")) {
        stopTrackingCamera();
        return;
      }

      trackingVideoEl.srcObject = cameraStream;
      await trackingVideoEl.play();
      trackingVideoEl.classList.add("is-live");
      if (trackingFallbackEl) trackingFallbackEl.classList.add("hidden");
      trackingState = "active";
      trackingStatusEl.style.color = "var(--success)";
      refreshTrackingText();
    } catch (err) {
      trackingVideoEl.classList.remove("is-live");
      trackingState = "denied";
      trackingStatusEl.style.color = "#FF4560";
      if (trackingFallbackEl) trackingFallbackEl.classList.remove("hidden");
      refreshTrackingText();
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
    if (trackingFallbackEl) trackingFallbackEl.classList.remove("hidden");
    trackingState = "closed";
    if (trackingStatusEl) trackingStatusEl.style.color = "var(--subtext)";
    refreshTrackingText();
  }

  if (trackingBtn && splitContainer) {
    trackingBtn.addEventListener("click", () => {
      const isOpen = splitContainer.classList.toggle("tracking-open");
      trackingBtn.setAttribute("aria-pressed", isOpen ? "true" : "false");
      const labelSpan = trackingBtn.querySelector(".tracking-label");
      if (labelSpan) {
        labelSpan.textContent = isOpen ? t().hud.eyeContactOn : t().hud.eyeContact;
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

  const emotionOrder = Object.keys(EMOTION_COLORS);
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
    autoCycleBtn.textContent = isAutoCycling ? t().hud.pause : t().hud.play;
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

  function renderMoment(index) {
    const item = t().dialogue.moments[index];
    if (!item) return;
    currentMomentIdx = index;

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

  // Corporate Quote Dialog & Form
  const corpModalBtns = document.querySelectorAll(".open-corporate-modal");
  const corpDialog = document.getElementById("corporate-dialog");
  const corpForm = document.getElementById("corporate-form");
  const corpStatus = document.getElementById("corp-form-status");

  if (corpDialog) {
    corpModalBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (corpStatus) corpStatus.textContent = "";
        corpDialog.showModal();
      });
    });
  }

  if (corpForm) {
    corpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const company = document.getElementById("corp-company")?.value.trim() || (currentLang === "en" ? "Your company" : "Şirketiniz");
      if (corpStatus) {
        corpStatus.textContent = t().corpModal.success(company);
      }
      corpForm.reset();
    });
  }

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      applyLanguage(currentLang === "tr" ? "en" : "tr");
    });
  }

  // Initialize language & auto-cycle
  applyLanguage(currentLang);
  startAutoCycle();
});
