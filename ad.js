// Dárky Dřevo – Bouncing Yaris meme × Laser Atelier Meta Ad.
// Supports 9:16 (1080×1920, Meta Reels/Stories safe zone 269–1248 px) and 4:5 (1080×1350, Feed).
// 32 beats (12.8 s @ 150 BPM), 60 fps QuickTime-compatible MP4 (< 30 MB), no fake CTA button.
(() => {
  const cv = document.getElementById('stage');
  const ctx = cv.getContext('2d');

  // ---- brand palette (darkydrevo.cz) ----
  const C = {
    bg: '#08080a',
    ink: '#fbfafa',
    muted: '#d6d2ce',
    dim: '#8f8b87',
    brand: '#a62b2b',
    bright: '#c1272d',
    woodEdge: '#6d4d2f',
    woodChar: '#2d1c10',
  };
  const FONT = '"Archivo Variable", system-ui, -apple-system, sans-serif';

  // ---- beat-locked timeline synced to assets/song.mp3 ("Why's This Dealer?", exact 135 BPM) ----
  // Starting at 10.000 s: beat grid lands at t = 0.260 + k*(60/135); massive bass drop at t = 4.260 s (song 14.260 s)!
  const qs = new URLSearchParams(location.search);
  const BPM = +qs.get('bpm') || 135;
  const BEAT = 60 / BPM;            // 0.44444 s @ 135 BPM
  const SONG_OFFSET = qs.has('offset') ? +qs.get('offset') : 10.0;
  const BEAT0 = qs.has('phase') ? +qs.get('phase') : 0.260;

  const DROP_HIT = BEAT0;                   // Beat 0  (0.260 s -> song 10.260 s)
  const BP0 = BEAT0 + 0.15 * BEAT;
  const BP1 = BEAT0 + 1.85 * BEAT;
  const SCAN0 = BEAT0 + 2 * BEAT;           // Beat 2  (1.149 s -> song 11.149 s)
  const SCAN1 = BEAT0 + 9 * BEAT;           // Beat 9  (4.260 s -> EXACT song 14.260 s BASS DROP!)
  const HERO0 = BEAT0 + 17 * BEAT;          // Beat 17 (7.816 s -> 2 bars after drop, Part 2 begins!)
  const END0 = BEAT0 + 25 * BEAT;           // Beat 25 (11.371 s -> End card)
  const T = BEAT0 + 33 * BEAT;              // Beat 33 (14.927 s -> exact 6 bars after drop!)
  const FADE_OUT = T - 0.45;

  // ---- format presets ----
  // 9x16: ALL key copy, bouncing plaque, laser, logo, price & hashtags stay strictly in y ∈ [269, 1248] px
  // 4x5:  full Instagram/Facebook Feed composition in 1080×1350 px
  const FORMATS = {
    '9x16': {
      key: '9x16',
      label: '9:16 · 1080×1920',
      w: 1080,
      h: 1920,
      safeTop: 269,
      safeBottom: 1248,
      pw: 500,
      cornerR: 18,
      floorMain: 1068,
      floorEnd: 820,
      endScale: 0.88,
      peakMain: 84,
      peakScan: 46,
      peakEnd: 62,
      railBaseY: 574,
      eyebrowY: 294,
      eyebrowFont: 20,
      eyebrowH: 40,
      h1Y: 426,
      h1Size: 78,
      h2Y: 524,
      h2Size: 74,
      telY: 1158,
      telW: 560,
      priceY: 1156,
      priceSize: 96,
      tagsHeroY: 1216,
      kickerY: 310,
      logoY: 882,
      logoH: 82,
      endCopyY: 1038,
      endCopySize: 35,
      domainY: 1122,
      domainSize: 50,
      tagsEndY: 1202,
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
      pw: 570,
      cornerR: 20,
      floorMain: 975,
      floorEnd: 720,
      endScale: 0.88,
      peakMain: 92,
      peakScan: 52,
      peakEnd: 70,
      railBaseY: 425,
      eyebrowY: 102,
      eyebrowFont: 22,
      eyebrowH: 44,
      h1Y: 248,
      h1Size: 86,
      h2Y: 354,
      h2Size: 82,
      telY: 1125,
      telW: 600,
      priceY: 1122,
      priceSize: 116,
      tagsHeroY: 1218,
      kickerY: 112,
      logoY: 795,
      logoH: 92,
      endCopyY: 972,
      endCopySize: 38,
      domainY: 1068,
      domainSize: 56,
      tagsEndY: 1178,
      tagFont: 24,
      tagH: 48,
    },
  };

  const initFmtKey = qs.get('format') === '4x5' ? '4x5' : '9x16';
  let L = FORMATS[initFmtKey];
  let W = L.w, H = L.h, CX = W / 2;
  let PW = L.pw, PH = Math.round(PW * 822 / 1200);
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

  // ---- assets & pixel-accurate laser maps ----
  const loadImg = src => new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

  let plaque = null, blank = null, logo = null;
  let gallery = []; // { img, cutout } swapped on every bounce in Act 3 & End Card
  let engraveMap = null, MW = 0, MH = 0;
  let emberCanvas = null, blueprintCanvas = null;

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
  const SWAP0 = HERO0; // Beat 17 (7.816 s): swaps to a new pure-wood gallery plaque every 2 kicks!

  const PAD = 24;
  const plaqueBuf = document.createElement('canvas');
  let pCtx = null;

  function initPlaqueBuffer() {
    plaqueBuf.width = PW + PAD * 2;
    plaqueBuf.height = PH + PAD * 2;
    pCtx = plaqueBuf.getContext('2d');
  }

  function buildEngraveMaps(blankImg, plaqueImg) {
    MW = 400;
    MH = Math.max(1, Math.round(MW * plaqueAspect));
    const cA = document.createElement('canvas'); cA.width = MW; cA.height = MH;
    const cB = document.createElement('canvas'); cB.width = MW; cB.height = MH;
    const gA = cA.getContext('2d', { willReadFrequently: true });
    const gB = cB.getContext('2d', { willReadFrequently: true });
    gA.drawImage(blankImg, 0, 0, MW, MH);
    gB.drawImage(plaqueImg, 0, 0, MW, MH);

    try {
      const dA = gA.getImageData(0, 0, MW, MH).data;
      const dB = gB.getImageData(0, 0, MW, MH).data;
      engraveMap = new Float32Array(MW * MH);

      emberCanvas = document.createElement('canvas');
      emberCanvas.width = MW; emberCanvas.height = MH;
      const eCtx = emberCanvas.getContext('2d');
      const eImg = eCtx.createImageData(MW, MH);
      const eD = eImg.data;

      for (let p = 0; p < MW * MH; p++) {
        const i = p * 4;
        if (dB[i + 3] < 128) continue;
        const lA = 0.299 * dA[i] + 0.587 * dA[i + 1] + 0.114 * dA[i + 2];
        const lB = 0.299 * dB[i] + 0.587 * dB[i + 1] + 0.114 * dB[i + 2];
        const val = clamp(((lA - lB) / 255 - 0.03) / 0.42);
        engraveMap[p] = val;

        if (val > 0.06) {
          const hot = Math.pow(val, 0.82);
          eD[i] = 255;
          eD[i + 1] = Math.round(lerp(75, 228, hot));
          eD[i + 2] = Math.round(lerp(18, 160, hot * hot));
          eD[i + 3] = Math.min(255, Math.round(Math.pow(val, 0.72) * 255));
        }
      }
      eCtx.putImageData(eImg, 0, 0);

      blueprintCanvas = document.createElement('canvas');
      blueprintCanvas.width = MW; blueprintCanvas.height = MH;
      const bCtx = blueprintCanvas.getContext('2d');
      const bImg = bCtx.createImageData(MW, MH);
      const bD = bImg.data;

      const at = (x, y) => engraveMap[y * MW + x];
      for (let y = 1; y < MH - 1; y++) {
        for (let x = 1; x < MW - 1; x++) {
          const gx =
            -at(x - 1, y - 1) + at(x + 1, y - 1) +
            -2 * at(x - 1, y) + 2 * at(x + 1, y) +
            -at(x - 1, y + 1) + at(x + 1, y + 1);
          const gy =
            -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
            at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
          const mag = clamp(Math.hypot(gx, gy) * 1.45);
          const a = clamp(mag * 1.15 + at(x, y) * 0.16);
          if (a > 0.04) {
            const idx = (y * MW + x) * 4;
            const core = clamp((mag - 0.45) / 0.55);
            bD[idx] = 255;
            bD[idx + 1] = Math.round(lerp(62, 220, core));
            bD[idx + 2] = Math.round(lerp(66, 205, core));
            bD[idx + 3] = Math.min(255, Math.round(a * 235));
          }
        }
      }
      bCtx.putImageData(bImg, 0, 0);
    } catch {
      engraveMap = null;
      emberCanvas = null;
      blueprintCanvas = null;
    }
  }

  function sampleBurn(nx, ny) {
    if (engraveMap) {
      const x = clamp(Math.floor(nx * MW), 0, MW - 1);
      const y = clamp(Math.floor(ny * MH), 0, MH - 1);
      let sum = 0, cnt = 0;
      for (let dx = -1; dx <= 1; dx++) {
        sum += engraveMap[y * MW + clamp(x + dx, 0, MW - 1)];
        cnt++;
      }
      return sum / cnt;
    }
    const inCar = nx > 0.08 && nx < 0.92 && ny > 0.14 && ny < 0.76;
    const inLogo = nx > 0.18 && nx < 0.82 && ny > 0.80 && ny < 0.94;
    if (inLogo) return 0.74;
    if (inCar) return 0.4 + 0.3 * Math.abs(Math.sin(nx * 19 + ny * 11));
    return 0.06;
  }

  // ---- background: dark studio wall + subtle honeycomb ----
  const bgLayer = document.createElement('canvas');

  function buildBackground() {
    bgLayer.width = W;
    bgLayer.height = H;
    const b = bgLayer.getContext('2d');
    b.fillStyle = C.bg;
    b.fillRect(0, 0, W, H);

    b.save();
    const r = 26, dx = r * Math.sqrt(3), dy = r * 1.5;
    b.strokeStyle = 'rgba(255,255,255,0.042)';
    b.lineWidth = 1.6;
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
    const vg = b.createRadialGradient(CX, focalY, 340, CX, focalY, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(8,8,10,0)');
    vg.addColorStop(0.75, 'rgba(8,8,10,0.58)');
    vg.addColorStop(1, 'rgba(8,8,10,0.95)');
    b.fillStyle = vg;
    b.fillRect(0, 0, W, H);
  }

  // ---- perspective studio ground plane ----
  function drawStudioFloor(floorY, beatKick, endP) {
    const horizonY = floorY - 175;

    const glowA = 0.20 + 0.16 * beatKick;
    const rg = ctx.createRadialGradient(CX, floorY - 60, 40, CX, floorY - 30, 680);
    rg.addColorStop(0, `rgba(193,39,45,${glowA})`);
    rg.addColorStop(0.5, `rgba(166,43,43,${glowA * 0.34})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, Math.max(0, horizonY - 420), W, 1000);

    const fg = ctx.createLinearGradient(0, horizonY, 0, floorY + 240);
    fg.addColorStop(0, 'rgba(18,18,22,0)');
    fg.addColorStop(0.35, `rgba(22,20,24,${0.55 * (1 - 0.35 * endP)})`);
    fg.addColorStop(0.7, `rgba(14,14,17,${0.72 * (1 - 0.35 * endP)})`);
    fg.addColorStop(1, 'rgba(8,8,10,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, horizonY, W, 420);

    ctx.save();
    ctx.globalAlpha = (0.14 + 0.06 * beatKick) * (1 - 0.45 * endP);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.4;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(CX + i * 70, horizonY + 26);
      ctx.lineTo(CX + i * 310, floorY + 200);
      ctx.stroke();
    }
    for (let k = 0; k < 5; k++) {
      const f = Math.pow((k + 1) / 5, 1.55);
      const y = lerp(horizonY + 26, floorY + 175, f);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    const hl = ctx.createLinearGradient(0, 0, W, 0);
    hl.addColorStop(0, 'rgba(193,39,45,0)');
    hl.addColorStop(0.5, `rgba(255,105,95,${(0.28 + 0.24 * beatKick) * (1 - 0.4 * endP)})`);
    hl.addColorStop(1, 'rgba(193,39,45,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, horizonY + 24, W, 2);
    ctx.restore();
  }

  // ---- particles (sparks, wood dust puffs, rising wood smoke) ----
  let sparks = [];
  let dust = [];
  let smoke = [];
  const rnd = (a, b) => a + Math.random() * (b - a);

  function emitDust(floorY, power, widthScale = 1) {
    const n = Math.round(10 + 26 * power);
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const sp = rnd(170, 720) * (0.45 + 0.65 * power);
      dust.push({
        x: CX + side * rnd(PW * 0.14, PW * 0.54) * widthScale,
        y: floorY - rnd(0, 8),
        vx: side * sp * rnd(0.5, 1.1),
        vy: -sp * rnd(0.08, 0.44),
        g: 1350,
        life: 0,
        max: rnd(0.24, 0.55),
        size: rnd(2.8, 7.8),
        col: Math.random() < 0.55 ? '235,205,165' : '195,152,102',
      });
    }
  }

  function emitSparks(x, y, intensity, boost = 1) {
    const count = Math.round((intensity > 0.45 ? 4 : intensity > 0.18 ? 2 : 1) * boost);
    for (let i = 0; i < count; i++) {
      const a = rnd(-Math.PI * 0.94, -Math.PI * 0.06);
      const sp = rnd(140, 560) * (0.55 + 0.7 * intensity);
      sparks.push({
        x: x + rnd(-4, 4),
        y: y + rnd(-3, 3),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 80,
        g: 1250,
        life: 0,
        max: rnd(0.18, 0.46),
        size: rnd(1.8, 3.6),
        hot: Math.random() < 0.42,
      });
    }
  }

  function emitSmoke(x, y, intensity) {
    if (intensity < 0.16 || Math.random() > 0.25 + intensity * 0.55) return;
    smoke.push({
      x: x + rnd(-6, 6),
      y: y - rnd(4, 10),
      vx: rnd(14, 44),
      vy: -rnd(44, 96),
      r: rnd(10, 20),
      grow: rnd(38, 68),
      life: 0,
      max: rnd(0.8, 1.45),
      alpha: 0.07 + intensity * 0.12,
    });
  }

  function stepParticles(dt) {
    for (const d of dust) {
      d.life += dt;
      d.vy += d.g * dt;
      d.vx *= Math.max(0, 1 - 3.2 * dt);
      d.x += d.vx * dt;
      d.y += d.vy * dt;
    }
    dust = dust.filter(d => d.life < d.max);

    for (const p of sparks) {
      p.life += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    sparks = sparks.filter(p => p.life < p.max);

    for (const s of smoke) {
      s.life += dt;
      s.x += s.vx * dt + Math.sin(s.life * 4.5 + s.r) * 14 * dt;
      s.y += s.vy * dt;
      s.r += s.grow * dt;
    }
    smoke = smoke.filter(s => s.life < s.max);
  }

  function drawSmoke() {
    if (!smoke.length) return;
    ctx.save();
    for (const s of smoke) {
      const k = s.life / s.max;
      const a = s.alpha * Math.sin(Math.min(1, k * 3.5) * Math.PI * 0.5) * (1 - k);
      if (a <= 0.002) continue;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `rgba(225,205,188,${a})`);
      g.addColorStop(0.5, `rgba(175,152,135,${a * 0.45})`);
      g.addColorStop(1, 'rgba(120,105,98,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDustAndSparks() {
    ctx.save();
    for (const d of dust) {
      const a = 1 - d.life / d.max;
      ctx.fillStyle = `rgba(${d.col},${a * 0.78})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size * (0.55 + 0.45 * a), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of sparks) {
      const a = 1 - p.life / p.max;
      ctx.strokeStyle = p.hot
        ? `rgba(255,244,205,${a})`
        : `rgba(255,135,48,${a * 0.95})`;
      ctx.lineWidth = p.size * (0.4 + 0.6 * a);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.024, p.y - p.vy * 0.024);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- BOUNCING YARIS MEME PHYSICS ----
  function getBounceConfig(t) {
    const uEnd = easeInOut(prog(t, END0, END0 + 1.8 * BEAT));
    const uDrop = easeOut3(prog(t, SCAN1 - 0.2 * BEAT, SCAN1 + 0.35 * BEAT));
    const uScan = inOut(t, SCAN0, SCAN1, 0.4 * BEAT, 0.35 * BEAT);

    const floorY = lerp(L.floorMain, L.floorEnd, uEnd);
    const baseScale = lerp(1.0, L.endScale, uEnd);
    const intensity =
      0.72
      - 0.14 * uScan
      + 0.30 * uDrop * (1 - uEnd)
      + 0.06 * uEnd;
    const peakH =
      lerp(L.peakMain * 0.72, L.peakMain, uDrop * (1 - uEnd)) * (1 - uScan)
      + L.peakScan * uScan
      + (L.peakEnd - L.peakMain * 0.72) * uEnd;

    return { floorY, baseScale, intensity, peakH, uEnd, uHero: uDrop, uScan };
  }

  function bounceSample(t, intensity, peakH) {
    if (t < DROP_HIT) {
      const p = clamp(t / DROP_HIT);
      const fall = 1 - p * p;
      const h = 420 * fall;
      const sy = 1 + 0.22 * p;
      const sx = Math.pow(sy, -0.6);
      return { h, sy, sx, lean: -0.20 * fall, u: 0, kick: 0 };
    }

    const tb = (t - DROP_HIT) / BEAT;
    const u = tb - Math.floor(tb);
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

  function plaquePointToStage(t, cfg, nx, ny) {
    const base = bounceSample(t, cfg.intensity, cfg.peakH);
    const v = 1 - ny;
    const lag = t >= DROP_HIT ? v * 0.042 * cfg.intensity : 0;
    const s = bounceSample(Math.max(0, t - lag), cfg.intensity, cfg.peakH);

    const avgSy = (base.sy + s.sy) * 0.5;
    const totalH = PH * cfg.baseScale * avgSy;
    const bottomY = cfg.floorY - base.h;
    const y = bottomY - v * totalH;

    const belly = 1 + (1 - s.sy) * 0.26 * Math.sin(Math.PI * v);
    const sliceW = PW * cfg.baseScale * s.sx * belly;
    const shearX = s.lean * 46 * v * v * cfg.intensity * cfg.baseScale;
    const x = CX + shearX + (nx - 0.5) * sliceW;

    return { x, y, base, s };
  }

  // ---- laser scan kinematics ----
  function getScanState(t) {
    const reveal = prog(t, SCAN0, SCAN1);
    const burning = t >= SCAN0 && t < SCAN1;
    const sweepCycle = Math.max(0, t - SCAN0) * 5.4;
    const passIdx = Math.floor(sweepCycle);
    const passFrac = sweepCycle - passIdx;
    const goingRight = (passIdx % 2) === 0;
    const uX = goingRight ? passFrac : (1 - passFrac);
    const nx = 0.03 + 0.94 * uX;
    const ny = reveal;
    const intensity = burning ? sampleBurn(nx, ny) : 0;
    return { reveal, burning, goingRight, nx, ny, intensity };
  }

  // ---- render flat plaque (or current bounce-swapped gallery photo) to plaqueBuf ----
  function drawGallerySwapToBuffer(c, item, x, y, w, h, r, bounceState, justSwapped) {
    const img = item.img;
    const natW = img.naturalWidth || w;
    const natH = img.naturalHeight || h;
    const edgeX = 3 + bounceState.lean * 5;
    const edgeY = 10;

    if (item.cutout) {
      // Aspect-preserving transparent wooden plaque cutout planted cleanly on the floor bottom
      const sc = Math.min(w / natW, h / natH);
      const dw = natW * sc;
      const dh = natH * sc;
      const dx = x + (w - dw) / 2;
      const dy = y + (h - dh);

      c.save();
      c.shadowColor = 'rgba(18, 9, 3, 0.85)';
      c.shadowBlur = 12;
      c.shadowOffsetX = edgeX;
      c.shadowOffsetY = edgeY;
      c.drawImage(img, dx, dy, dw, dh);
      c.restore();

      // Subtle warm beat-swap flash clipped to cutout alpha (fires on image swap beat)
      const swapFlash = justSwapped ? Math.pow(bounceState.kick, 2.6) * 0.24 : 0;
      if (swapFlash > 0.01) {
        c.save();
        c.globalCompositeOperation = 'source-atop';
        c.fillStyle = `rgba(255, 232, 185, ${swapFlash})`;
        c.fillRect(dx, dy, dw, dh);
        c.restore();
      }
      return;
    }

    // Lifestyle gallery photo inside crisp rounded wooden-edge card (centered cover crop)
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

    // Subtle sheen + warm beat-swap impact flash
    const sheenShift = (1 - bounceState.sy) * 320 + bounceState.lean * 160;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(x + w * 0.5 + sheenShift, y + h * 0.5);
    c.rotate(-0.32 + bounceState.lean * 0.14);
    const sg = c.createLinearGradient(-160, 0, 160, 0);
    sg.addColorStop(0, 'rgba(255,244,224,0)');
    sg.addColorStop(0.5, 'rgba(255,244,224,0.16)');
    sg.addColorStop(1, 'rgba(255,244,224,0)');
    c.fillStyle = sg;
    c.fillRect(-160, -h, 320, h * 2);
    c.restore();

    const swapFlash = justSwapped ? Math.pow(bounceState.kick, 2.6) * 0.24 : 0;
    if (swapFlash > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(255, 232, 185, ${swapFlash})`;
      c.fillRect(x, y, w, h);
      c.restore();
    }
    c.restore();

    c.strokeStyle = 'rgba(255, 235, 205, 0.30)';
    c.lineWidth = 2;
    roundRect(c, x + 1, y + 1, w - 2, h - 2, r - 1);
    c.stroke();
  }

  function updatePlaqueBuffer(t, scan, bounceState) {
    const c = pCtx;
    c.clearRect(0, 0, plaqueBuf.width, plaqueBuf.height);
    const x = PAD, y = PAD;

    // Part 2 (Beat 16+): swap to a different real gallery photo every 2 jumps!
    if (t >= SWAP0 && gallery.length > 0) {
      const beatsSinceSwap = Math.floor((t - SWAP0) / BEAT);
      const idx = Math.floor(beatsSinceSwap / 2) % gallery.length;
      const justSwapped = (beatsSinceSwap % 2) === 0;
      drawGallerySwapToBuffer(c, gallery[idx], x, y, PW, PH, L.cornerR, bounceState, justSwapped);
      return;
    }

    const edgeX = 3 + bounceState.lean * 5;
    const edgeY = 10;
    c.fillStyle = C.woodChar;
    roundRect(c, x + edgeX, y + edgeY, PW, PH, L.cornerR);
    c.fill();

    c.fillStyle = C.woodEdge;
    roundRect(c, x + edgeX * 0.5, y + edgeY * 0.5, PW, PH, L.cornerR);
    c.fill();

    c.save();
    roundRect(c, x, y, PW, PH, L.cornerR);
    c.clip();

    c.drawImage(blank, x, y, PW, PH);

    // Act 1: Laser CAD blueprint scan
    const bpVis = inOut(t, BP0, SCAN0 + 0.25 * BEAT, 0.12, 0.28);
    if (bpVis > 0) {
      const bpSweep = easeInOut(prog(t, BP0, BP1));
      const bpY = y + PH * bpSweep;

      c.save();
      c.beginPath();
      c.rect(x, y, PW, PH * bpSweep);
      c.clip();
      if (blueprintCanvas) {
        c.globalCompositeOperation = 'multiply';
        c.globalAlpha = bpVis * 0.24;
        c.fillStyle = '#4a1214';
        c.fillRect(x, y, PW, PH);

        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = bpVis * 0.92;
        c.drawImage(blueprintCanvas, x, y, PW, PH);
      } else {
        c.globalAlpha = bpVis * 0.34;
        c.drawImage(plaque, x, y, PW, PH);
      }
      c.restore();

      if (bpSweep > 0 && bpSweep < 1) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const lg = c.createLinearGradient(0, bpY - 36, 0, bpY + 10);
        lg.addColorStop(0, 'rgba(255,60,60,0)');
        lg.addColorStop(0.78, `rgba(255,70,65,${bpVis * 0.7})`);
        lg.addColorStop(1, 'rgba(255,180,170,0)');
        c.fillStyle = lg;
        c.fillRect(x, bpY - 36, PW, 46);
        c.fillStyle = `rgba(255,225,215,${bpVis * 0.95})`;
        c.fillRect(x, bpY - 1.5, PW, 3);
        c.restore();
      }
    }

    // Act 2+: Laser-engraved Yaris plaque revealed right behind scan tip
    if (scan.reveal > 0) {
      const scanY = y + PH * scan.reveal;
      const sxLocal = x + PW * scan.nx;
      const bandH = 7;

      c.save();
      c.beginPath();
      if (scan.reveal >= 1) {
        c.rect(x, y, PW, PH);
      } else {
        const fullH = Math.max(0, PH * scan.reveal - bandH);
        if (fullH > 0) c.rect(x, y, PW, fullH);
        const rowY = y + fullH;
        const rowH = Math.min(bandH, PH * scan.reveal - fullH);
        if (scan.goingRight) {
          c.rect(x, rowY, sxLocal - x, rowH);
        } else {
          c.rect(sxLocal, rowY, (x + PW) - sxLocal, rowH);
        }
      }
      c.clip();
      c.drawImage(plaque, x, y, PW, PH);
      c.restore();

      // Cooling molten embers
      const coolFade = scan.reveal < 1 ? 1 : (1 - prog(t, SCAN1, SCAN1 + 1.6 * BEAT));
      if (coolFade > 0) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        if (emberCanvas) {
          const strips = 8;
          const totalH = 62;
          const stepH = totalH / strips;
          for (let i = 0; i < strips; i++) {
            const topY = scanY - (i + 1) * stepH;
            const cTop = Math.max(y, topY);
            const cBot = Math.min(scanY, topY + stepH + 0.5);
            if (cBot <= cTop) continue;
            const k = 1 - i / strips;
            c.save();
            c.beginPath();
            c.rect(x, cTop, PW, cBot - cTop);
            c.clip();
            c.globalAlpha = Math.pow(k, 1.9) * 0.92 * coolFade;
            c.drawImage(emberCanvas, x, y, PW, PH);
            c.restore();
          }
        } else {
          const gg = c.createLinearGradient(0, scanY - 52, 0, scanY);
          gg.addColorStop(0, 'rgba(255,110,35,0)');
          gg.addColorStop(1, `rgba(255,130,45,${0.55 * coolFade})`);
          c.fillStyle = gg;
          c.fillRect(x, scanY - 52, PW, 52);
        }
        c.restore();
      }
    }

    // Dynamic studio sheen reacting to squash/stretch
    const sheenShift = (1 - bounceState.sy) * 340 + bounceState.lean * 180;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(x + PW * 0.5 + sheenShift, y + PH * 0.5);
    c.rotate(-0.32 + bounceState.lean * 0.14);
    const sg = c.createLinearGradient(-180, 0, 180, 0);
    const sA = 0.08 + 0.11 * Math.abs(1 - bounceState.sy) * 2.5;
    sg.addColorStop(0, 'rgba(255,242,220,0)');
    sg.addColorStop(0.5, `rgba(255,242,220,${clamp(sA, 0, 0.24)})`);
    sg.addColorStop(1, 'rgba(255,242,220,0)');
    c.fillStyle = sg;
    c.fillRect(-180, -PH, 360, PH * 2);
    c.restore();

    // Completion flash
    const doneFlash = 1 - prog(t, SCAN1, SCAN1 + 1.2 * BEAT);
    if (t >= SCAN1 && doneFlash > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.pow(doneFlash, 1.6) * 0.55;
      c.fillStyle = '#ffe0b2';
      c.fillRect(x, y, PW, PH);
      c.restore();
    }

    const rim = c.createLinearGradient(0, y, 0, y + PH);
    rim.addColorStop(0, 'rgba(255,246,228,0.18)');
    rim.addColorStop(0.08, 'rgba(255,246,228,0)');
    rim.addColorStop(0.88, 'rgba(0,0,0,0)');
    rim.addColorStop(1, 'rgba(25,12,4,0.24)');
    c.fillStyle = rim;
    c.fillRect(x, y, PW, PH);

    c.restore();

    c.strokeStyle = 'rgba(255,235,205,0.20)';
    c.lineWidth = 2;
    roundRect(c, x + 1, y + 1, PW - 2, PH - 2, L.cornerR - 1);
    c.stroke();
  }

  // ---- draw 28-slice rubber Bouncing Yaris plaque ----
  function drawBouncingPlaque(t, cfg, scan) {
    const base = bounceSample(t, cfg.intensity, cfg.peakH);
    updatePlaqueBuffer(t, scan, base);

    // Dynamic contact shadow
    const liftNorm = clamp(base.h / 200);
    const shadowW = PW * cfg.baseScale * base.sx * (0.62 - 0.18 * liftNorm);
    const shadowH = 30 * (1 - 0.35 * liftNorm);
    ctx.save();
    ctx.translate(CX + base.lean * 18 * cfg.baseScale, cfg.floorY + 5);
    ctx.scale(1, shadowH / Math.max(1, shadowW));
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowW);
    sg.addColorStop(0, `rgba(0,0,0,${0.92 - 0.48 * liftNorm})`);
    sg.addColorStop(0.55, `rgba(0,0,0,${0.55 - 0.32 * liftNorm})`);
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, shadowW, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle floor reflection
    if (base.h < 180) {
      const reflA = (1 - clamp(base.h / 180)) * 0.15 * (1 - 0.4 * cfg.uEnd);
      if (reflA > 0.01) {
        ctx.save();
        ctx.translate(CX, cfg.floorY + 8 + base.h * 0.4);
        ctx.scale(cfg.baseScale * base.sx, -0.20 * cfg.baseScale * base.sy);
        ctx.globalAlpha = reflA;
        ctx.drawImage(plaqueBuf, -plaqueBuf.width / 2, -plaqueBuf.height + PAD);
        ctx.restore();
      }
    }

    // 28-slice rubber squash-and-stretch with bottom-to-top inertia lag
    const SLICES = 28;
    const srcW = plaqueBuf.width;
    const srcH = plaqueBuf.height;
    const baseBottomY = cfg.floorY - base.h;

    const sliceSy = new Float32Array(SLICES);
    const sliceSx = new Float32Array(SLICES);
    const sliceLean = new Float32Array(SLICES);
    let sumSy = 0;
    for (let i = 0; i < SLICES; i++) {
      const v = (i + 0.5) / SLICES;
      const lag = t >= DROP_HIT ? v * 0.042 * cfg.intensity : 0;
      const s = bounceSample(Math.max(0, t - lag), cfg.intensity, cfg.peakH);
      sliceSy[i] = s.sy;
      const belly = 1 + (1 - s.sy) * 0.26 * Math.sin(Math.PI * v);
      sliceSx[i] = s.sx * belly;
      sliceLean[i] = s.lean * 46 * v * v * cfg.intensity * cfg.baseScale;
      sumSy += s.sy;
    }

    const totalDstH = srcH * cfg.baseScale * (sumSy / SLICES);
    const padShift = PAD * cfg.baseScale * sliceSy[0];
    let curBottom = baseBottomY + padShift;

    for (let i = 0; i < SLICES; i++) {
      const dh = totalDstH * (sliceSy[i] / sumSy);
      const dstY = curBottom - dh;
      const srcY = srcH * (1 - (i + 1) / SLICES);
      const srcSliceH = srcH / SLICES;
      const dstW = srcW * cfg.baseScale * sliceSx[i];
      const dstX = CX + sliceLean[i] - dstW / 2;

      ctx.drawImage(
        plaqueBuf,
        0, srcY, srcW, srcSliceH,
        dstX, dstY - 0.6, dstW, dh + 1.4
      );
      curBottom = dstY;
    }

    // Act 1 targeting brackets bouncing along with the board
    const calA = inOut(t, BP0 - 0.15, SCAN0 + 0.1, 0.2, 0.2);
    if (calA > 0) {
      const tl = plaquePointToStage(t, cfg, 0, 0);
      const tr = plaquePointToStage(t, cfg, 1, 0);
      const bl = plaquePointToStage(t, cfg, 0, 1);
      const br = plaquePointToStage(t, cfg, 1, 1);
      const pad = 14, len = 32;
      ctx.save();
      ctx.globalAlpha = calA * 0.9;
      ctx.strokeStyle = C.bright;
      ctx.lineWidth = 3;
      ctx.lineCap = 'square';
      const cs = [
        [tl.x - pad, tl.y - pad, 1, 1],
        [tr.x + pad, tr.y - pad, -1, 1],
        [bl.x - pad, bl.y + pad, 1, -1],
        [br.x + pad, br.y + pad, -1, -1],
      ];
      for (const [cx0, cy0, dx, dy] of cs) {
        ctx.beginPath();
        ctx.moveTo(cx0, cy0 + dy * len);
        ctx.lineTo(cx0, cy0);
        ctx.lineTo(cx0 + dx * len, cy0);
        ctx.stroke();
      }
      ctx.restore();
    }

    return base;
  }

  // ---- rigid industrial laser gantry tracking the bouncing plaque ----
  function drawLaser(t, cfg, scan) {
    const enter = easeOut3(prog(t, SCAN0 - 0.7 * BEAT, SCAN0));
    const exit = easeInOut(prog(t, SCAN1, SCAN1 + 0.9 * BEAT));
    const vis = Math.min(prog(t, SCAN0 - 0.7 * BEAT, SCAN0 - 0.15 * BEAT), 1 - exit);
    if (vis <= 0) return null;

    const target = plaquePointToStage(t, cfg, scan.nx, scan.ny);
    const sx = target.x;
    const sy = target.y;

    const railY = L.railBaseY - (1 - enter) * 140 - exit * 150;
    const railW = Math.min(W - 80, PW + 130);
    const railX = CX - railW / 2;

    ctx.save();
    ctx.globalAlpha = vis;

    // Anodized gantry rail
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    const rg = ctx.createLinearGradient(0, railY, 0, railY + 22);
    rg.addColorStop(0, '#2e2e34');
    rg.addColorStop(0.4, '#1a1a1f');
    rg.addColorStop(1, '#0e0e12');
    ctx.fillStyle = rg;
    roundRect(ctx, railX, railY, railW, 22, 7);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(railX + 10, railY + 2, railW - 20, 2);

    // Laser carriage
    const hx = clamp(sx, railX + 40, railX + railW - 40);
    const hy = railY - 14;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#151519';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    roundRect(ctx, hx - 30, hy, 60, 48, 9);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = scan.burning ? '#ff3c38' : C.brand;
    roundRect(ctx, hx - 14, hy + 29, 28, 6, 3);
    ctx.fill();

    const nozzleY = hy + 59;
    ctx.fillStyle = '#8f7656';
    ctx.beginPath();
    ctx.moveTo(hx - 10, hy + 48);
    ctx.lineTo(hx + 10, hy + 48);
    ctx.lineTo(hx + 4, nozzleY);
    ctx.lineTo(hx - 4, nozzleY);
    ctx.closePath();
    ctx.fill();

    if (scan.burning) {
      const pwr = 0.28 + 0.72 * scan.intensity;
      const flick = 0.85 + 0.15 * Math.sin(t * 110);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const beamG = ctx.createLinearGradient(hx, nozzleY, sx, sy);
      beamG.addColorStop(0, `rgba(255,65,55,${0.32 * pwr})`);
      beamG.addColorStop(0.75, `rgba(255,120,65,${0.55 * pwr})`);
      beamG.addColorStop(1, `rgba(255,225,175,${0.9 * pwr})`);
      ctx.fillStyle = beamG;
      ctx.beginPath();
      ctx.moveTo(hx - 4.5, nozzleY);
      ctx.lineTo(hx + 4.5, nozzleY);
      ctx.lineTo(sx + 2.5, sy);
      ctx.lineTo(sx - 2.5, sy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(255,252,240,${0.95 * pwr})`;
      ctx.lineWidth = 1.5 + 1.7 * scan.intensity;
      ctx.beginPath();
      ctx.moveTo(hx, nozzleY);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      const rad = (40 + 70 * scan.intensity) * flick;
      const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
      bloom.addColorStop(0, `rgba(255,255,245,${0.96 * pwr})`);
      bloom.addColorStop(0.16, `rgba(255,185,95,${0.86 * pwr})`);
      bloom.addColorStop(0.48, `rgba(215,50,42,${0.34 * pwr})`);
      bloom.addColorStop(1, 'rgba(193,39,45,0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
    return scan.burning ? { x: sx, y: sy, intensity: scan.intensity } : null;
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
    fontSize = 22,
    px = 24,
    h = 46,
    spacing = '3px',
  } = {}) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = clamp(alpha);
    if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
    setFont(fontSize, 600, 'normal');
    const tw = ctx.measureText(label).width;
    const dotW = dot ? 20 : 0;
    const w = tw + px * 2 + dotW;

    ctx.fillStyle = accent ? 'rgba(193,39,45,0.20)' : 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = accent ? 'rgba(193,39,45,0.58)' : 'rgba(255,255,255,0.14)';
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
  function drawCopy(t, scan, bounceBase) {
    const kick = bounceBase.kick;

    // Top eyebrow (Acts 1–3)
    const ebA = inOut(t, 0.3 * BEAT, END0 - 0.4 * BEAT, 0.3, 0.25);
    if (ebA > 0) {
      drawPill(CX, L.eyebrowY, 'DÁRKY DŘEVO  ·  LASEROVÉ GRAVÍROVÁNÍ', ebA, {
        dot: true,
        accent: scan.burning,
        fontSize: L.eyebrowFont,
        px: 22,
        h: L.eyebrowH,
        spacing: '2.5px',
      });
    }

    // Headline A (Acts 1–2): Main line right from the start!
    maskedText('DÁREK PRO', L.h1Y, L.h1Size, C.ink,
      prog(t, 0.4 * BEAT, 1.4 * BEAT), 1 - prog(t, HERO0 - 0.8 * BEAT, HERO0));
    maskedText('KAŽDÉHO ŘIDIČE.', L.h2Y, L.h2Size, C.bright,
      prog(t, 1.0 * BEAT, 2.1 * BEAT), 1 - prog(t, HERO0 - 0.8 * BEAT, HERO0));

    // Headline B (Act 3): Broadens to ANY photo while gallery swaps on every bounce!
    maskedText('Z JAKÉKOLIV FOTKY.', L.h1Y, L.h1Size, C.ink,
      prog(t, HERO0 + 0.1 * BEAT, HERO0 + 1.1 * BEAT), 1 - prog(t, END0 - 0.7 * BEAT, END0),
      { beatPop: kick });
    maskedText('PŘÍMO DO DŘEVA.', L.h2Y, L.h2Size, C.bright,
      prog(t, HERO0 + 0.5 * BEAT, HERO0 + 1.5 * BEAT), 1 - prog(t, END0 - 0.7 * BEAT, END0),
      { beatPop: kick });

    // Bottom Zone — Act 2: Live Laser Telemetry
    const telA = inOut(t, SCAN0 - 0.3 * BEAT, SCAN1 + 0.8 * BEAT, 0.24, 0.28);
    if (telA > 0) {
      const r = scan.reveal;
      const pct = String(Math.round(r * 100)).padStart(2, '0');
      const bw = L.telW, bx = CX - bw / 2, by = L.telY;

      ctx.save();
      ctx.globalAlpha = telA;
      ctx.fillStyle = 'rgba(12,12,16,0.74)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx - 30, by - 48, bw + 60, 96, 16);
      ctx.fill();
      ctx.stroke();

      setFont(24, 600, 'normal');
      if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
      ctx.fillStyle = r < 1 ? C.muted : '#ffd9a8';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(r < 1 ? 'LASER GRAVÍRUJE' : 'HOTOVO ✓', bx, by - 8);

      if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
      setFont(24, 700, 'normal');
      ctx.textAlign = 'right';
      ctx.fillStyle = C.ink;
      ctx.fillText(`${pct} %`, bx + bw, by - 8);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(ctx, bx, by + 12, bw, 9, 4.5);
      ctx.fill();

      const fillW = Math.max(9, bw * r);
      const pg = ctx.createLinearGradient(bx, 0, bx + fillW, 0);
      pg.addColorStop(0, C.brand);
      pg.addColorStop(1, '#ff5c4d');
      ctx.fillStyle = pg;
      roundRect(ctx, bx, by + 12, fillW, 9, 4.5);
      ctx.fill();
      ctx.restore();
    }

    // Bottom Zone — Act 3: Bold Price + 3 Hashtags
    const offerOut = 1 - prog(t, END0 - 0.7 * BEAT, END0);
    if (t >= HERO0 + 0.3 * BEAT && offerOut > 0) {
      maskedText('od 299 Kč', L.priceY, L.priceSize, C.ink,
        prog(t, HERO0 + 0.6 * BEAT, HERO0 + 1.6 * BEAT), offerOut,
        { beatPop: kick * 0.85 });
      drawHashtags(
        L.tagsHeroY,
        Math.min(prog(t, HERO0 + 1.1 * BEAT, HERO0 + 1.9 * BEAT), offerOut),
        Math.min(prog(t, HERO0 + 1.4 * BEAT, HERO0 + 2.2 * BEAT), offerOut),
        Math.min(prog(t, HERO0 + 1.7 * BEAT, HERO0 + 2.5 * BEAT), offerOut),
      );
    }

    // Act 4: Clean End Card (NO fake button — Meta adds its own CTA button!)
    const endP = prog(t, END0 + 0.3 * BEAT, END0 + 1.5 * BEAT);
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
        ctx.drawImage(logo, CX - lw / 2, L.logoY + (1 - easeOut4(logoP)) * 26, lw, lh);
        ctx.restore();
      }

      maskedText('Auto, mazlíček nebo rodinná fotka', L.endCopyY, L.endCopySize, C.muted,
        prog(t, END0 + 0.9 * BEAT, END0 + 1.9 * BEAT), 1,
        { weight: 500, stretch: 'normal', maxW: 940 });

      // Bold price right above Meta's CTA button (logo already contains darkydrevo.cz)
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

  // ---- optional preview-only Safe Zone overlay (never baked into exported MP4) ----
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
    ctx.fillText(`META SAFE ZONE BOTTOM · ${L.safeBottom} px (prostor pro tlačítko Meta)`, 24, L.safeBottom + 10);
    ctx.restore();
  }

  // ---- frame renderer ----
  let lastBeatIdx = -1;

  function render(t, dt, { hideGuides = false } = {}) {
    const cfg = getBounceConfig(t);
    const scan = getScanState(t);
    const base = bounceSample(t, cfg.intensity, cfg.peakH);

    const beatIdx = t >= DROP_HIT ? Math.floor((t - DROP_HIT) / BEAT) : -1;
    if (dt > 0 && beatIdx !== lastBeatIdx && beatIdx >= 0) {
      const impactPower = beatIdx === 0 ? 1.1 : (0.52 + 0.42 * cfg.uHero * (1 - cfg.uEnd));
      emitDust(cfg.floorY, impactPower, cfg.baseScale);
      lastBeatIdx = beatIdx;
    }

    const thumpY = base.kick * (7 + 6 * cfg.uHero * (1 - cfg.uEnd));
    const thumpZoom = 1 + base.kick * (0.011 + 0.010 * cfg.uHero * (1 - cfg.uEnd));
    const pivotY = L.safeTop != null ? (L.safeTop + L.safeBottom) * 0.5 : H * 0.5;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bgLayer, 0, 0);

    ctx.save();
    ctx.translate(CX, pivotY + thumpY);
    ctx.scale(thumpZoom, thumpZoom);
    ctx.translate(-CX, -pivotY);

    drawStudioFloor(cfg.floorY, base.kick, cfg.uEnd);
    drawBouncingPlaque(t, cfg, scan);
    drawSmoke();
    const spot = drawLaser(t, cfg, scan);
    if (spot && dt > 0) {
      const boost = base.kick > 0.55 ? 1.7 : 1.0;
      emitSparks(spot.x, spot.y, spot.intensity, boost);
      emitSmoke(spot.x, spot.y, spot.intensity);
    }
    if (dt > 0) stepParticles(dt);
    drawDustAndSparks();

    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawCopy(t, scan, base);

    const fade = Math.max(1 - prog(t, 0, 0.16), prog(t, FADE_OUT, T - 0.04));
    if (fade > 0) {
      ctx.fillStyle = `rgba(8,8,10,${fade})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (showSafeZone && !hideGuides) {
      drawSafeZoneOverlay();
    }
  }

  // ---- UI controls, format switching, soundtrack & 60 fps MP4 export (< 30 MB) ----
  const btnRec = document.getElementById('rec');
  const btnPlay = document.getElementById('play');
  const btnFmt = document.getElementById('fmt');
  const btnSafe = document.getElementById('safe');
  const btnScale = document.getElementById('scale');
  const scrub = document.getElementById('scrub');
  const timeEl = document.getElementById('time');
  const statusEl = document.getElementById('status');

  function applyFormat(key) {
    L = FORMATS[key] || FORMATS['9x16'];
    W = L.w;
    H = L.h;
    CX = W / 2;
    PW = L.pw;
    PH = Math.round(PW * plaqueAspect);

    cv.width = W;
    cv.height = H;
    document.documentElement.style.setProperty('--ad-w', String(W));
    document.documentElement.style.setProperty('--ad-h', String(H));

    if (btnFmt) btnFmt.textContent = L.label;
    if (btnSafe) {
      btnSafe.style.display = L.safeTop != null ? '' : 'none';
      btnSafe.classList.toggle('active', showSafeZone && L.safeTop != null);
    }

    initPlaqueBuffer();
    buildBackground();
    clearParticles();
    if (plaque && blank) {
      const curT = paused ? pausedT : (((performance.now() - start) / 1000) % T);
      render(curT, 0);
    }
  }

  if (btnFmt) {
    btnFmt.addEventListener('click', () => {
      if (recorder || exporting) return;
      applyFormat(L.key === '9x16' ? '4x5' : '9x16');
    });
  }
  if (btnSafe) {
    btnSafe.addEventListener('click', () => {
      showSafeZone = !showSafeZone;
      btnSafe.classList.toggle('active', showSafeZone);
      if (paused && plaque) render(pausedT, 0);
    });
  }
  if (btnScale) {
    btnScale.addEventListener('click', () => {
      const native = document.body.classList.toggle('native-size');
      btnScale.textContent = native ? 'Přizpůsobit' : '1:1';
    });
  }

  const audio = new Audio('assets/song.mp3');
  let audioOK = false, audioOn = false, actx = null, audioDest = null;
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => {
    audioOK = true;
    statusEl.textContent = 'Klikněte pro zvuk';
  }, { once: true });
  audio.addEventListener('error', () => {
    statusEl.textContent = '';
  });

  function syncAudio(t = 0) {
    if (!audioOK || !audioOn) return;
    audio.currentTime = SONG_OFFSET + t;
    if (!paused) audio.play().catch(() => {});
  }

  function enableAudio() {
    if (!audioOK || audioOn) return;
    actx = new AudioContext();
    const src = actx.createMediaElementSource(audio);
    audioDest = actx.createMediaStreamDestination();
    src.connect(actx.destination);
    src.connect(audioDest);
    audioOn = true;
    statusEl.textContent = '';
    const curT = paused ? pausedT : (((performance.now() - start) / 1000) % T);
    syncAudio(curT);
  }
  addEventListener('pointerdown', enableAudio);
  addEventListener('keydown', enableAudio);

  let start = 0, last = 0, lastLoopT = 0;
  let paused = false, pausedT = 0;
  let recorder = null, exporting = false;
  let scrubbing = false;

  function updateHUD(t) {
    if (timeEl) timeEl.textContent = `${t.toFixed(1)} / ${T.toFixed(1)} s`;
    if (scrub && !scrubbing) scrub.value = t.toFixed(2);
    if (btnPlay) btnPlay.textContent = paused ? '▶' : '❚❚';
  }

  function clearParticles() {
    sparks = [];
    dust = [];
    smoke = [];
    lastBeatIdx = -1;
  }

  function seekTo(s) {
    const clamped = ((s % T) + T) % T;
    clearParticles();
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
    if (recorder || exporting) return;
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
        if (recorder && recorder.state === 'recording') recorder.stop();
      }
      lastLoopT = t;
      render(t, dt);
      updateHUD(t);
    }
    requestAnimationFrame(frame);
  }

  // ---- QuickTime / Meta-compatible 60fps CFR MP4 export (always < 30 MB) ----
  async function exportQuickTimeMP4() {
    const FPS = 60;
    const totalFrames = Math.round(T * FPS);
    // Cap video bitrate so exported MP4 stays comfortably under Meta's 30 MB limit (~15–20 MB)
    const maxBytes = 21 * 1024 * 1024;
    const videoBitrate = Math.min(10_000_000, Math.floor((maxBytes * 8) / T));

    const profiles = [
      { codec: 'avc1.42e02a', latencyMode: 'quality' },
      { codec: 'avc1.42002a', latencyMode: 'quality' },
      { codec: 'avc1.42e033', latencyMode: 'quality' },
      { codec: 'avc1.4d402a', latencyMode: 'realtime' },
      { codec: 'avc1.64002a', latencyMode: 'realtime' },
    ];
    let vCfg = null;
    for (const p of profiles) {
      const cand = {
        codec: p.codec,
        width: W,
        height: H,
        bitrate: videoBitrate,
        framerate: FPS,
        latencyMode: p.latencyMode,
        avc: { format: 'avc' },
      };
      const sup = await VideoEncoder.isConfigSupported(cand);
      if (sup.supported) {
        vCfg = { ...cand, ...sup.config, avc: { format: 'avc' } };
        break;
      }
    }
    if (!vCfg) throw new Error('WebCodecs H.264 encoder unavailable');

    let decodedAudio = null;
    let aCfg = null;
    if (audioOK && typeof AudioEncoder !== 'undefined' && typeof AudioData !== 'undefined') {
      try {
        const res = await fetch('assets/song.mp3');
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const tmpCtx = new AudioContext();
          const buf = await tmpCtx.decodeAudioData(ab);
          await tmpCtx.close();
          const ch = Math.min(2, buf.numberOfChannels);
          const sr = buf.sampleRate;
          const sup = await AudioEncoder.isConfigSupported({
            codec: 'mp4a.40.2',
            sampleRate: sr,
            numberOfChannels: ch,
            bitrate: 192_000,
          });
          if (sup.supported) {
            decodedAudio = buf;
            aCfg = { codec: 'mp4a.40.2', sampleRate: sr, numberOfChannels: ch, bitrate: 192_000 };
          }
        }
      } catch {
        decodedAudio = null;
        aCfg = null;
      }
    }

    const target = new Mp4Muxer.ArrayBufferTarget();
    const muxer = new Mp4Muxer.Muxer({
      target,
      video: { codec: 'avc', width: W, height: H, frameRate: FPS },
      ...(aCfg ? { audio: { codec: 'aac', numberOfChannels: aCfg.numberOfChannels, sampleRate: aCfg.sampleRate } } : {}),
      fastStart: 'in-memory',
      firstTimestampBehavior: 'strict',
    });

    let encodeErr = null;
    let encodedFrames = 0;
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
    const realtimePacing = vCfg.latencyMode === 'realtime';
    for (let i = 0; i < totalFrames; i++) {
      if (encodeErr) throw encodeErr;
      const t = i / FPS;
      render(t, dt, { hideGuides: true });

      const ts = Math.round(i * 1e6 / FPS);
      const nextTs = Math.round((i + 1) * 1e6 / FPS);
      const vf = new VideoFrame(cv, { timestamp: ts, duration: nextTs - ts });
      videoEncoder.encode(vf, { keyFrame: i % (FPS * 2) === 0 });
      vf.close();

      if (realtimePacing) {
        await new Promise(r => setTimeout(r, 16));
      } else {
        while (videoEncoder.encodeQueueSize > 6) {
          await new Promise(r => setTimeout(r, 6));
        }
      }
      if (i % 6 === 0) {
        statusEl.textContent = `Exportuji ${L.key} (${W}×${H} @ 60fps): ${Math.round((i / totalFrames) * 100)} %…`;
        updateHUD(t);
        await new Promise(r => setTimeout(r, 0));
      }
    }

    statusEl.textContent = 'Dokončuji MP4…';
    await videoEncoder.flush();
    videoEncoder.close();
    if (encodeErr) throw encodeErr;

    if (decodedAudio && aCfg) {
      const { sampleRate: sr, numberOfChannels: ch } = aCfg;
      const startSample = Math.max(0, Math.floor(SONG_OFFSET * sr));
      const totalSamples = Math.round(T * sr);
      const chunkSize = 1024;
      let audioErr = null;

      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => {
          if (chunk.duration != null && Number.isFinite(chunk.duration)) {
            muxer.addAudioChunk(chunk, meta);
          } else {
            const data = new Uint8Array(chunk.byteLength);
            chunk.copyTo(data);
            muxer.addAudioChunkRaw(data, chunk.type, chunk.timestamp, Math.round(chunkSize * 1e6 / sr), meta);
          }
        },
        error: e => { audioErr = e; },
      });
      audioEncoder.configure(aCfg);

      for (let off = 0; off < totalSamples; off += chunkSize) {
        if (audioErr) throw audioErr;
        const frames = Math.min(chunkSize, totalSamples - off);
        const planar = new Float32Array(frames * ch);
        for (let c = 0; c < ch; c++) {
          const src = decodedAudio.getChannelData(c);
          const dstStart = c * frames;
          for (let s = 0; s < frames; s++) {
            const idx = startSample + off + s;
            planar[dstStart + s] = idx < src.length ? src[idx] : 0;
          }
        }
        const ad = new AudioData({
          format: 'f32-planar',
          sampleRate: sr,
          numberOfFrames: frames,
          numberOfChannels: ch,
          timestamp: Math.round(off * 1e6 / sr),
          data: planar,
        });
        audioEncoder.encode(ad);
        ad.close();
      }
      await audioEncoder.flush();
      audioEncoder.close();
      if (audioErr) throw audioErr;
    }

    muxer.finalize();
    return { blob: new Blob([target.buffer], { type: 'video/mp4' }), encodedFrames, totalFrames, fps: FPS };
  }

  function recordMediaRecorderFallback() {
    const hasAudio = !!(audioDest && audioDest.stream.getAudioTracks()[0]);
    const candidates = hasAudio
      ? ['video/webm;codecs=vp9,opus', 'video/webm']
      : ['video/webm;codecs=vp9', 'video/webm'];
    const mime = candidates.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const chunks = [];
    const stream = cv.captureStream(60);
    if (hasAudio) stream.addTrack(audioDest.stream.getAudioTracks()[0]);
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10e6 });
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `darkydrevo-yaris-${L.key}.webm`;
      a.click();
      recorder = null;
      btnRec.disabled = false;
      statusEl.textContent = `Uloženo (${(blob.size / 1048576).toFixed(1)} MB) ✓`;
    };
    btnRec.disabled = true;
    statusEl.textContent = `Nahrávám smyčku (${T.toFixed(1)} s)…`;
    restart();
    recorder.start();
  }

  async function record() {
    if (recorder || exporting) return;
    if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined' && window.Mp4Muxer) {
      exporting = true;
      btnRec.disabled = true;
      if (audioOK && audioOn) audio.pause();
      statusEl.textContent = 'Připravuji export MP4…';
      let result = null;
      try {
        result = await exportQuickTimeMP4();
      } catch (err) {
        console.error('MP4 export failed, falling back to MediaRecorder:', err);
      }
      exporting = false;
      if (result && result.blob) {
        const mb = (result.blob.size / 1048576).toFixed(1);
        const filename = `darkydrevo-yaris-${L.key}.mp4`;
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        btnRec.disabled = false;
        statusEl.textContent = `Uloženo: ${filename} (${mb} MB · ${result.fps} fps) ✓`;
        restart();
        return;
      }
      recordMediaRecorderFallback();
      return;
    }
    recordMediaRecorderFallback();
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
    if (plaque.naturalWidth > 0) {
      plaqueAspect = plaque.naturalHeight / plaque.naturalWidth;
    }
    applyFormat(initFmtKey);
    buildEngraveMaps(blank, plaque);
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
