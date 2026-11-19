> **Studio freeze, 19 November 2026.** Desktop Chromium verified the browser-local workflow. Signed-in cloud and physical-device checks are pending. [Current release status](../release/CURRENT_RELEASE_STATUS.md).

# Common Workflows

**Product version:** v1.5.0

**Browser-local design workflow checked:** 2026-11-19

**Audience:** user


Step-by-step guides for frequent tasks in Vishvakarma.OS.

---

## Draw a floor plan

1. Create or open a plan in **Projects**, then select **Blueprint** in Studio
2. Select the **Wall** tool from the tool rail
3. Click start point, click end point — repeat for each wall
4. Use **Door** and **Window** tools on existing walls
5. Enable **snap-to-grid** for aligned geometry
6. Select **Save**. Check the current storage status and reopen the plan from **Projects** to verify the saved design

Tools: [TOOL_REFERENCE.md](./TOOL_REFERENCE.md)

---

## Preview in 3D

1. Open a design in Studio
2. Select **3D** in the Studio view control to orbit. Select **Walk** to explore at eye height
3. Adjust **materials** from the material picker
4. Scrub **solar time** to simulate lighting through the day
5. Switch atmosphere modes (Standard / Sacred 3D View on supported tiers)

Requires WebGL — see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) if viewport is blank.

---

## Export deliverables

1. Open project in editor
2. Use **Export** from the top bar or export menu
3. Available formats depend on plan tier — see [EXPORT_LIMITATIONS.md](./EXPORT_LIMITATIONS.md)

| Format | Typical use |
|--------|-------------|
| PNG | Quick image snapshot |
| SVG | Vector floor plan |
| PDF | Printable project summary |
| JSON | Full manifest backup |
| DXF | CAD exchange (Studio+) |

Studio tier unlocks the full export package.

---

## Run design optimization

1. Navigate to **Design Optimization** (`/optimization`)
2. Enter design goals, budget, and lifestyle preferences
3. Review scored candidates (cost, council, compliance dimensions)
4. **Promote** a winner to save as a new project or link to existing

Outputs are decision-support — not certified engineering or permit approval.

---

## Compliance pre-check

1. From editor or compliance module, run **NBC India pre-check** (when available for region)
2. Review report findings and export
3. Use as internal checklist before professional review

See [PRODUCT_CAPABILITIES.md](../PRODUCT_CAPABILITIES.md) § compliance disclaimers.

---

## Manage billing

1. Go to **Profile** (`/profile`)
2. View current plan and status
3. **Upgrade** → Stripe Checkout (Studio / Enterprise)
4. **Manage billing** → Stripe Customer Portal

Details: [BILLING_AND_PLANS.md](./BILLING_AND_PLANS.md)

---

## Governance (Studio+)

Access from navigation when signed in:

- **Spec Center** — locked specifications
- **Change Requests** — propose governed changes
- **Release Center** — gate-checked releases
- **Audit Log** — system event timeline

For developers: [GOVERNANCE_QUICKSTART.md](../GOVERNANCE_QUICKSTART.md)
