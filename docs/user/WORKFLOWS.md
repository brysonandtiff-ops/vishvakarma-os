# Common Workflows

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** user  

Step-by-step guides for frequent tasks in Vishvakarma.OS.

---

## Draw a floor plan

1. Open **Projects** → create or open a project
2. Select the **Wall** tool from the tool rail
3. Click start point, click end point — repeat for each wall
4. Use **Door** and **Window** tools on existing walls
5. Enable **snap-to-grid** for aligned geometry
6. Changes save automatically when signed in with cloud backend

Tools: [TOOL_REFERENCE.md](./TOOL_REFERENCE.md)

---

## Preview in 3D

1. Open the editor with walls drawn
2. Toggle the **3D viewport** (side panel or view control)
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
