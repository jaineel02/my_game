// ═══════════════════════════════════════════════════════════════
// HOW TO CUSTOMISE: change CONFIG only. Swap images in /assets
// with the same file names, or change the paths in CONFIG.ASSETS.
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── BRAND ──────────────────────────────────────────────────
  BRAND: {
    title: "Meme Crush",
    tagline: "Catch the memes. Dodge the bombs.",
    credits: "by team pixelpuff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mainColor: "#ffffff",
    accentColor: "#ffcc33",
  },

  // ── PLAYER ─────────────────────────────────────────────────
  PLAYER: {
    image: "assets/basket.png",
    width: 110,                 // basket draw-width (px)
    speed: 420,                 // keyboard movement speed (px/s)
    glide: 12,                  // pointer-follow smoothing factor
    bottom: 30,                 // gap between basket and canvas bottom (px)
  },

  // ── ITEMS ──────────────────────────────────────────────────
  ITEMS: [
    { name: "star",      img: "assets/star.png",      width: 56, points: 10, type: "good",  weight: 70 },
    { name: "bomb",      img: "assets/bomb.png",      width: 60, points: 0,  type: "bad",   weight: 30 },
    { name: "lightning", img: "assets/lightning.png",  width: 80, points: 0,  type: "power", effect: "double", duration: 5, weight: 5 },
    { name: "snowflake", img: "assets/snowflake.png",  width: 68, points: 0,  type: "power", effect: "slow",   duration: 4, weight: 5 },
  ],

  // ── RULES ──────────────────────────────────────────────────
  RULES: {
    lives: 3,                   // starting lives
    roundSeconds: 45,           // round duration (s)
    spawnIntervalStart: 0.8,    // spawn interval at start of round (s)
    spawnIntervalEnd: 0.4,      // spawn interval at end of round (s)
    speedRamp: 0.4,             // fall speed increase factor over round (40%)
    fallSpeedMin: 180,          // base min fall speed (px/s)
    fallSpeedMax: 260,          // base max fall speed (px/s)
    hitShrink: 0.70,            // hitbox shrink factor
    flashDuration: 0.2,         // red-flash duration (s)
    shakeDuration: 0.25,        // screen-shake duration (s)
    shakeIntensity: 6,          // screen-shake max offset (px)
    heartWidth: 34,             // heart icon draw-width (px)
    heartGap: 6,                // gap between hearts (px)
    clockWidth: 30,             // clock icon draw-width (px)
    squashDuration: 0.1,        // basket squash duration (s)
    squashX: 1.25,              // basket squash horizontal scale
    squashY: 0.75,              // basket squash vertical scale
  },

  // ── POWER-UPS ──────────────────────────────────────────────
  POWER_UPS: {
    durations: {
      double: 5,                // double points duration (s)
      slow: 4,                  // slow motion duration (s)
    },
    slowFactor: 0.5,            // fall speed multiplier during slow motion
    doubleFactor: 2,            // score multiplier during double points
  },

  // ── ASSETS ─────────────────────────────────────────────────
  ASSETS: {
    background:    "assets/background.png",
    basket:        "assets/basket.png",
    star:          "assets/star.png",
    bomb:          "assets/bomb.png",
    heart:         "assets/heart.png",
    heartEmpty:    "assets/heart-empty.png",
    clock:         "assets/clock.png",
    lightning:     "assets/lightning.png",
    snowflake:     "assets/snowflake.png",
    sparkleBurst:  "assets/sparkle-burst.png",
    explosion:     "assets/explosion.png",
    logoBadge:     "assets/logo-badge.png",
    playButton:    "assets/play-button.png",
    restartButton: "assets/restart-button.png",
    trophy:        "assets/trophy.png",
    bombSound:     "assets/fah.mp3",
    lightningSound:"assets/wow.mp3",
    gameOverSound: "assets/emo.mp3",
  },

  // ── ENGINE CONSTANTS ───────────────────────────────────────
  CANVAS_W: 450,
  CANVAS_H: 800,
  MAX_DT: 0.05,
};

// ── Canvas setup ─────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

function resizeCanvas() {
  const dpr    = window.devicePixelRatio || 1;
  const scaleX = window.innerWidth  / CONFIG.CANVAS_W;
  const scaleY = window.innerHeight / CONFIG.CANVAS_H;
  const scale  = Math.min(scaleX, scaleY);

  const cssW = CONFIG.CANVAS_W * scale;
  const cssH = CONFIG.CANVAS_H * scale;

  canvas.style.width  = cssW + "px";
  canvas.style.height = cssH + "px";
  canvas.style.left   = (window.innerWidth  - cssW) / 2 + "px";
  canvas.style.top    = (window.innerHeight - cssH) / 2 + "px";

  canvas.width  = CONFIG.CANVAS_W * dpr;
  canvas.height = CONFIG.CANVAS_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ── Image loader ─────────────────────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => {
      console.error(`[Meme Crush] Failed to load image: ${src}`);
      reject(new Error(`Image load failed: ${src}`));
    };
    img.src = src;
  });
}

// ── Show "Loading..." ────────────────────────────────────────
function drawLoading() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  ctx.fillStyle = CONFIG.BRAND.mainColor;
  ctx.font = "24px " + CONFIG.BRAND.fontFamily;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Loading...", CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H / 2);
}

// ── Best score (localStorage) ────────────────────────────────
function loadBest() {
  try { return parseInt(localStorage.getItem("memeCrushBest") || localStorage.getItem("memeRushBest") || localStorage.getItem("catchRushBest")) || 0; }
  catch (_) { return 0; }
}
function saveBest(val) {
  try { localStorage.setItem("memeCrushBest", val); }
  catch (_) { /* storage blocked */ }
}

// ══════════════════════════════════════════════════════════════
//  SOUND — Web Audio API
// ══════════════════════════════════════════════════════════════
let audioCtx = null;
let muted = false;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, duration, type, gainVal) {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(gainVal || 0.18, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function sfxCatch() {
  playTone(880, 0.12, "sine", 0.15);
  playTone(1100, 0.10, "sine", 0.10);
}
const bombAudio = new Audio(CONFIG.ASSETS.bombSound);

function sfxBomb() {
  if (!muted) {
    try {
      const snd = bombAudio.cloneNode();
      snd.volume = 0.85;
      snd.play().catch(() => {});
    } catch (_) {}
  }
}
const lightningAudio = new Audio(CONFIG.ASSETS.lightningSound);

function sfxLightning() {
  if (!muted) {
    try {
      const snd = lightningAudio.cloneNode();
      snd.volume = 0.85;
      snd.play().catch(() => {});
    } catch (_) {}
  }
}

function sfxPower() {
  playTone(660, 0.12, "sine", 0.14);
  setTimeout(() => playTone(990, 0.18, "sine", 0.14), 100);
}
const gameOverAudio = new Audio(CONFIG.ASSETS.gameOverSound);

function sfxGameOver() {
  if (!muted) {
    try {
      const snd = gameOverAudio.cloneNode();
      snd.volume = 0.85;
      snd.play().catch(() => {});
    } catch (_) {}
  }
}

function onFirstInteraction() {
  ensureAudio();
  try { bombAudio.load(); } catch (_) {}
  try { lightningAudio.load(); } catch (_) {}
  try { gameOverAudio.load(); } catch (_) {}
  window.removeEventListener("keydown", onFirstInteraction);
  window.removeEventListener("pointerdown", onFirstInteraction);
}
window.addEventListener("keydown", onFirstInteraction);
window.addEventListener("pointerdown", onFirstInteraction);

// ── Main boot ────────────────────────────────────────────────
(async function main() {
  drawLoading();

  const images = {};
  try {
    const entries = Object.entries(CONFIG.ASSETS).filter(([_, src]) => !src.endsWith(".mp3"));
    const loaded = await Promise.all(entries.map(([_, src]) => loadImage(src)));
    entries.forEach(([key, src], idx) => {
      images[key] = loaded[idx];
      images[src] = loaded[idx]; // key by path too
    });
  } catch (_) {
    return;
  }

  // ── Computed sizes ───────────────────────────────────────
  const basketH = CONFIG.PLAYER.width * (images.basket.naturalHeight / images.basket.naturalWidth);
  const basketY = CONFIG.CANVAS_H - CONFIG.PLAYER.bottom - basketH;
  const heartH  = CONFIG.RULES.heartWidth * (images.heart.naturalHeight / images.heart.naturalWidth);
  const clockH  = CONFIG.RULES.clockWidth * (images.clock.naturalHeight / images.clock.naturalWidth);

  // ── Game state ───────────────────────────────────────────
  let state = "start";          // "start", "playing", "paused", "over"
  let gameOverReason = "";
  let score = 0;
  let bestScore = loadBest();
  let isNewBest = false;
  let lives = CONFIG.RULES.lives;
  let timeLeft = CONFIG.RULES.roundSeconds;
  let basketX = (CONFIG.CANVAS_W - CONFIG.PLAYER.width) / 2;
  let flashTimer = 0;
  let shakeTimer = 0;
  let spawnTimer = 0;
  let squashTimer = 0;

  const activeItems   = [];
  const vfxParticles  = [];
  const floatingTexts = [];
  const activePowers  = {};

  // Decorative falling stars & bombs for the start screen
  const decorItems = [
    { img: images.star, x: 50,  y: 60,  speed: 55,  rot: 0, rotSpeed: 0.8, w: 42 },
    { img: images.bomb, x: 330, y: 150, speed: 45,  wobble: 0, w: 46 },
    { img: images.star, x: 190, y: 320, speed: 65,  rot: 1, rotSpeed: 1.1, w: 48 },
    { img: images.star, x: 370, y: 520, speed: 50,  rot: 2, rotSpeed: 0.9, w: 40 },
    { img: images.bomb, x: 80,  y: 620, speed: 40,  wobble: 1.5, w: 44 },
  ];

  function resetGame() {
    state          = "playing";
    gameOverReason = "";
    score          = 0;
    bestScore      = loadBest();
    isNewBest      = false;
    lives          = CONFIG.RULES.lives;
    timeLeft       = CONFIG.RULES.roundSeconds;
    basketX        = (CONFIG.CANVAS_W - CONFIG.PLAYER.width) / 2;
    flashTimer     = 0;
    shakeTimer     = 0;
    spawnTimer     = 0;
    squashTimer    = 0;
    activeItems.length   = 0;
    vfxParticles.length  = 0;
    floatingTexts.length = 0;
    for (const k in activePowers) delete activePowers[k];
  }

  // ── Input handling ───────────────────────────────────────
  const keys = {};

  window.addEventListener("keydown", (e) => {
    if (["ArrowLeft","ArrowRight","a","d","A","D"].includes(e.key)) {
      e.preventDefault();
      keys[e.key] = true;
    }

    // Toggle mute
    if (e.key === "m" || e.key === "M") {
      muted = !muted;
      return;
    }

    // Pause / Unpause toggle
    if (e.key === "p" || e.key === "P") {
      if (state === "playing") {
        state = "paused";
      } else if (state === "paused") {
        state = "playing";
        lastTime = performance.now();
      }
      return;
    }

    // Start / Restart with keys
    if (state === "start" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      resetGame();
    } else if (state === "over" && ["r","R"," ","Enter"].includes(e.key)) {
      e.preventDefault();
      resetGame();
    } else if (state === "paused" && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      state = "playing";
      lastTime = performance.now();
    }
  });

  window.addEventListener("keyup", (e) => { keys[e.key] = false; });

  // Pause when browser tab loses focus
  window.addEventListener("blur", () => {
    if (state === "playing") state = "paused";
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") state = "paused";
  });

  let pointerDown = false;
  let pointerX    = null;

  function pointerToLogical(clientX, clientY) {
    const rect  = canvas.getBoundingClientRect();
    const scale = CONFIG.CANVAS_W / rect.width;
    return {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top)  * scale,
    };
  }

  function inRect(pt, r) {
    return r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
  }

  // Interactive button bounds
  let playBtnRect    = null;
  let restartBtnRect = null;
  let menuBtnRect    = null;
  const muteRect     = { x: CONFIG.CANVAS_W - 46, y: CONFIG.CANVAS_H - 42, w: 36, h: 32 };

  canvas.addEventListener("pointerdown", (e) => {
    ensureAudio();
    const pos = pointerToLogical(e.clientX, e.clientY);

    // Mute button
    if (inRect(pos, muteRect)) {
      muted = !muted;
      return;
    }

    // Start screen click
    if (state === "start") {
      if (inRect(pos, playBtnRect)) {
        resetGame();
      }
      return;
    }

    // Paused click unpauses
    if (state === "paused") {
      state = "playing";
      lastTime = performance.now();
      return;
    }

    // Game Over screen clicks
    if (state === "over") {
      if (inRect(pos, restartBtnRect)) {
        resetGame();
        return;
      }
      if (inRect(pos, menuBtnRect)) {
        state = "start";
        return;
      }
      return;
    }

    pointerDown = true;
    pointerX    = pos.x;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (pointerDown) {
      const pos = pointerToLogical(e.clientX, e.clientY);
      pointerX = pos.x;
    }
  });

  canvas.addEventListener("pointerup",     () => { pointerDown = false; pointerX = null; });
  canvas.addEventListener("pointercancel", () => { pointerDown = false; pointerX = null; });

  // ── Draw helpers ─────────────────────────────────────────
  function drawBackground() {
    const imgAR    = images.background.naturalWidth / images.background.naturalHeight;
    const canvasAR = CONFIG.CANVAS_W / CONFIG.CANVAS_H;
    let sw, sh, sx, sy;
    if (imgAR > canvasAR) {
      sh = images.background.naturalHeight; sw = sh * canvasAR;
      sx = (images.background.naturalWidth - sw) / 2; sy = 0;
    } else {
      sw = images.background.naturalWidth; sh = sw / canvasAR;
      sx = 0; sy = (images.background.naturalHeight - sh) / 2;
    }
    ctx.drawImage(images.background, sx, sy, sw, sh, 0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
  }

  function drawBasket() {
    ctx.save();
    const cx = basketX + CONFIG.PLAYER.width / 2;
    const cy = basketY + basketH;
    if (squashTimer > 0) {
      const t = squashTimer / CONFIG.RULES.squashDuration;
      const sx = 1 + (CONFIG.RULES.squashX - 1) * t;
      const sy = 1 + (CONFIG.RULES.squashY - 1) * t;
      ctx.translate(cx, cy);
      ctx.scale(sx, sy);
      ctx.translate(-cx, -cy);
    }
    ctx.drawImage(images.basket, basketX, basketY, CONFIG.PLAYER.width, basketH);
    ctx.restore();
  }

  // ── HUD Elements ─────────────────────────────────────────
  function drawScore() {
    ctx.save();
    ctx.font = "bold 28px " + CONFIG.BRAND.fontFamily;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.strokeText("Score: " + score, 16, 16);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText("Score: " + score, 16, 16);
    ctx.restore();
  }

  function drawPowerIndicators() {
    let oy = 52;
    for (const key in activePowers) {
      const pw = activePowers[key];
      if (pw.timer <= 0) continue;
      const icon = images[pw.def.img];
      if (!icon) continue;
      const iconW = 28;
      const iconH = iconW * (icon.naturalHeight / icon.naturalWidth);
      ctx.drawImage(icon, 16, oy, iconW, iconH);

      const barX = 16 + iconW + 6;
      const barW = 70, barH = 8;
      const barY = oy + iconH / 2 - barH / 2;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(barX, barY, barW, barH);

      const frac = pw.timer / (CONFIG.POWER_UPS.durations[key] || pw.def.duration);
      ctx.fillStyle = key === "double" ? CONFIG.BRAND.accentColor : "#66ccff";
      ctx.fillRect(barX, barY, barW * frac, barH);

      oy += iconH + 6;
    }
  }

  function drawLives() {
    const totalW = CONFIG.RULES.lives * CONFIG.RULES.heartWidth + (CONFIG.RULES.lives - 1) * CONFIG.RULES.heartGap;
    const startX = CONFIG.CANVAS_W - 16 - totalW;
    const y = 14;
    for (let i = 0; i < CONFIG.RULES.lives; i++) {
      const img = i < lives ? images.heart : images.heartEmpty;
      const x = startX + i * (CONFIG.RULES.heartWidth + CONFIG.RULES.heartGap);
      ctx.drawImage(img, x, y, CONFIG.RULES.heartWidth, heartH);
    }
  }

  function drawTimer(now) {
    ctx.save();
    const secs = Math.ceil(timeLeft);
    const text = "" + secs;
    ctx.font = "bold 28px " + CONFIG.BRAND.fontFamily;
    const textW = ctx.measureText(text).width;
    const gap = 8;
    const totalW = CONFIG.RULES.clockWidth + gap + textW;
    const cx = CONFIG.CANVAS_W / 2;
    const startX = cx - totalW / 2;
    const y = 14;

    ctx.drawImage(images.clock, startX, y, CONFIG.RULES.clockWidth, clockH);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";

    if (timeLeft <= 10 && state === "playing") {
      const pulse = 0.5 + 0.5 * Math.sin(now / 1000 * 6);
      ctx.strokeText(text, startX + CONFIG.RULES.clockWidth + gap, y);
      ctx.fillStyle = CONFIG.BRAND.accentColor;
      ctx.globalAlpha = 0.7 + 0.3 * pulse;
    } else {
      ctx.strokeText(text, startX + CONFIG.RULES.clockWidth + gap, y);
      ctx.fillStyle = CONFIG.BRAND.mainColor;
    }
    ctx.fillText(text, startX + CONFIG.RULES.clockWidth + gap, y);
    ctx.restore();
  }

  function drawFlash() {
    if (flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 * (flashTimer / CONFIG.RULES.flashDuration);
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);
      ctx.restore();
    }
  }

  function drawMuteIcon() {
    ctx.save();
    ctx.font = "22px " + CONFIG.BRAND.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.globalAlpha = 0.7;
    const icon = muted ? "🔇" : "🔊";
    ctx.fillText(icon, muteRect.x + muteRect.w / 2, muteRect.y + muteRect.h / 2);
    ctx.restore();
  }

  // ── VFX particles & Floating text ────────────────────────
  function spawnVFX(img, x, y, sizeStart, sizeEnd, duration) {
    vfxParticles.push({ img, x, y, sizeStart, sizeEnd, duration, elapsed: 0 });
  }

  function updateAndDrawVFX(dt) {
    for (let i = vfxParticles.length - 1; i >= 0; i--) {
      const p = vfxParticles[i];
      p.elapsed += dt;
      if (p.elapsed >= p.duration) { vfxParticles.splice(i, 1); continue; }
      const t = p.elapsed / p.duration;
      const size = p.sizeStart + (p.sizeEnd - p.sizeStart) * t;
      const h = size * (p.img.naturalHeight / p.img.naturalWidth);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(p.img, p.x - size / 2, p.y - h / 2, size, h);
      ctx.restore();
    }
  }

  function spawnFloatText(text, x, y, color) {
    floatingTexts.push({ text, x, y, startY: y, duration: 0.7, elapsed: 0, color: color || CONFIG.BRAND.mainColor });
  }

  function updateAndDrawFloatTexts(dt) {
    ctx.save();
    ctx.font = "bold 24px " + CONFIG.BRAND.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.elapsed += dt;
      if (ft.elapsed >= ft.duration) { floatingTexts.splice(i, 1); continue; }
      const t = ft.elapsed / ft.duration;
      ft.y = ft.startY - 40 * t;
      ctx.globalAlpha = 1 - t;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  // ── START SCREEN ─────────────────────────────────────────
  function drawStartScreen(now) {
    ctx.save();

    // 1. Logo badge (340px wide in upper third)
    const badgeW = 340;
    const badgeH = badgeW * (images.logoBadge.naturalHeight / images.logoBadge.naturalWidth);
    const badgeX = (CONFIG.CANVAS_W - badgeW) / 2;
    const badgeY = 100;
    ctx.drawImage(images.logoBadge, badgeX, badgeY, badgeW, badgeH);

    // Title text inside badge
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 38px " + CONFIG.BRAND.fontFamily;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.strokeText(CONFIG.BRAND.title, CONFIG.CANVAS_W / 2, badgeY + badgeH / 2);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText(CONFIG.BRAND.title, CONFIG.CANVAS_W / 2, badgeY + badgeH / 2);

    // Tagline underneath
    const tagY = badgeY + badgeH + 28;
    ctx.font = "bold 18px " + CONFIG.BRAND.fontFamily;
    ctx.lineWidth = 3;
    ctx.strokeText(CONFIG.BRAND.tagline, CONFIG.CANVAS_W / 2, tagY);
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText(CONFIG.BRAND.tagline, CONFIG.CANVAS_W / 2, tagY);

    // 2. Play button (120px wide in centre, pulsing scale 1.0 to 1.08)
    const pulse = 1.0 + 0.04 * (1 + Math.sin(now / 1000 * 3));
    const baseBtnW = 120;
    const btnW = baseBtnW * pulse;
    const btnH = btnW * (images.playButton.naturalHeight / images.playButton.naturalWidth);
    const btnX = (CONFIG.CANVAS_W - btnW) / 2;
    const btnY = (CONFIG.CANVAS_H / 2) + 15 - (btnH / 2);
    ctx.drawImage(images.playButton, btnX, btnY, btnW, btnH);
    playBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

    // 3. How to play line near bottom
    const htpY = CONFIG.CANVAS_H - 75;
    ctx.font = "bold 15px " + CONFIG.BRAND.fontFamily;
    ctx.lineWidth = 3;
    const htpText = "Move: arrows / drag. Catch memes. Dodge bombs.";
    ctx.strokeText(htpText, CONFIG.CANVAS_W / 2, htpY);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText(htpText, CONFIG.CANVAS_W / 2, htpY);

    // Prompt hint
    ctx.font = "14px " + CONFIG.BRAND.fontFamily;
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText("Press Space or Enter to Play", CONFIG.CANVAS_W / 2, htpY + 24);

    // Credits
    ctx.font = "13px " + CONFIG.BRAND.fontFamily;
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.globalAlpha = 0.65;
    ctx.fillText(CONFIG.BRAND.credits, CONFIG.CANVAS_W / 2, CONFIG.CANVAS_H - 18);

    ctx.restore();
  }

  // ── PAUSE OVERLAY ────────────────────────────────────────
  function drawPaused() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    const cx = CONFIG.CANVAS_W / 2;
    const cy = CONFIG.CANVAS_H / 2;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 46px " + CONFIG.BRAND.fontFamily;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.strokeText("Paused", cx, cy - 25);
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText("Paused", cx, cy - 25);

    ctx.font = "bold 20px " + CONFIG.BRAND.fontFamily;
    ctx.lineWidth = 3;
    ctx.strokeText("Press P or tap to continue", cx, cy + 30);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText("Press P or tap to continue", cx, cy + 30);

    ctx.restore();
  }

  // ── GAME OVER OVERLAY ────────────────────────────────────
  function drawGameOver(now) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.70)";
    ctx.fillRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    const cx = CONFIG.CANVAS_W / 2;
    let y = 140;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Title
    ctx.font = "900 48px " + CONFIG.BRAND.fontFamily;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.lineWidth = 6; ctx.lineJoin = "round";
    ctx.strokeText("GAME OVER", cx, y);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText("GAME OVER", cx, y);
    y += 44;

    // Reason
    ctx.font = "bold 24px " + CONFIG.BRAND.fontFamily;
    ctx.lineWidth = 4;
    ctx.strokeText(gameOverReason, cx, y);
    ctx.fillStyle = CONFIG.BRAND.accentColor;
    ctx.fillText(gameOverReason, cx, y);
    y += 34;

    // Trophy (90px wide above the score)
    const trophyW = 90;
    const trophyH = trophyW * (images.trophy.naturalHeight / images.trophy.naturalWidth);
    ctx.drawImage(images.trophy, cx - trophyW / 2, y, trophyW, trophyH);
    y += trophyH + 24;

    // Score
    ctx.font = "bold 34px " + CONFIG.BRAND.fontFamily;
    ctx.lineWidth = 5;
    ctx.strokeText("Score: " + score, cx, y);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText("Score: " + score, cx, y);
    y += 36;

    // New best bounce or standard best
    if (isNewBest) {
      const bounce = 1.0 + 0.12 * Math.sin(now / 1000 * 6);
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(bounce, bounce);
      ctx.font = "900 28px " + CONFIG.BRAND.fontFamily;
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 4;
      ctx.strokeText("NEW BEST!", 0, 0);
      ctx.fillStyle = CONFIG.BRAND.accentColor;
      ctx.fillText("NEW BEST!", 0, 0);
      ctx.restore();
      y += 40;
    } else {
      ctx.font = "bold 22px " + CONFIG.BRAND.fontFamily;
      ctx.lineWidth = 4;
      ctx.strokeText("Best: " + bestScore, cx, y);
      ctx.fillStyle = CONFIG.BRAND.accentColor;
      ctx.fillText("Best: " + bestScore, cx, y);
      y += 38;
    }

    // Restart button (100px wide image)
    const rstW = 100;
    const rstH = rstW * (images.restartButton.naturalHeight / images.restartButton.naturalWidth);
    const rstX = cx - rstW / 2;
    const rstY = y + 10;
    ctx.drawImage(images.restartButton, rstX, rstY, rstW, rstH);
    restartBtnRect = { x: rstX, y: rstY, w: rstW, h: rstH };

    // Menu text button
    const menuY = rstY + rstH + 26;
    ctx.font = "bold 22px " + CONFIG.BRAND.fontFamily;
    ctx.lineWidth = 3;
    ctx.strokeText("Menu", cx, menuY);
    ctx.fillStyle = CONFIG.BRAND.mainColor;
    ctx.fillText("Menu", cx, menuY);
    menuBtnRect = { x: cx - 45, y: menuY - 16, w: 90, h: 32 };

    ctx.restore();
  }

  // ── Difficulty ramp helpers ────────────────────────────
  function getRampT() {
    return 1 - (timeLeft / CONFIG.RULES.roundSeconds);
  }
  function currentSpawnInterval() {
    const t = getRampT();
    return CONFIG.RULES.spawnIntervalStart + (CONFIG.RULES.spawnIntervalEnd - CONFIG.RULES.spawnIntervalStart) * t;
  }
  function currentFallSpeedRange() {
    const t = getRampT();
    const mult = 1 + CONFIG.RULES.speedRamp * t;
    return { min: CONFIG.RULES.fallSpeedMin * mult, max: CONFIG.RULES.fallSpeedMax * mult };
  }

  // ── Items spawning & state ─────────────────────────────
  const totalWeight = CONFIG.ITEMS.reduce((s, i) => s + i.weight, 0);

  function pickRandomItem() {
    let r = Math.random() * totalWeight;
    for (const def of CONFIG.ITEMS) {
      r -= def.weight;
      if (r <= 0) return def;
    }
    return CONFIG.ITEMS[CONFIG.ITEMS.length - 1];
  }

  function spawnItem() {
    const def = pickRandomItem();
    const img = images[def.img];
    const w   = def.width;
    const h   = w * (img.naturalHeight / img.naturalWidth);
    const x   = Math.random() * (CONFIG.CANVAS_W - w);
    const range = currentFallSpeedRange();
    const speed = range.min + Math.random() * (range.max - range.min);
    activeItems.push({
      def, img, x, y: -h, w, h, speed,
      angle: 0,
      wobblePhase: Math.random() * Math.PI * 2,
    });
  }

  // ── Collision helper ───────────────────────────────────
  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function checkCatch(item) {
    const s = CONFIG.RULES.hitShrink;
    const iw = item.w * s, ih = item.h * s;
    const ix = item.x + (item.w - iw) / 2;
    const iy = item.y + (item.h - ih) / 2;
    const bw = CONFIG.PLAYER.width * s, bh2 = basketH * s;
    const bx = basketX + (CONFIG.PLAYER.width - bw) / 2;
    const by = basketY + (basketH - bh2) / 2;
    return rectsOverlap(ix, iy, iw, ih, bx, by, bw, bh2);
  }

  // ── End game ───────────────────────────────────────────
  function endGame(reason) {
    state = "over";
    gameOverReason = reason;
    const prevBest = bestScore;
    if (score > prevBest && score > 0) {
      isNewBest = true;
      bestScore = score;
      saveBest(bestScore);
    } else {
      isNewBest = false;
    }
    sfxGameOver();
  }

  // ── Power-up helpers ───────────────────────────────────
  function isDoubleActive() {
    return activePowers["double"] && activePowers["double"].timer > 0;
  }
  function isSlowActive() {
    return activePowers["slow"] && activePowers["slow"].timer > 0;
  }

  // ── Game loop ────────────────────────────────────────────
  let lastTime = performance.now();

  function frame(now) {
    let dt = (now - lastTime) / 1000;
    lastTime = now;
    if (dt > CONFIG.MAX_DT) dt = CONFIG.MAX_DT;

    // ── UPDATE ───────────────────────────────────────────
    if (state === "start") {
      // Gently fall decorative stars and bombs
      for (const item of decorItems) {
        item.y += item.speed * dt;
        if (item.rot !== undefined) item.rot += item.rotSpeed * dt;
        if (item.wobble !== undefined) item.wobble += 3.0 * dt;
        if (item.y > CONFIG.CANVAS_H + 50) {
          item.y = -60;
          item.x = 20 + Math.random() * (CONFIG.CANVAS_W - 80);
        }
      }
    } else if (state === "playing") {
      // Basket keyboard movement
      let dir = 0;
      if (keys["ArrowLeft"]  || keys["a"] || keys["A"]) dir -= 1;
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) dir += 1;
      basketX += dir * CONFIG.PLAYER.speed * dt;

      // Basket pointer glide
      if (pointerDown && pointerX !== null) {
        const targetX = pointerX - CONFIG.PLAYER.width / 2;
        basketX += (targetX - basketX) * Math.min(1, CONFIG.PLAYER.glide * dt);
      }

      // Clamp basket
      basketX = Math.max(0, Math.min(CONFIG.CANVAS_W - CONFIG.PLAYER.width, basketX));

      // Timer countdown
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        endGame("Time's up!");
      }

      // Spawn items
      spawnTimer += dt;
      const interval = currentSpawnInterval();
      while (spawnTimer >= interval) {
        spawnTimer -= interval;
        spawnItem();
      }

      // Update power-up timers
      for (const key in activePowers) {
        activePowers[key].timer -= dt;
        if (activePowers[key].timer <= 0) activePowers[key].timer = 0;
      }

      // Fall speed multiplier (slow motion)
      const speedMult = isSlowActive() ? CONFIG.POWER_UPS.slowFactor : 1.0;

      // Update items
      for (let i = activeItems.length - 1; i >= 0; i--) {
        const item = activeItems[i];
        item.y += item.speed * speedMult * dt;

        if (item.def.name === "lightning" || item.def.name === "snowflake") {
          // Falls upright without rotation
        } else if (item.def.type === "good" || item.def.type === "power") {
          item.angle += 2.0 * dt;
        } else {
          item.wobblePhase += 5.0 * dt;
        }

        // Catch collision
        if (checkCatch(item)) {
          const catchX = item.x + item.w / 2;
          const catchY = item.y + item.h / 2;

          if (item.def.type === "good") {
            const pts = isDoubleActive() ? item.def.points * CONFIG.POWER_UPS.doubleFactor : item.def.points;
            score += pts;
            spawnVFX(images.sparkleBurst, catchX, catchY, 40, 90, 0.35);
            spawnFloatText("+" + pts, catchX, catchY, isDoubleActive() ? CONFIG.BRAND.accentColor : CONFIG.BRAND.mainColor);
            sfxCatch();
          } else if (item.def.type === "bad") {
            flashTimer = CONFIG.RULES.flashDuration;
            shakeTimer = CONFIG.RULES.shakeDuration;
            spawnVFX(images.explosion, catchX, catchY, 60, 120, 0.4);
            sfxBomb();
            lives -= 1;
            if (lives <= 0) {
              lives = 0;
              activeItems.splice(i, 1);
              endGame("Out of lives!");
              break;
            }
          } else if (item.def.type === "power") {
            const dur = CONFIG.POWER_UPS.durations[item.def.effect] || item.def.duration;
            activePowers[item.def.effect] = { timer: dur, def: item.def };
            if (item.def.name === "lightning") {
              sfxLightning();
            } else {
              sfxPower();
            }
          }

          squashTimer = CONFIG.RULES.squashDuration;
          activeItems.splice(i, 1);
          continue;
        }

        // Off-screen removal
        if (item.y > CONFIG.CANVAS_H) {
          activeItems.splice(i, 1);
        }
      }

      // FX timers
      if (flashTimer > 0) flashTimer = Math.max(0, flashTimer - dt);
      if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - dt);
      if (squashTimer > 0) squashTimer = Math.max(0, squashTimer - dt);
    }

    // ── DRAW ─────────────────────────────────────────────
    ctx.save();

    // Screen shake
    if (shakeTimer > 0) {
      const intensity = CONFIG.RULES.shakeIntensity * (shakeTimer / CONFIG.RULES.shakeDuration);
      const ox = (Math.random() - 0.5) * 2 * intensity;
      const oy = (Math.random() - 0.5) * 2 * intensity;
      ctx.translate(ox, oy);
    }

    drawBackground();

    if (state === "start") {
      // Draw decorative falling items behind the start UI
      for (const item of decorItems) {
        ctx.save();
        const h = item.w * (item.img.naturalHeight / item.img.naturalWidth);
        ctx.translate(item.x, item.y);
        if (item.rot !== undefined) ctx.rotate(item.rot);
        if (item.wobble !== undefined) ctx.rotate(Math.sin(item.wobble) * 0.15);
        ctx.drawImage(item.img, -item.w / 2, -h / 2, item.w, h);
        ctx.restore();
      }
    } else {
      // Draw falling items in playing / paused / over
      for (const item of activeItems) {
        ctx.save();
        const cx = item.x + item.w / 2;
        const cy = item.y + item.h / 2;
        ctx.translate(cx, cy);
        if (item.def.name === "lightning" || item.def.name === "snowflake") {
          // Keep upright without rotation
        } else if (item.def.type === "good" || item.def.type === "power") {
          ctx.rotate(item.angle);
        } else {
          ctx.rotate(Math.sin(item.wobblePhase) * 0.15);
        }
        ctx.drawImage(item.img, -item.w / 2, -item.h / 2, item.w, item.h);
        ctx.restore();
      }

      updateAndDrawVFX(state === "playing" ? dt : 0);
      drawBasket();
      drawFlash();
    }

    ctx.restore(); // end shake

    if (state !== "start") {
      updateAndDrawFloatTexts(state === "playing" ? dt : 0);
      drawScore();
      drawPowerIndicators();
      drawLives();
      drawTimer(now);
    }

    drawMuteIcon();

    // State overlays
    if (state === "start") {
      drawStartScreen(now);
    } else if (state === "paused") {
      drawPaused();
    } else if (state === "over") {
      drawGameOver(now);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
