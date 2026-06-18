# Vercel deployment fix note — 2026-06-18

Latest production deployment failed after the Sprint 1 performance and UI polish commit. The safe first fix is to reduce deployment payload from the new WebP texture conversion by excluding legacy JPEG texture copies from Vercel builds while keeping them in git as source/reference assets.

Recommended deploy trim:

```txt
public/textures/**/*.jpg
public/textures/**/*.jpeg
```

The runtime material catalog now points at WebP texture URLs, so the production deployment should not need the duplicate JPEG texture copies.
