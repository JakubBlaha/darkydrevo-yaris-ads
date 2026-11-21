# Dárky Dřevo – Bouncing Toyota Yaris Meta Ads

Canvas-rendered 60 fps Instagram / Meta video ads for **[darkydrevo.cz](https://darkydrevo.cz)** combining the viral **Bouncing Yaris** meme (28-slice rubber squash-and-stretch synced to 135 BPM) with pixel-accurate laser engraving and perspective-cropped wooden plaques from `darkydrevo.cz/galerie`.

## Exported Videos (`60 fps`, H.264 + AAC, `< 30 MB`, Meta-ready)

### Version 1 — Solo Laser Bouncing Yaris (`index.html` + `ad.js`)
- `darkydrevo-yaris-9x16.mp4` — `1080 × 1920 px` (IG Reels & Stories, all content inside Meta's `269–1248 px` safe zone)
- `darkydrevo-yaris-4x5.mp4` — `1080 × 1350 px` (IG Feed)

### Version 2 — Yaris Circle Ritual (`circle.html` + `circle.js`)
- `darkydrevo-yaris-circle-9x16.mp4` — `1080 × 1920 px` (IG Reels & Stories, safe zone `269–1248 px`)
- `darkydrevo-yaris-circle-4x5.mp4` — `1080 × 1350 px` (IG Feed)

## Headless 60 fps Export

Requires macOS with Google Chrome and `ffmpeg`:

```bash
node export.mjs index.html darkydrevo-yaris
node export.mjs circle.html darkydrevo-yaris-circle
```
