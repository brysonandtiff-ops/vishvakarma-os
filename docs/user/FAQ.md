# FAQ

## Why does sign-in say Firebase is not configured?

Production auth uses Firebase email-link sign-in. Add the Firebase variables from `.env.example` to your deployment host or `.env.local`.

## Why are projects not saving to the cloud?

Data persistence uses Supabase. Without `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the app runs in local-only demo mode.

## Can I use the editor without signing in?

Only in local development with `VITE_ALLOW_LOCAL_DEMO=true`. Production builds require authentication for all workspace routes except `/auth`.

## PDF export looks like a summary, not a drawing

PDF export currently produces a printable project summary. Use SVG export for full vector floor plan detail.

## How do I clear a stuck collaboration session?

Refresh the page. Collaboration rooms are scoped per project session and reset on disconnect.

## Troubleshooting

- **Blank editor after sign-in**: Check browser console for Supabase connection errors.
- **3D viewport unavailable**: WebGL may be disabled; 2D editing remains available.
- **Import failed**: Prefer JSON exports from Vishvakarma.OS; SVG import supports wall/opening geometry from app-generated SVG.
