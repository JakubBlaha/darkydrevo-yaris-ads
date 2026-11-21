import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const ROOT = import.meta.dirname;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 60;
const ENTRY_HTML = process.argv[2] || 'index.html';
const OUT_PREFIX = process.argv[3] || (ENTRY_HTML === 'circle.html' ? 'darkydrevo-yaris-circle' : 'darkydrevo-yaris');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
      const full = path.join(ROOT, rel);
      if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(full).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(full).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => {
      resolve({ srv, port: srv.address().port });
    });
  });
}

function launchChrome(userDataDir) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CHROME, [
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    const onData = (chunk) => {
      stderr += chunk.toString();
      const m = stderr.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:(\d+)\/[^\s]+)/);
      if (m) {
        proc.stderr.off('data', onData);
        resolve({ proc, port: Number(m[2]), browserWs: m[1] });
      }
    };
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => reject(new Error(`Chrome exited early (${code}): ${stderr}`)));
  });
}

async function connectPageCDP(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await res.json();
  const page = targets.find((t) => t.type === 'page') || targets[0];
  if (!page?.webSocketDebuggerUrl) throw new Error('No CDP page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  const evalJS = async (expression, awaitPromise = false) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result?.value;
  };

  return { ws, send, evalJS };
}

async function writeChunk(stream, buf) {
  if (!stream.write(buf)) {
    await new Promise((resolve) => stream.once('drain', resolve));
  }
}

async function exportFormat(evalJS, fmt) {
  const outPath = path.join(ROOT, `${OUT_PREFIX}-${fmt}.mp4`);
  const info = await evalJS(`
    (async () => {
      await document.fonts.ready;
      window.__ad.setFormat(${JSON.stringify(fmt)});
      window.__ad.pause();
      window.__ad.seek(0);
      const cv = document.getElementById('stage');
      return { T: window.__ad.T, w: cv.width, h: cv.height };
    })()
  `, true);

  const totalFrames = Math.round(info.T * FPS);
  const actualDuration = totalFrames / FPS;
  const songPath = path.join(ROOT, 'assets', 'song.mp3');
  const hasSong = fs.existsSync(songPath);
  const songOffset = 10.0;
  console.log(`Exporting ${fmt} (${info.w}x${info.h}, ${totalFrames} frames @ ${FPS} fps, audio=${hasSong ? `song.mp3@${songOffset}s` : 'none'}) -> ${outPath}`);

  const ffArgs = [
    '-y',
    '-loglevel', 'error',
    '-f', 'image2pipe',
    '-vcodec', 'png',
    '-framerate', String(FPS),
    '-i', '-',
  ];
  if (hasSong) {
    const fadeStart = Math.max(0, actualDuration - 0.4).toFixed(3);
    ffArgs.push(
      '-ss', String(songOffset),
      '-t', actualDuration.toFixed(4),
      '-i', songPath,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-af', `afade=t=in:st=0:d=0.05,afade=t=out:st=${fadeStart}:d=0.4`,
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      '-ac', '2',
      '-shortest',
    );
  } else {
    ffArgs.push('-an');
  }
  ffArgs.push(
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-level', '4.2',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-maxrate', '10M',
    '-bufsize', '20M',
    '-movflags', '+faststart',
    outPath,
  );

  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const ffDone = new Promise((resolve, reject) => {
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  });

  const dt = 1 / FPS;
  for (let i = 0; i < totalFrames; i++) {
    const t = i / FPS;
    const b64 = await evalJS(`
      (() => {
        window.__ad.render(${t}, ${dt}, { hideGuides: true });
        return document.getElementById('stage').toDataURL('image/png').slice(22);
      })()
    `);
    await writeChunk(ff.stdin, Buffer.from(b64, 'base64'));
    if (i > 0 && i % 192 === 0) {
      console.log(`  ${fmt}: ${Math.round((i / totalFrames) * 100)}%`);
    }
  }

  ff.stdin.end();
  await ffDone;

  const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
  console.log(`Done ${fmt}: ${outPath} (${sizeMB} MB)`);
  return { outPath, sizeMB, w: info.w, h: info.h, duration: info.T };
}

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yaris-export-'));
const { srv, port: httpPort } = await startStaticServer();
let chromeProc = null;

try {
  const chrome = await launchChrome(userDataDir);
  chromeProc = chrome.proc;
  const { ws, send, evalJS } = await connectPageCDP(chrome.port);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${httpPort}/${ENTRY_HTML}?format=9x16` });

  for (let tries = 0; tries < 100; tries++) {
    const ready = await evalJS('Boolean(window.__ad)');
    if (ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!(await evalJS('Boolean(window.__ad)'))) {
    throw new Error('Timed out waiting for window.__ad');
  }

  await exportFormat(evalJS, '9x16');
  await exportFormat(evalJS, '4x5');

  ws.close();
} finally {
  if (chromeProc) chromeProc.kill('SIGKILL');
  srv.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
}
