# QA Evidence Export Pack

This checklist verifies the QA Evidence panel can save a local proof pack as Markdown or JSON.

Checks:

- Export Markdown downloads a `.md` file.
- Export JSON downloads a `.json` file.
- Copy pack copies Markdown when clipboard access is available.
- Mark passed state appears in the exported pack.
- Pending cards remain marked pending.
- Auth, routes, Supabase, and PWA behavior remain unchanged.
- Export controls remain reachable on iPad.
