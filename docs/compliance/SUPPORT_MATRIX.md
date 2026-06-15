# Support Matrix

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** user, operator  

Browser, device, and version support policy.

Source: `package.json` browserslist and [SECURITY.md](../../SECURITY.md)

---

## Supported browsers

| Browser | Minimum version | Notes |
|---------|-----------------|-------|
| Chrome / Edge | 90+ | Recommended for development |
| Firefox | 88+ | Full support |
| Safari (macOS) | 14+ | WebGL 2 preferred |
| iOS Safari | 14+ | iPad-first target; PWA install supported |

---

## 3D / WebGL

| Capability | Support |
|------------|---------|
| WebGL 2 | Preferred — full 3D features |
| WebGL 1 | Fallback — reduced effects |
| No WebGL | 2D editor only — graceful degradation |

---

## Supported product versions

| Version | Support status |
|---------|----------------|
| 1.5.x | Current — full support |
| 1.2.x – 1.4.x | Supported — upgrade recommended |
| 1.0.x – 1.1.x | Security fixes only |
| < 1.0 | Unsupported |

Security reporting: [SECURITY.md](../../SECURITY.md)

---

## Device targets

| Device | Status | Automated E2E |
|--------|--------|-----------------|
| iPad (Safari PWA) | Primary production target | `ipad-editor-layout`, `device-governance-layout`, `device-marketing-layout` |
| iPhone | Supported — phone breakpoint 430px | `device-phone-editor`, `device-marketing-layout` |
| Android tablet | Best-effort — coarse pointer CSS | `device-governance-layout` (1280×800) |
| Desktop (Chrome, Safari, Firefox) | Supported — fine pointer walk mode | `device-desktop-layout` |

Touch minimum target: **44×44 px** (see [release/evidence/device-hardening-audit.md](../release/evidence/device-hardening-audit.md))

Manual physical iPad steps: [release/DEVICE_HARDENING_RUNBOOK.md](../release/DEVICE_HARDENING_RUNBOOK.md)

---

## Unsupported

- Internet Explorer
- Browsers without ES2020 support
- Server-side rendering clients (app is SPA-only)

---

## Related

- [user/TROUBLESHOOTING.md](../user/TROUBLESHOOTING.md)
- [release/IPAD_PRODUCTION_READINESS.md](../release/IPAD_PRODUCTION_READINESS.md)
