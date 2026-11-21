// Dárky Dřevo – "Yaris Circle Ritual" Meme Ad (9:16 Meta Safe Zone 269–1248 px & 4:5 Feed).
// 8 grey ordinary Yarises bounce in a 3D ritual circle until the special laser-engraved
// golden-birch Wooden Yaris descends into the center in a heavenly spotlight beam.
// 32 beats (12.8 s @ 150 BPM), 60 fps QuickTime/Meta-compatible MP4 (< 30 MB), no CTA button.
(() => {
  const cv = document.getElementById('stage');
  const ctx = cv.getContext('2d');

  // ---- brand palette (darkydrevo.cz) ----
  const C = {
    bg: '#070709',
    ink: '#fbfafa',
    muted: '#d6d2ce',
    brand: '#a62b2b',
    bright: '#c1272d',
    gold: '#ffca6b',
    woodEdge: '#6d4d2f',
    woodChar: '#2d1c10',
  };
  const FONT = '"Archivo Variable", system-ui, -apple-system, sans-serif';

  // ---- beat-locked timeline synced to assets/song.mp3 ("Why's This Dealer?", exact 135 BPM) ----
  // Starting at 10.000 s: beats land at t = 0.260 + k*(60/135); massive bass drop at t = 4.260 s (song 14.260 s)!
  const qs = new URLSearchParams(location.search);
  const BPM = +qs.get('bpm') || 135;
  const BEAT = 60 / BPM;
  const SONG_OFFSET = qs.has('offset') ? +qs.get('offset') : 10.0;
  const BEAT0 = qs.has('phase') ? +qs.get('phase') : 0.260;

  const BEAM0 = BEAT0 + 5.8 * BEAT;   // spotlight ignites during silent pre-drop pause (2.84 s)
  const ARRIVE0 = BEAT0 + 6.6 * BEAT; // Chosen Wooden Yaris descends during the suspense pause
  const LAND = BEAT0 + 9 * BEAT;      // EXACT 4.260 s (song 14.260 s BASS DROP!) -> Chosen One SLAMS DOWN!
  const BURN0 = LAND + 0.1 * BEAT;    // fast laser ember ignition sweep right after drop
  const BURN1 = LAND + 4.2 * BEAT;
  const HERO0 = BEAT0 + 17 * BEAT;    // Beat 17 (7.816 s -> 2 bars after drop, Part 2 swaps start!)
  const END0 = BEAT0 + 25 * BEAT;     // Beat 25 (11.371 s -> End card)
  const T = BEAT0 + 33 * BEAT;        // Beat 33 (14.927 s -> exact 6 bars after drop!)
  const FADE_OUT = T - 0.45;

  // ---- format layouts (9:16 strictly inside 269–1248 px; 4:5 full 1080×1350) ----
  const FORMATS = {
    '9x16': {
      key: '9x16',
      label: '9:16 · 1080×1920',
      w: 1080,
      h: 1920,
      safeTop: 269,
      safeBottom: 1248,
      eyebrowY: 294,
      eyebrowFont: 20,
      eyebrowH: 40,
      h1Y: 420,
      h1Size: 76,
      h2Y: 512,
      h2Size: 70,
      circleYMain: 905,
      circleYEnd: 710,
      rxMain: 365,
      ryMain: 112,
      npcW: 195,
      heroW: 388,
      heroFloorOffset: 52,
      endScale: 0.78,
      peakNpc: 46,
      peakHero: 72,
      priceY: 1146,
      priceSize: 94,
      tagsHeroY: 1210,
      kickerY: 306,
      logoY: 874,
      logoH: 80,
      endCopyY: 1030,
      endCopySize: 35,
      domainY: 1114,
      domainSize: 50,
      tagsEndY: 1198,
      tagFont: 22,
      tagH: 42,
    },
    '4x5': {
      key: '4x5',
      label: '4:5 · 1080×1350',
      w: 1080,
      h: 1350,
      safeTop: null,
      safeBottom: null,
      eyebrowY: 100,
      eyebrowFont: 22,
      eyebrowH: 44,
      h1Y: 242,
      h1Size: 84,
      h2Y: 344,
      h2Size: 78,
      circleYMain: 780,
      circleYEnd: 590,
      rxMain: 390,
      ryMain: 126,
      npcW: 215,
      heroW: 440,
      heroFloorOffset: 62,
      endScale: 0.78,
      peakNpc: 54,
      peakHero: 86,
      priceY: 1118,
      priceSize: 112,
      tagsHeroY: 1212,
      kickerY: 108,
      logoY: 786,
      logoH: 90,
      endCopyY: 966,
      endCopySize: 38,
      domainY: 1062,
      domainSize: 56,
      tagsEndY: 1174,
      tagFont: 24,
      tagH: 48,
    },
  };

  const initFmtKey = qs.get('format') === '4x5' ? '4x5' : '9x16';
  let L = FORMATS[initFmtKey];
  let W = L.w, H = L.h, CX = W / 2;
  let plaqueAspect = 822 / 1200;
  let showSafeZone = false;

  // ---- math & easing ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut3 = x => 1 - Math.pow(1 - x, 3);
  const easeOut4 = x => 1 - Math.pow(1 - x, 4);
  const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const inOut = (t, a, b, dIn = 0.34, dOut = 0.26) =>
    Math.min(prog(t, a, a + dIn), 1 - prog(t, b - dOut, b));

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  }

  // ---- assets & pre-baked canvases ----
  const loadImg = src => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

  let plaque = null, blank = null, logo = null;
  let gallery = [];           // { img, cutout } swapped on every bounce in Act 3 & End Card
  let npcCanvas = null;       // desaturated monochrome cool-grey "ordinary" Yaris
  let emberCanvas = null;     // molten burn embers for the Chosen One

  const GALLERY_SPECS = [
    { src: 'assets/gallery/vyrez-mops-800.webp', cutout: true },
    { src: 'assets/gallery/rodina-na-polici-wood.webp', cutout: true },
    { src: 'assets/gallery/par-v-parku-wood.webp', cutout: true },
    { src: 'assets/gallery/vyrez-chata-800.webp', cutout: true },
    { src: 'assets/gallery/pes-v-ruce-wood.webp', cutout: true },
    { src: 'assets/gallery/vanocni-darek-tresen-wood.webp', cutout: true },
    { src: 'assets/gallery/vyrez-pes-800.webp', cutout: true },
    { src: 'assets/gallery/auto-na-stole-wood.webp', cutout: true },
    { src: 'assets/gallery/lod-na-lince-wood.webp', cutout: true },
    { src: 'assets/plaque.webp', cutout: true },
  ];
  const SWAP0 = HERO0; // Beat 16: Chosen One morphs to a new real gallery photo on every bounce!

  const PAD = 22;
  const heroBuf = document.createElement('canvas');
  let hCtx = null;

  function initHeroBuffer() {
    const hw = L.heroW;
    const hh = Math.round(hw * plaqueAspect);
    heroBuf.width = hw + PAD * 2;
    heroBuf.height = hh + PAD * 2;
    hCtx = heroBuf.getContext('2d');
  }

  function buildDerivedAssets(blankImg, plaqueImg) {
    // 1. Monochrome slate-grey "ordinary Yaris" sprite for the 8 circle NPCs
    const nw = 320, nh = Math.max(1, Math.round(nw * plaqueAspect));
    npcCanvas = document.createElement('canvas');
    npcCanvas.width = nw;
    npcCanvas.height = nh;
    const nCtx = npcCanvas.getContext('2d', { willReadFrequently: true });
    nCtx.drawImage(plaqueImg, 0, 0, nw, nh);
    try {
      const imgData = nCtx.getImageData(0, 0, nw, nh);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 20) continue;
        // Cool metallic greyscale (inspired by the low-res grey meme Yaris!)
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const g = clamp((lum - 18) * 0.72 + 12, 0, 255);
        d[i] = Math.round(g * 0.88);
        d[i + 1] = Math.round(g * 0.92);
        d[i + 2] = Math.round(Math.min(255, g * 1.04));
      }
      nCtx.putImageData(imgData, 0, 0);
    } catch {
      // Fallback tint if tainted
      nCtx.globalCompositeOperation = 'source-atop';
      nCtx.fillStyle = 'rgba(70, 80, 95, 0.55)';
      nCtx.fillRect(0, 0, nw, nh);
    }

    // 2. Pixel-accurate molten ember map for the Chosen One's laser ignition
    const mw = 360, mh = Math.max(1, Math.round(mw * plaqueAspect));
    const cA = document.createElement('canvas'); cA.width = mw; cA.height = mh;
    const cB = document.createElement('canvas'); cB.width = mw; cB.height = mh;
    const gA = cA.getContext('2d', { willReadFrequently: true });
    const gB = cB.getContext('2d', { willReadFrequently: true });
    gA.drawImage(blankImg, 0, 0, mw, mh);
    gB.drawImage(plaqueImg, 0, 0, mw, mh);

    try {
      const dA = gA.getImageData(0, 0, mw, mh).data;
      const dB = gB.getImageData(0, 0, mw, mh).data;
      emberCanvas = document.createElement('canvas');
      emberCanvas.width = mw; emberCanvas.height = mh;
      const eCtx = emberCanvas.getContext('2d');
      const eImg = eCtx.createImageData(mw, mh);
      const eD = eImg.data;
      for (let p = 0; p < mw * mh; p++) {
        const i = p * 4;
        if (dB[i + 3] < 128) continue;
        const lA = 0.299 * dA[i] + 0.587 * dA[i + 1] + 0.114 * dA[i + 2];
        const lB = 0.299 * dB[i] + 0.587 * dB[i + 1] + 0.114 * dB[i + 2];
        const val = clamp(((lA - lB) / 255 - 0.03) / 0.42);
        if (val > 0.06) {
          const hot = Math.pow(val, 0.8);
          eD[i] = 255;
          eD[i + 1] = Math.round(lerp(90, 232, hot));
          eD[i + 2] = Math.round(lerp(22, 165, hot * hot));
          eD[i + 3] = Math.min(255, Math.round(Math.pow(val, 0.7) * 255));
        }
      }
      eCtx.putImageData(eImg, 0, 0);
    } catch {
      emberCanvas = null;
    }
  }

  // ---- background ----
  const bgLayer = document.createElement('canvas');
  function buildBackground() {
    bgLayer.width = W;
    bgLayer.height = H;
    const b = bgLayer.getContext('2d');
    b.fillStyle = C.bg;
    b.fillRect(0, 0, W, H);

    b.save();
    const r = 26, dx = r * Math.sqrt(3), dy = r * 1.5;
    b.strokeStyle = 'rgba(255,255,255,0.038)';
    b.lineWidth = 1.5;
    for (let row = -1; row * dy < H + r; row++) {
      for (let col = -1; col * dx < W + dx; col++) {
        const x = col * dx + (row % 2 ? dx / 2 : 0);
        const y = row * dy;
        b.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 3 * k + Math.PI / 6;
          b[k ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a));
        }
        b.closePath();
        b.stroke();
      }
    }
    b.restore();

    const focalY = L.safeTop != null ? (L.safeTop + L.safeBottom) * 0.5 : H * 0.5;
    const vg = b.createRadialGradient(CX, focalY, 320, CX, focalY, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(7,7,9,0)');
    vg.addColorStop(0.75, 'rgba(7,7,9,0.58)');
    vg.addColorStop(1, 'rgba(7,7,9,0.96)');
    b.fillStyle = vg;
    b.fillRect(0, 0, W, H);
  }

  // ---- particles (golden sparks, landing shockwaves, rising embers) ----
  let sparks = [];
  let waves = [];
  const rnd = (a, b) => a + Math.random() * (b - a);

  function emitLandingBurst(x, y, power = 1) {
    const n = Math.round(32 * power);
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI, 0);
      const sp = rnd(180, 760) * power;
      sparks.push({
        x: x + rnd(-60, 60),
        y: y - rnd(0, 14),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.75 - 60,
        g: 1100,
        life: 0,
        max: rnd(0.35, 0.85),
        size: rnd(2.2, 4.8),
        gold: Math.random() < 0.65,
      });
    }
    waves.push({ x, y, r: 40, maxR: 460 * power, life: 0, max: 0.62, gold: power > 0.9 });
  }

  function emitAmbientEmber(cx, floorY, spreadX) {
    if (Math.random() > 0.45) return;
    sparks.push({
      x: cx + rnd(-spreadX, spreadX),
      y: floorY - rnd(10, 140),
      vx: rnd(-26, 26),
      vy: -rnd(65, 160),
      g: -40,
      life: 0,
      max: rnd(0.7, 1.5),
      size: rnd(1.8, 3.6),
      gold: Math.random() < 0.75,
    });
  }

  function stepParticles(dt) {
    for (const p of sparks) {
      p.life += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    sparks = sparks.filter(p => p.life < p.max);

    for (const w of waves) {
      w.life += dt;
      w.r = lerp(45, w.maxR, easeOut3(w.life / w.max));
    }
    waves = waves.filter(w => w.life < w.max);
  }

  function drawWaves() {
    if (!waves.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const w of waves) {
      const a = (1 - w.life / w.max) * 0.75;
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.scale(1, 0.30);
      ctx.strokeStyle = w.gold ? `rgba(255,212,115,${a})` : `rgba(255,95,85,${a * 0.8})`;
      ctx.lineWidth = 4 * (1 - w.life / w.max) + 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, w.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSparks() {
    if (!sparks.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of sparks) {
      const a = 1 - p.life / p.max;
      ctx.fillStyle = p.gold
        ? `rgba(255,222,135,${a})`
        : `rgba(255,105,70,${a * 0.95})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * a), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- BOUNCING YARIS PHYSICS (locked to 135 BPM song kick grid) ----
  function bounceSample(t, intensity, peakH, phaseOffset = 0) {
    const tb = ((t - BEAT0) / BEAT) + phaseOffset;
    const u = ((tb % 1) + 1) % 1;
    const phi = Math.PI * 2 * u;

    const wave = -0.20 * Math.cos(phi) - 0.17 * Math.cos(2 * phi) + 0.06 * Math.sin(phi);
    const sy = clamp(1 + wave * intensity, 0.56, 1.28);
    const sx = Math.pow(sy, -0.66);

    const air = clamp((u - 0.10) / 0.81, 0, 1);
    const h = peakH * Math.pow(Math.sin(Math.PI * air), 1.3);
    const lean = Math.sin(Math.PI * tb) * (0.4 + 0.6 * Math.sin(Math.PI * air));
    const kick = Math.exp(-u * 6.5);

    return { h, sy, sx, lean, u, kick };
  }

  // ---- ritual arena floor & heavenly spotlight beam ----
  function drawRitualFloor(cy, rx, ry, kick, heroArrived, endP) {
    // Crimson + gold ambient floor glow
    const glowA = 0.18 + 0.14 * kick + 0.12 * heroArrived;
    const rg = ctx.createRadialGradient(CX, cy, 30, CX, cy, rx * 1.45);
    rg.addColorStop(0, heroArrived > 0.1
      ? `rgba(255, 190, 90, ${0.22 * heroArrived + 0.08 * kick})`
      : `rgba(193, 39, 45, ${glowA})`);
    rg.addColorStop(0.45, `rgba(193, 39, 45, ${glowA * 0.45})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, cy - ry * 2.2, W, ry * 4.4);

    // Outer ritual ring on perspective floor
    ctx.save();
    ctx.translate(CX, cy);
    ctx.scale(1, ry / rx);

    ctx.strokeStyle = `rgba(193, 39, 45, ${(0.32 + 0.25 * kick) * (1 - 0.25 * endP)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 1.03, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.10 * (1 - 0.3 * endP)})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([14, 14]);
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Inner summoning circle for the Chosen One
    const innerGlow = 0.25 + 0.45 * heroArrived + 0.20 * kick;
    ctx.strokeStyle = heroArrived > 0.05
      ? `rgba(255, 206, 110, ${innerGlow})`
      : `rgba(255, 85, 78, ${innerGlow * 0.7})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  function drawHeavenlyBeam(t, floorY, beamStrength, kick) {
    if (beamStrength <= 0.01) return;
    const topY = L.safeTop != null ? L.safeTop - 40 : 0;
    const topW = 140;
    const botW = 340 + 35 * kick;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Volumetric golden-white god-ray descending onto the center of the circle
    const bg = ctx.createLinearGradient(0, topY, 0, floorY + 20);
    bg.addColorStop(0, `rgba(255, 232, 175, ${0.03 * beamStrength})`);
    bg.addColorStop(0.5, `rgba(255, 205, 115, ${0.16 * beamStrength})`);
    bg.addColorStop(0.92, `rgba(255, 185, 85, ${(0.24 + 0.08 * kick) * beamStrength})`);
    bg.addColorStop(1, 'rgba(255, 160, 60, 0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(CX - topW / 2, topY);
    ctx.lineTo(CX + topW / 2, topY);
    ctx.lineTo(CX + botW / 2, floorY + 20);
    ctx.lineTo(CX - botW / 2, floorY + 20);
    ctx.closePath();
    ctx.fill();

    // Bright center core ray
    const cg = ctx.createLinearGradient(0, topY, 0, floorY);
    cg.addColorStop(0, 'rgba(255,250,230,0)');
    cg.addColorStop(0.65, `rgba(255,244,210,${0.14 * beamStrength})`);
    cg.addColorStop(1, `rgba(255,230,165,${0.26 * beamStrength})`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(CX - 34, topY);
    ctx.lineTo(CX + 34, topY);
    ctx.lineTo(CX + 115, floorY);
    ctx.lineTo(CX - 115, floorY);
    ctx.closePath();
    ctx.fill();

    // Glowing elliptical light pool on the floor
    ctx.save();
    ctx.translate(CX, floorY + 4);
    ctx.scale(1, 0.28);
    const pg = ctx.createRadialGradient(0, 0, 10, 0, 0, 210);
    pg.addColorStop(0, `rgba(255,236,175,${0.48 * beamStrength})`);
    pg.addColorStop(0.55, `rgba(255,175,75,${0.22 * beamStrength})`);
    pg.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, 210, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // ---- draw one of the 8 monochrome "ordinary" circle Yarises ----
  function drawNpcYaris(x, floorY, depthScale, facingRight, b, dimBack) {
    const w = L.npcW * depthScale;
    const h = w * plaqueAspect;
    const dw = w * b.sx;
    const dh = h * b.sy;
    const lift = clamp(b.h / 120);

    // Ground contact shadow
    ctx.save();
    ctx.translate(x, floorY + 4);
    ctx.scale(1, 0.22);
    const sw = dw * (0.56 - 0.14 * lift);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, sw);
    sg.addColorStop(0, `rgba(0,0,0,${0.80 - 0.42 * lift})`);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, sw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bouncing monochrome NPC Yaris (facing inward toward the center!)
    ctx.save();
    ctx.translate(x + b.lean * 12 * depthScale, floorY - b.h);
    ctx.rotate(b.lean * 0.08);
    if (facingRight) ctx.scale(-1, 1);

    // Subtle depth darkening for back of circle
    ctx.globalAlpha = lerp(0.58, 0.96, dimBack);
    ctx.drawImage(npcCanvas, -dw / 2, -dh, dw, dh);

    // Subtle cool rim stroke
    ctx.strokeStyle = `rgba(180, 195, 215, ${0.18 * dimBack})`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, -dw / 2 + 1, -dh + 1, dw - 2, dh - 2, 10 * depthScale);
    ctx.stroke();

    ctx.restore();
  }

  // ---- render & draw THE CHOSEN ONE (Yaris -> bounce-swapping real gallery photos!) ----
  function drawGallerySwapToHero(c, item, x, y, w, h, r, b, justSwapped) {
    const img = item.img;
    const natW = img.naturalWidth || w;
    const natH = img.naturalHeight || h;
    const edgeX = 3 + b.lean * 5;
    const edgeY = 9;

    if (item.cutout) {
      const sc = Math.min(w / natW, h / natH);
      const dw = natW * sc;
      const dh = natH * sc;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh);

      c.save();
      c.shadowColor = 'rgba(20, 10, 3, 0.85)';
      c.shadowBlur = 12;
      c.shadowOffsetX = edgeX;
      c.shadowOffsetY = edgeY;
      c.drawImage(img, dx, dy, dw, dh);
      c.restore();

      const flash = justSwapped ? Math.pow(b.kick, 2.5) * 0.28 : 0;
      if (flash > 0.01) {
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = `rgba(255, 232, 180, ${flash})`;
        c.fillRect(dx, dy, dw, dh);
        c.restore();
      }
      return;
    }

    c.fillStyle = C.woodChar;
    roundRect(c, x + edgeX, y + edgeY, w, h, r);
    c.fill();
    c.fillStyle = C.woodEdge;
    roundRect(c, x + edgeX * 0.5, y + edgeY * 0.5, w, h, r);
    c.fill();

    c.save();
    roundRect(c, x, y, w, h, r);
    c.clip();

    const sc = Math.max(w / natW, h / natH);
    const dw = natW * sc;
    const dh = natH * sc;
    c.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);

    const flash = justSwapped ? Math.pow(b.kick, 2.5) * 0.26 : 0;
    if (flash > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(255, 232, 180, ${flash})`;
      c.fillRect(x, y, w, h);
      c.restore();
    }
    c.restore();

    c.strokeStyle = 'rgba(255, 224, 155, 0.60)';
    c.lineWidth = 2.5;
    roundRect(c, x + 1, y + 1, w - 2, h - 2, r - 1);
    c.stroke();
  }

  function updateHeroBuffer(t, b) {
    const hw = L.heroW;
    const hh = Math.round(hw * plaqueAspect);
    const c = hCtx;
    c.clearRect(0, 0, heroBuf.width, heroBuf.height);
    const x = PAD, y = PAD, r = 16;

    // Part 2 (Beat 16+): Chosen One morphs to a new real gallery photo every 2 jumps!
    if (t >= SWAP0 && gallery.length > 0) {
      const beatsSinceSwap = Math.floor((t - SWAP0) / BEAT);
      const idx = Math.floor(beatsSinceSwap / 2) % gallery.length;
      const justSwapped = (beatsSinceSwap % 2) === 0;
      drawGallerySwapToHero(c, gallery[idx], x, y, hw, hh, r, b, justSwapped);
      return;
    }

    // 4 mm laser-cut birch plywood extruded edge
    const edgeX = 3 + b.lean * 5;
    const edgeY = 9;
    c.fillStyle = C.woodChar;
    roundRect(c, x + edgeX, y + edgeY, hw, hh, r);
    c.fill();
    c.fillStyle = C.woodEdge;
    roundRect(c, x + edgeX * 0.5, y + edgeY * 0.5, hw, hh, r);
    c.fill();

    c.save();
    roundRect(c, x, y, hw, hh, r);
    c.clip();

    // Base birch + engraved reveal during ignition sweep (or full plaque after BURN1)
    const burnP = prog(t, BURN0, BURN1);
    if (t < BURN0) {
      c.drawImage(blank, x, y, hw, hh);
    } else if (burnP < 1) {
      c.drawImage(blank, x, y, hw, hh);
      c.save();
      c.beginPath();
      c.rect(x, y, hw, hh * burnP);
      c.clip();
      c.drawImage(plaque, x, y, hw, hh);
      c.restore();

      // Molten glowing laser ignition band sweeping down the Chosen One!
      const sy = y + hh * burnP;
      c.save();
      c.globalCompositeOperation = 'lighter';
      if (emberCanvas) {
        const strips = 6, bandH = 56, stepH = bandH / strips;
        for (let i = 0; i < strips; i++) {
          const topY = sy - (i + 1) * stepH;
          const cTop = Math.max(y, topY);
          const cBot = Math.min(sy, topY + stepH + 0.5);
          if (cBot <= cTop) continue;
          c.save();
          c.beginPath();
          c.rect(x, cTop, hw, cBot - cTop);
          c.clip();
          c.globalAlpha = Math.pow(1 - i / strips, 1.8) * 0.95;
          c.drawImage(emberCanvas, x, y, hw, hh);
          c.restore();
        }
      }
      // Hot laser scanline
      const lg = c.createLinearGradient(0, sy - 22, 0, sy + 6);
      lg.addColorStop(0, 'rgba(255,140,40,0)');
      lg.addColorStop(0.8, 'rgba(255,200,110,0.9)');
      lg.addColorStop(1, 'rgba(255,90,40,0)');
      c.fillStyle = lg;
      c.fillRect(x, sy - 22, hw, 28);
      c.restore();
    } else {
      c.drawImage(plaque, x, y, hw, hh);
      // Cooling ember glow right after burn finishes
      const cool = 1 - prog(t, BURN1, BURN1 + 1.5 * BEAT);
      if (cool > 0 && emberCanvas) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = cool * 0.65;
        c.drawImage(emberCanvas, x, y, hw, hh);
        c.restore();
      }
    }

    // Radiant golden studio sheen warping with every rubber bounce
    const sheenX = (1 - b.sy) * 280 + b.lean * 150;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(x + hw * 0.5 + sheenX, y + hh * 0.5);
    c.rotate(-0.32 + b.lean * 0.14);
    const sg = c.createLinearGradient(-140, 0, 140, 0);
    sg.addColorStop(0, 'rgba(255,244,210,0)');
    sg.addColorStop(0.5, 'rgba(255,244,210,0.26)');
    sg.addColorStop(1, 'rgba(255,244,210,0)');
    c.fillStyle = sg;
    c.fillRect(-140, -hh, 280, hh * 2);
    c.restore();

    // Completion golden flash
    const fl = 1 - prog(t, BURN1, BURN1 + 1.1 * BEAT);
    if (t >= BURN1 && fl > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.pow(fl, 1.5) * 0.5;
      c.fillStyle = '#ffe5ad';
      c.fillRect(x, y, hw, hh);
      c.restore();
    }

    c.restore();

    // Radiant warm golden-birch rim border
    c.strokeStyle = 'rgba(255, 224, 155, 0.55)';
    c.lineWidth = 2.5;
    roundRect(c, x + 1, y + 1, hw - 2, hh - 2, r - 1);
    c.stroke();
  }

  function drawChosenOne(t, floorY, scale, kick) {
    if (t < ARRIVE0) return null;

    const landed = t >= LAND;
    let b;
    let extraDropH = 0;
    let appearAlpha = 1;

    if (!landed) {
      // Dramatic descent straight down the heavenly spotlight beam!
      const u = prog(t, ARRIVE0, LAND);
      appearAlpha = clamp(u * 4);
      extraDropH = 520 * Math.pow(1 - u, 2.2);
      const sy = 1 + 0.24 * Math.pow(u, 1.5);
      b = { h: extraDropH, sy, sx: Math.pow(sy, -0.6), lean: 0, u: 0, kick: 0 };
    } else {
      // Full unhinged Bouncing Yaris rubber physics synced to the circle!
      const intensity = 0.96;
      b = bounceSample(t, intensity, L.peakHero * scale, 0);
    }

    updateHeroBuffer(t, b);

    // Radiant golden aura behind the Chosen Wooden Yaris
    const auraY = floorY - b.h - (L.heroW * plaqueAspect * scale * 0.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = appearAlpha * (0.34 + 0.16 * kick);
    const ag = ctx.createRadialGradient(CX, auraY, 20, CX, auraY, L.heroW * scale * 0.85);
    ag.addColorStop(0, 'rgba(255, 210, 115, 0.85)');
    ag.addColorStop(0.5, 'rgba(193, 39, 45, 0.35)');
    ag.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ag;
    ctx.fillRect(CX - 360, auraY - 300, 720, 600);
    ctx.restore();

    // Dynamic contact shadow
    const liftNorm = clamp(b.h / 260);
    const sw = L.heroW * scale * b.sx * (0.64 - 0.22 * liftNorm);
    ctx.save();
    ctx.globalAlpha = appearAlpha;
    ctx.translate(CX + b.lean * 14 * scale, floorY + 5);
    ctx.scale(1, 0.22);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, sw);
    sg.addColorStop(0, `rgba(0,0,0,${0.92 - 0.52 * liftNorm})`);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, sw, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 28-slice rubber squash-and-stretch
    const SLICES = 28;
    const srcW = heroBuf.width;
    const srcH = heroBuf.height;
    const sliceSy = new Float32Array(SLICES);
    const sliceSx = new Float32Array(SLICES);
    const sliceLean = new Float32Array(SLICES);
    let sumSy = 0;

    for (let i = 0; i < SLICES; i++) {
      const v = (i + 0.5) / SLICES;
      const s = landed
        ? bounceSample(Math.max(LAND, t - v * 0.042), 0.96, L.peakHero * scale, 0)
        : b;
      sliceSy[i] = s.sy;
      const belly = 1 + (1 - s.sy) * 0.26 * Math.sin(Math.PI * v);
      sliceSx[i] = s.sx * belly;
      sliceLean[i] = s.lean * 42 * v * v * scale;
      sumSy += s.sy;
    }

    const totalDstH = srcH * scale * (sumSy / SLICES);
    const padShift = PAD * scale * sliceSy[0];
    let curBottom = (floorY - b.h) + padShift;

    ctx.save();
    ctx.globalAlpha = appearAlpha;
    for (let i = 0; i < SLICES; i++) {
      const dh = totalDstH * (sliceSy[i] / sumSy);
      const dstY = curBottom - dh;
      const srcY = srcH * (1 - (i + 1) / SLICES);
      const srcSliceH = srcH / SLICES;
      const dstW = srcW * scale * sliceSx[i];
      const dstX = CX + sliceLean[i] - dstW / 2;
      ctx.drawImage(heroBuf, 0, srcY, srcW, srcSliceH, dstX, dstY - 0.6, dstW, dh + 1.4);
      curBottom = dstY;
    }
    ctx.restore();

    return b;
  }

  // ---- typography & UI helpers ----
  function setFont(size, weight = 700, stretch = 'expanded') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if ('fontStretch' in ctx) ctx.fontStretch = stretch;
  }

  function maskedText(str, y, size, color, pIn, pOut = 1, {
    weight = 700,
    stretch = 'expanded',
    maxW = 940,
    spacing = '0px',
    beatPop = 0,
  } = {}) {
    const a = Math.min(clamp(pIn), clamp(pOut));
    if (a <= 0.001) return;

    ctx.save();
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
    setFont(size, weight, stretch);
    let finalSize = size;
    const measured = ctx.measureText(str).width;
    if (measured > maxW) {
      finalSize = size * maxW / measured;
      setFont(finalSize, weight, stretch);
    }

    const maskTop = y - finalSize * 1.25;
    const maskH = finalSize * 1.58;
    ctx.beginPath();
    ctx.rect(0, maskTop, W, maskH);
    ctx.clip();

    const offsetIn = (1 - easeOut4(clamp(pIn))) * finalSize * 1.12;
    const offsetOut = -(1 - easeInOut(clamp(pOut))) * finalSize * 0.72;

    ctx.globalAlpha = clamp(a * 1.35);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    if (beatPop > 0.001) {
      ctx.translate(CX, y + offsetIn + offsetOut);
      ctx.scale(1 + beatPop * 0.04, 1 - beatPop * 0.035);
      ctx.fillText(str, 0, 0);
    } else {
      ctx.fillText(str, CX, y + offsetIn + offsetOut);
    }
    ctx.restore();
  }

  function drawPill(x, y, label, alpha, {
    dot = false,
    accent = false,
    fontSize = 20,
    px = 22,
    h = 40,
    spacing = '2.5px',
  } = {}) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
    setFont(fontSize, 600, 'normal');
    const tw = ctx.measureText(label).width;
    const dotW = dot ? 20 : 0;
    const w = tw + px * 2 + dotW;

    ctx.fillStyle = accent ? 'rgba(193,39,45,0.22)' : 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = accent ? 'rgba(193,39,45,0.60)' : 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.stroke();

    if (dot) {
      ctx.fillStyle = C.bright;
      ctx.beginPath();
      ctx.arc(x - w / 2 + px + 4, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = accent ? '#ffd9d9' : C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + dotW * 0.45, y + 1);
    ctx.restore();
  }

  function drawHashtags(y, p1, p2, p3) {
    const tags = [
      { word: 'darekzfotky', p: clamp(p1) },
      { word: 'originalnidarek', p: clamp(p2) },
      { word: 'ceskavyroba', p: clamp(p3) },
    ];
    if (tags.every(tag => tag.p <= 0.01)) return;

    let fontSize = L.tagFont, px = 18, h = L.tagH, gap = 12;
    ctx.save();
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.8px';
    setFont(fontSize, 600, 'normal');
    let hashW = ctx.measureText('#').width;
    let widths = tags.map(tag => hashW + ctx.measureText(tag.word).width + px * 2);
    let totalW = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
    if (totalW > 960) {
      const k = 960 / totalW;
      fontSize *= k;
      px *= k;
      gap *= k;
      setFont(fontSize, 600, 'normal');
      hashW = ctx.measureText('#').width;
      widths = tags.map(tag => hashW + ctx.measureText(tag.word).width + px * 2);
      totalW = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
    }
    let cursorX = CX - totalW / 2;

    for (let i = 0; i < tags.length; i++) {
      const { word, p } = tags[i];
      const w = widths[i];
      if (p > 0.01) {
        const ty = y + (1 - easeOut3(p)) * 14;
        ctx.save();
        ctx.globalAlpha = p;
        ctx.fillStyle = 'rgba(193,39,45,0.16)';
        ctx.strokeStyle = 'rgba(193,39,45,0.48)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, cursorX, ty - h / 2, w, h, h / 2);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ff524d';
        ctx.fillText('#', cursorX + px, ty + 1);
        ctx.fillStyle = C.ink;
        ctx.fillText(word, cursorX + px + hashW, ty + 1);
        ctx.restore();
      }
      cursorX += w + gap;
    }
    ctx.restore();
  }

  // ---- editorial copy (no CTA button — Meta adds its own!) ----
  function drawCopy(t, kick) {
    const ebA = inOut(t, 0.2 * BEAT, END0 - 0.4 * BEAT, 0.28, 0.25);
    if (ebA > 0) {
      drawPill(CX, L.eyebrowY, 'DÁRKY DŘEVO  ·  LASEROVÉ GRAVÍROVÁNÍ', ebA, {
        dot: true,
        accent: t >= LAND && t < END0,
        fontSize: L.eyebrowFont,
        px: 22,
        h: L.eyebrowH,
        spacing: '2.5px',
      });
    }

    // Acts 1–2: Main line right from the start while the circle ritual & Chosen Wooden Yaris land!
    maskedText('DÁREK PRO', L.h1Y, L.h1Size, C.ink,
      prog(t, 0.3 * BEAT, 1.3 * BEAT), 1 - prog(t, HERO0 - 0.6 * BEAT, HERO0),
      { beatPop: t >= LAND ? kick * 0.65 : 0 });
    maskedText('KAŽDÉHO ŘIDIČE.', L.h2Y, L.h2Size, t >= LAND ? C.gold : C.bright,
      prog(t, 1.0 * BEAT, 2.1 * BEAT), 1 - prog(t, HERO0 - 0.6 * BEAT, HERO0),
      { beatPop: t >= LAND ? kick * 0.65 : 0 });

    // Act 3: Broadens to ANY photo while Chosen One swaps gallery photos on every bounce!
    maskedText('Z JAKÉKOLIV FOTKY.', L.h1Y, L.h1Size, C.ink,
      prog(t, HERO0 + 0.1 * BEAT, HERO0 + 1.1 * BEAT), 1 - prog(t, END0 - 0.7 * BEAT, END0),
      { beatPop: kick });
    maskedText('PŘÍMO DO DŘEVA.', L.h2Y, L.h2Size, C.bright,
      prog(t, HERO0 + 0.5 * BEAT, HERO0 + 1.5 * BEAT), 1 - prog(t, END0 - 0.7 * BEAT, END0),
      { beatPop: kick });

    const offerOut = 1 - prog(t, END0 - 0.7 * BEAT, END0);
    if (t >= HERO0 + 0.2 * BEAT && offerOut > 0) {
      maskedText('od 299 Kč', L.priceY, L.priceSize, C.ink,
        prog(t, HERO0 + 0.5 * BEAT, HERO0 + 1.5 * BEAT), offerOut,
        { beatPop: kick * 0.85 });
      drawHashtags(
        L.tagsHeroY,
        Math.min(prog(t, HERO0 + 1.0 * BEAT, HERO0 + 1.8 * BEAT), offerOut),
        Math.min(prog(t, HERO0 + 1.3 * BEAT, HERO0 + 2.1 * BEAT), offerOut),
        Math.min(prog(t, HERO0 + 1.6 * BEAT, HERO0 + 2.4 * BEAT), offerOut),
      );
    }

    // Act 4: Clean End Card (no CTA button!)
    const endP = prog(t, END0 + 0.3 * BEAT, END0 + 1.4 * BEAT);
    if (endP > 0) {
      maskedText('POŠLI FOTKU A MY JI VYPÁLÍME', L.kickerY, 26, C.muted,
        prog(t, END0 + 0.4 * BEAT, END0 + 1.4 * BEAT), 1,
        { weight: 600, stretch: 'normal', spacing: '3.5px' });

      const logoP = prog(t, END0 + 0.6 * BEAT, END0 + 1.7 * BEAT);
      if (logoP > 0 && logo) {
        const lh = L.logoH;
        const lw = lh * logo.width / logo.height;
        ctx.save();
        ctx.globalAlpha = easeOut3(logoP);
        ctx.drawImage(logo, CX - lw / 2, L.logoY + (1 - easeOut4(logoP)) * 24, lw, lh);
        ctx.restore();
      }

      maskedText('Auto, mazlíček nebo rodinná fotka', L.endCopyY, L.endCopySize, C.muted,
        prog(t, END0 + 0.9 * BEAT, END0 + 1.9 * BEAT), 1,
        { weight: 500, stretch: 'normal', maxW: 940 });

      maskedText('od 299 Kč', L.domainY, L.domainSize + 10, C.bright,
        prog(t, END0 + 1.2 * BEAT, END0 + 2.2 * BEAT), 1,
        { weight: 700, stretch: 'expanded', beatPop: kick * 0.7 });

      drawHashtags(
        L.tagsEndY,
        prog(t, END0 + 1.5 * BEAT, END0 + 2.4 * BEAT),
        prog(t, END0 + 1.8 * BEAT, END0 + 2.7 * BEAT),
        prog(t, END0 + 2.1 * BEAT, END0 + 3.0 * BEAT),
      );
    }
  }

  function drawSafeZoneOverlay() {
    if (L.safeTop == null || L.safeBottom == null) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 60, 60, 0.10)';
    ctx.fillRect(0, 0, W, L.safeTop);
    ctx.fillRect(0, L.safeBottom, W, H - L.safeBottom);
    ctx.strokeStyle = 'rgba(255, 90, 90, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(0, L.safeTop); ctx.lineTo(W, L.safeTop);
    ctx.moveTo(0, L.safeBottom); ctx.lineTo(W, L.safeBottom);
    ctx.stroke();
    ctx.setLineDash([]);
    setFont(22, 600, 'normal');
    ctx.fillStyle = 'rgba(255, 160, 160, 0.95)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`META SAFE ZONE TOP · ${L.safeTop} px`, 24, L.safeTop - 10);
    ctx.textBaseline = 'top';
    ctx.fillText(`META SAFE ZONE BOTTOM · ${L.safeBottom} px`, 24, L.safeBottom + 10);
    ctx.restore();
  }

  // ---- main frame renderer ----
  let lastBeatIdx = -1;
  let landedTriggered = false;

  // Target symmetrical 8-car ritual amphitheater angles (leaves front-center open for Chosen One!)
  // Angles in radians where -PI/2 = back center, +PI/2 = front center
  const AMPHI_ANGLES = [
    -Math.PI * 0.84, // back-left inner
    -Math.PI * 0.62, // back-left outer
    -Math.PI * 0.38, // back-right outer
    -Math.PI * 0.16, // back-right inner
     Math.PI * 0.08, // mid-right
     Math.PI * 0.29, // front-right (clear of center!)
     Math.PI * 0.71, // front-left (clear of center!)
     Math.PI * 0.92, // mid-left
  ];

  function render(t, dt, { hideGuides = false } = {}) {
    const uEnd = easeInOut(prog(t, END0, END0 + 1.8 * BEAT));
    const uPart = easeInOut(prog(t, BEAM0, LAND + 0.5 * BEAT));
    const beamIn = easeOut3(prog(t, BEAM0, LAND));
    const beamStrength = beamIn * (1 - 0.38 * uEnd);
    const heroArrived = easeOut3(prog(t, LAND, LAND + 1.2 * BEAT));

    const worldScale = lerp(1.0, L.endScale, uEnd);
    const cy = lerp(L.circleYMain, L.circleYEnd, uEnd);
    const rx = L.rxMain * worldScale * (1 + 0.08 * uPart);
    const ry = L.ryMain * worldScale;
    const heroFloorY = cy + L.heroFloorOffset * worldScale;

    const mainBeat = bounceSample(t, 0.9, L.peakHero, 0);
    const beatIdx = Math.floor((t - BEAT0) / BEAT);

    // Big golden shockwave when Chosen One slams down on Beat 10!
    if (dt > 0 && !landedTriggered && t >= LAND) {
      emitLandingBurst(CX, heroFloorY, 1.2);
      landedTriggered = true;
    }
    // Periodic beat ripples after Chosen One lands
    if (dt > 0 && beatIdx !== lastBeatIdx) {
      if (t >= LAND + BEAT * 0.5) {
        waves.push({ x: CX, y: heroFloorY + 4, r: 45, maxR: 320 * worldScale, life: 0, max: 0.48, gold: true });
      }
      lastBeatIdx = beatIdx;
    }
    if (dt > 0 && t >= BEAM0) {
      emitAmbientEmber(CX, heroFloorY, 170 * worldScale);
    }
    if (dt > 0) stepParticles(dt);

    // Bass-thump punch (extra big right when Chosen One lands!)
    const landThump = t >= LAND ? Math.exp(-(t - LAND) * 7) * 18 : 0;
    const thumpY = mainBeat.kick * (6 + 5 * heroArrived * (1 - uEnd)) + landThump;
    const thumpZoom = 1 + mainBeat.kick * (0.010 + 0.008 * heroArrived * (1 - uEnd)) + landThump * 0.0012;
    const pivotY = L.safeTop != null ? (L.safeTop + L.safeBottom) * 0.5 : H * 0.5;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgLayer, 0, 0);

    ctx.save();
    ctx.translate(CX, pivotY + thumpY);
    ctx.scale(thumpZoom, thumpZoom);
    ctx.translate(-CX, -pivotY);

    // 1. Perspective ritual circle floor & expanding shockwave ripples
    drawRitualFloor(cy, rx, ry, mainBeat.kick, heroArrived, uEnd);
    drawWaves();

    // 2. Compute all 8 monochrome circle Yarises & depth-sort around the Chosen One!
    const orbitSpin = t * 0.65 * (1 - uPart) + Math.sin(t * 0.9) * 0.08 * uPart;
    const drawList = [];

    for (let i = 0; i < 8; i++) {
      const baseAngle = (i / 8) * Math.PI * 2 - Math.PI * 0.5 + orbitSpin;
      // Smoothly transition from spinning full circle into parted amphitheater so front stays open
      let diff = AMPHI_ANGLES[i] - baseAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const ang = baseAngle + diff * uPart + Math.sin(t * 1.1 + i) * 0.03 * uPart;

      const sinA = Math.sin(ang); // -1 = back, +1 = front
      const cosA = Math.cos(ang); // -1 = left, +1 = right
      const x = CX + cosA * rx;
      const y = cy + sinA * ry;
      const depth01 = (sinA + 1) * 0.5; // 0 = back, 1 = front
      const depthScale = lerp(0.62, 1.0, depth01) * worldScale;

      // Slight wave offset around the circle in Act 1, snapping into full unison once Chosen One lands!
      const phaseOff = (i % 2) * 0.06 * (1 - heroArrived);
      const b = bounceSample(t, 0.78, L.peakNpc * depthScale, phaseOff);

      drawList.push({
        kind: 'npc',
        sortY: y,
        x,
        y,
        depthScale,
        facingRight: cosA < 0, // plaque.webp faces left natively -> flip left half so ALL 8 stare inward!
        b,
        dimBack: depth01,
      });
    }

    // Insert the Chosen One at its floor depth so back NPCs render behind it and front-side NPCs frame it
    drawList.push({ kind: 'hero', sortY: heroFloorY - 20 });
    drawList.sort((a, b) => a.sortY - b.sortY);

    // 3. Draw back beam behind Chosen One + depth-sorted entities
    for (const item of drawList) {
      if (item.kind === 'hero') {
        drawHeavenlyBeam(t, heroFloorY, beamStrength, mainBeat.kick);
        drawChosenOne(t, heroFloorY, worldScale, mainBeat.kick);
      } else {
        drawNpcYaris(item.x, item.y, item.depthScale, item.facingRight, item.b, item.dimBack);
      }
    }

    drawSparks();
    ctx.restore();

    // 4. Screen-space typography
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawCopy(t, mainBeat.kick);

    const fade = Math.max(1 - prog(t, 0, 0.16), prog(t, FADE_OUT, T - 0.04));
    if (fade > 0) {
      ctx.fillStyle = `rgba(7,7,9,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (showSafeZone && !hideGuides) drawSafeZoneOverlay();
  }

  // ---- controls, format switching & 60 fps MP4 export ----
  const btnRec = document.getElementById('rec');
  const btnPlay = document.getElementById('play');
  const btnFmt = document.getElementById('fmt');
  const btnSafe = document.getElementById('safe');
  const btnScale = document.getElementById('scale');
  const scrub = document.getElementById('scrub');
  const timeEl = document.getElementById('time');
  const statusEl = document.getElementById('status');

  function clearParticles() {
    sparks = [];
    waves = [];
    lastBeatIdx = -1;
    landedTriggered = false;
  }

  function applyFormat(key) {
    L = FORMATS[key] || FORMATS['9x16'];
    W = L.w; H = L.h; CX = W / 2;
    cv.width = W; cv.height = H;
    document.documentElement.style.setProperty('--ad-w', String(W));
    document.documentElement.style.setProperty('--ad-h', String(H));

    if (btnFmt) btnFmt.textContent = L.label;
    if (btnSafe) {
      btnSafe.style.display = L.safeTop != null ? '' : 'none';
      btnSafe.classList.toggle('active', showSafeZone && L.safeTop != null);
    }

    initHeroBuffer();
    buildBackground();
    clearParticles();
    if (plaque && blank) {
      const curT = paused ? pausedT : (((performance.now() - start) / 1000) % T);
      render(curT, 0);
    }
  }

  if (btnFmt) btnFmt.addEventListener('click', () => { if (!exporting) applyFormat(L.key === '9x16' ? '4x5' : '9x16'); });
  if (btnSafe) btnSafe.addEventListener('click', () => {
    showSafeZone = !showSafeZone;
    btnSafe.classList.toggle('active', showSafeZone);
    if (paused && plaque) render(pausedT, 0);
  });
  if (btnScale) btnScale.addEventListener('click', () => {
    const native = document.body.classList.toggle('native-size');
    btnScale.textContent = native ? 'Přizpůsobit' : '1:1';
  });

  const audio = new Audio('assets/song.mp3');
  let audioOK = false, audioOn = false;
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => { audioOK = true; statusEl.textContent = 'Klikněte pro zvuk'; }, { once: true });
  audio.addEventListener('error', () => { statusEl.textContent = ''; });

  function syncAudio(t = 0) {
    if (!audioOK || !audioOn) return;
    audio.currentTime = SONG_OFFSET + t;
    if (!paused) audio.play().catch(() => {});
  }
  function enableAudio() {
    if (!audioOK || audioOn) return;
    audioOn = true;
    statusEl.textContent = '';
    syncAudio(paused ? pausedT : (((performance.now() - start) / 1000) % T));
  }
  addEventListener('pointerdown', enableAudio);
  addEventListener('keydown', enableAudio);

  let start = 0, last = 0, lastLoopT = 0;
  let paused = false, pausedT = 0;
  let exporting = false, scrubbing = false;

  function updateHUD(t) {
    if (timeEl) timeEl.textContent = `${t.toFixed(1)} / ${T.toFixed(1)} s`;
    if (scrub && !scrubbing) scrub.value = t.toFixed(2);
    if (btnPlay) btnPlay.textContent = paused ? '▶' : '❚❚';
  }

  function seekTo(s) {
    const clamped = ((s % T) + T) % T;
    clearParticles();
    if (clamped >= LAND) landedTriggered = true;
    pausedT = clamped;
    start = performance.now() - clamped * 1000;
    lastLoopT = clamped;
    syncAudio(clamped);
    render(clamped, 0);
    updateHUD(clamped);
  }

  function restart() {
    paused = false;
    clearParticles();
    start = last = performance.now();
    lastLoopT = 0;
    pausedT = 0;
    syncAudio(0);
    updateHUD(0);
  }

  function togglePlay() {
    if (exporting) return;
    if (paused) {
      paused = false;
      start = performance.now() - pausedT * 1000;
      last = performance.now();
      syncAudio(pausedT);
    } else {
      paused = true;
      pausedT = ((performance.now() - start) / 1000) % T;
      if (audioOK && audioOn) audio.pause();
    }
    updateHUD(pausedT);
  }

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!paused && !exporting) {
      const t = ((now - start) / 1000) % T;
      if (t < lastLoopT) {
        clearParticles();
        syncAudio(t);
      }
      lastLoopT = t;
      render(t, dt);
      updateHUD(t);
    }
    requestAnimationFrame(frame);
  }

  async function exportQuickTimeMP4() {
    const FPS = 60;
    const totalFrames = Math.round(T * FPS);
    const videoBitrate = Math.min(10_000_000, Math.floor((21 * 1024 * 1024 * 8) / T));
    const profiles = [
      { codec: 'avc1.42e02a', latencyMode: 'quality' },
      { codec: 'avc1.42002a', latencyMode: 'quality' },
      { codec: 'avc1.4d402a', latencyMode: 'realtime' },
    ];
    let vCfg = null;
    for (const p of profiles) {
      const cand = { codec: p.codec, width: W, height: H, bitrate: videoBitrate, framerate: FPS, latencyMode: p.latencyMode, avc: { format: 'avc' } };
      const sup = await VideoEncoder.isConfigSupported(cand);
      if (sup.supported) { vCfg = { ...cand, ...sup.config, avc: { format: 'avc' } }; break; }
    }
    if (!vCfg) throw new Error('WebCodecs H.264 encoder unavailable');

    const target = new Mp4Muxer.ArrayBufferTarget();
    const muxer = new Mp4Muxer.Muxer({
      target,
      video: { codec: 'avc', width: W, height: H, frameRate: FPS },
      fastStart: 'in-memory',
      firstTimestampBehavior: 'strict',
    });

    let encodeErr = null, encodedFrames = 0;
    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => {
        const outTs = Math.round(encodedFrames * 1e6 / FPS);
        const outDur = Math.round((encodedFrames + 1) * 1e6 / FPS) - outTs;
        encodedFrames++;
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        muxer.addVideoChunkRaw(data, chunk.type, outTs, outDur, meta);
      },
      error: e => { encodeErr = e; },
    });
    videoEncoder.configure(vCfg);

    clearParticles();
    const dt = 1 / FPS;
    for (let i = 0; i < totalFrames; i++) {
      if (encodeErr) throw encodeErr;
      render(i / FPS, dt, { hideGuides: true });
      const ts = Math.round(i * 1e6 / FPS);
      const nextTs = Math.round((i + 1) * 1e6 / FPS);
      const vf = new VideoFrame(cv, { timestamp: ts, duration: nextTs - ts });
      videoEncoder.encode(vf, { keyFrame: i % (FPS * 2) === 0 });
      vf.close();
      while (videoEncoder.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 6));
      if (i % 6 === 0) {
        statusEl.textContent = `Exportuji ${L.key}: ${Math.round((i / totalFrames) * 100)} %…`;
        updateHUD(i / FPS);
        await new Promise(r => setTimeout(r, 0));
      }
    }
    await videoEncoder.flush();
    videoEncoder.close();
    if (encodeErr) throw encodeErr;
    muxer.finalize();
    return new Blob([target.buffer], { type: 'video/mp4' });
  }

  async function record() {
    if (exporting || typeof VideoEncoder === 'undefined' || !window.Mp4Muxer) return;
    exporting = true;
    btnRec.disabled = true;
    if (audioOK && audioOn) audio.pause();
    statusEl.textContent = 'Připravuji export MP4…';
    try {
      const blob = await exportQuickTimeMP4();
      const mb = (blob.size / 1048576).toFixed(1);
      const filename = `darkydrevo-yaris-circle-${L.key}.mp4`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      statusEl.textContent = `Uloženo: ${filename} (${mb} MB · 60 fps) ✓`;
    } catch (err) {
      statusEl.textContent = `Chyba exportu: ${err.message}`;
    } finally {
      exporting = false;
      btnRec.disabled = false;
      restart();
    }
  }

  btnRec.addEventListener('click', record);
  if (btnPlay) btnPlay.addEventListener('click', togglePlay);
  if (scrub) {
    scrub.max = T.toFixed(2);
    scrub.addEventListener('pointerdown', () => { scrubbing = true; });
    addEventListener('pointerup', () => { scrubbing = false; });
    scrub.addEventListener('change', () => { scrubbing = false; });
    scrub.addEventListener('input', e => seekTo(+e.target.value));
  }
  addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (k === 'r') record();
    else if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    else if (k === '0') restart();
  });

  // ---- boot ----
  Promise.all([
    loadImg('assets/plaque.webp'),
    loadImg('assets/blank.webp'),
    loadImg('assets/logo.svg'),
    Promise.all(GALLERY_SPECS.map(g => loadImg(g.src).then(img => ({ img, cutout: g.cutout })).catch(() => null))),
    document.fonts.load(`700 100px ${FONT}`, 'DÁREK PRO KAŽDÉHO ŘIDIČE Z JAKÉKOLIV FOTKY PŘÍMO DO DŘEVA'),
    document.fonts.load(`500 40px ${FONT}`, 'Auto, mazlíček nebo rodinná fotka POŠLI VYPÁLÍME'),
  ]).then(([p, b, l, gal]) => {
    plaque = p;
    blank = b;
    logo = l;
    gallery = gal.filter(Boolean);
    if (plaque.naturalWidth > 0) plaqueAspect = plaque.naturalHeight / plaque.naturalWidth;
    buildDerivedAssets(blank, plaque);
    applyFormat(initFmtKey);
    restart();
    requestAnimationFrame(frame);

    window.__ad = {
      render,
      T,
      seek: seekTo,
      setFormat: applyFormat,
      pause: () => { if (!paused) togglePlay(); },
      play: () => { if (paused) togglePlay(); },
      isPaused: () => paused,
    };
  });
})();
