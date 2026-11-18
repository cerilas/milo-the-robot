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

  const wfTabs = document.querySelectorAll(".wf-tab");
  const wfPromptEl = document.getElementById("wf-prompt");
  const wfPipelineEl = document.getElementById("wf-pipeline");

  let currentLang = localStorage.getItem("milo-lang") === "en" ? "en" : "tr";
  let currentEmotionKey = "neutral";
  let currentMomentIdx = 0;
  let currentWfIdx = 0;
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

    // Update workflow tabs & active pipeline
    wfTabs.forEach((tab, idx) => {
      const f = dict.workflows.flows[idx];
      if (f) tab.textContent = f.tab;
    });
    renderWorkflow(currentWfIdx);

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
    }, 3000);
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

  const WF_ICONS = {
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    spark: '<path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    drive: '<polygon points="12 3 4 17 8 21 16 21 20 17 12 3"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>'
  };

  function renderWorkflow(index) {
    const flow = t().workflows.flows[index];
    if (!flow || !wfPipelineEl) return;
    currentWfIdx = index;

    wfTabs.forEach((tab, idx) => {
      tab.setAttribute("aria-selected", idx === index ? "true" : "false");
    });

    if (wfPromptEl) wfPromptEl.textContent = flow.prompt;

    wfPipelineEl.innerHTML = "";
    flow.steps.forEach((step, idx) => {
      const card = document.createElement("div");
      card.className = "wf-step-card";

      const num = document.createElement("span");
      num.className = "wf-step-num";
      num.textContent = `0${idx + 1}`;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "36");
      svg.setAttribute("height", "36");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.6");
      svg.setAttribute("class", "wf-step-icon");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = WF_ICONS[step.icon] || WF_ICONS.spark;

      const h3 = document.createElement("h3");
      h3.textContent = step.app;

      const p = document.createElement("p");
      p.textContent = step.action;

      card.append(num, svg, h3, p);
      wfPipelineEl.appendChild(card);

      if (idx < flow.steps.length - 1) {
        const arrow = document.createElement("div");
        arrow.className = "wf-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "→";
        wfPipelineEl.appendChild(arrow);
      }
    });
  }

  wfTabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => renderWorkflow(idx));
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

  // Custom Large Cursor & Live Eye-Gaze Tracking
  const cursorEl = document.getElementById("milo-cursor");
  const faceCanvas = document.querySelector(".milo-face-canvas");
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (isFinePointer && !prefersReducedMotion) {
    if (cursorEl) {
      document.body.classList.add("has-custom-cursor");
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curX = mouseX;
    let curY = mouseY;
    let gazeX = 0;
    let gazeY = 0;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorEl && !cursorEl.classList.contains("is-visible")) {
        cursorEl.classList.add("is-visible");
      }
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      if (cursorEl) cursorEl.classList.remove("is-visible");
    });

    document.addEventListener("mousedown", () => {
      if (cursorEl) cursorEl.classList.add("is-pressed");
    });

    document.addEventListener("mouseup", () => {
      if (cursorEl) cursorEl.classList.remove("is-pressed");
    });

    document.addEventListener("mouseover", (e) => {
      if (!cursorEl) return;
      const interactive = e.target.closest("a, button, summary, input, [role='button'], [role='tab'], [role='option']");
      cursorEl.classList.toggle("is-hovering", Boolean(interactive));
    });

    function animateCursorAndGaze() {
      // Smooth cursor follow
      curX += (mouseX - curX) * 0.24;
      curY += (mouseY - curY) * 0.24;
      if (cursorEl) {
        cursorEl.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      }

      // Smooth Milo eye gaze tracking toward cursor
      if (faceCanvas) {
        if (currentEmotionKey === "sleeping") {
          gazeX += (0 - gazeX) * 0.1;
          gazeY += (0 - gazeY) * 0.1;
        } else {
          const rect = faceCanvas.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = mouseX - cx;
          const dy = mouseY - cy;
          const dist = Math.hypot(dx, dy) || 1;
          const maxDist = Math.max(window.innerWidth, window.innerHeight) * 0.55;
          const strength = Math.min(1, dist / maxDist);
          const targetX = (dx / dist) * 18 * strength;
          const targetY = (dy / dist) * 11 * strength;
          gazeX += (targetX - gazeX) * 0.14;
          gazeY += (targetY - gazeY) * 0.14;
        }
        faceCanvas.style.setProperty("--gaze-x", `${gazeX.toFixed(2)}px`);
        faceCanvas.style.setProperty("--gaze-y", `${gazeY.toFixed(2)}px`);
      }

      requestAnimationFrame(animateCursorAndGaze);
    }

    requestAnimationFrame(animateCursorAndGaze);
  }
});
