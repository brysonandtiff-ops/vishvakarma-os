# Vishvakarma.OS Demo Media Kit

This folder is the repeatable handoff for recording or screenshotting the strongest Vishvakarma.OS story.

## Core walkthrough

```text
Landing → Projects demo card → Editor → 2D/3D → AI Copilot proof flow → Export preview
```

Use the full narration and shot list in:

```text
docs/demo/VISHVAKARMA_OS_2_MIN_DEMO_FLOW.md
```

## Capture screenshots

Run the existing screenshot pack command:

```bash
pnpm run test:screenshots
```

The demo-flow capture should generate these files:

```text
docs/demo/screenshots/01-landing.png
docs/demo/screenshots/02-projects-demo-cards.png
docs/demo/screenshots/03-editor-2d-demo-blueprint.png
docs/demo/screenshots/04-editor-3d-preview.png
docs/demo/screenshots/05-ai-copilot-proof-flow.png
docs/demo/screenshots/06-export-preview.png
```

## Verify the media pack

After screenshots are captured, verify the demo pack:

```bash
node scripts/demo/verify-demo-assets.mjs
```

The verifier checks that the 2-minute demo script exists and that all six expected screenshot files exist and are non-empty.

## Record the 2-minute video

Use the same path as the screenshot pack:

1. Landing page.
2. Projects demo cards.
3. Open a ready blueprint.
4. Show 2D editor.
5. Show 3D preview.
6. Show AI Copilot proof flow.
7. Show export preview.

Recommended title:

```text
Vishvakarma.OS — 2-Minute Architecture Workstation Demo
```

Recommended description:

```text
A fast walkthrough of Vishvakarma.OS: demo blueprint launch, 2D editor, 3D preview, AI Copilot proof flow, AUD estimate, decision-support compliance notes, and export preview. Prototype/pilot product — not certified building approval or engineering validation.
```

## Publishing checklist

Before sharing publicly:

- Confirm no secrets, keys, private dashboards, or personal emails are visible.
- Confirm AUD cost is framed as an estimate, not a fixed quote.
- Confirm compliance is described as decision-support only.
- Confirm no claim says the product replaces architects, engineers, or council approval.
- Confirm screenshots/video follow the exact demo flow.

## Best use cases

- Investor deck screenshots.
- Flippa or acquisition listing visuals.
- Product homepage media.
- Private pilot onboarding.
- Founder demo video.
- Release evidence pack.
