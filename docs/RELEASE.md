# RELEASE.md - Release Gates and Evidence Requirements

> **Historical:** This document describes the original v1.0 **10-gate** release model. The current production release pipeline uses **13 gates** — see [ADR-004: 13-gate release pipeline](./adr/004-thirteen-gate-release-pipeline.md) and [Operator checklist](./release/OPERATOR_CHECKLIST.md).

## Release Gates for Blueprint Editor

Every release of Vishvakarma.OS must pass all gates before being marked "Ready for Release". These gates ensure quality, governance compliance, and deterministic behavior.

### Gate 1: Spec Present and Valid

**Requirement**: Blueprint Editor specification must exist, be complete, and locked.

**Checks**:
- `/docs/SPEC.md` file exists
- Contains "Blueprint Editor v1.0.0 [LOCKED]" section
- All required sections present:
  - Required UI Regions
  - Tool List
  - Interaction Rules
  - File Format: Project Manifest
  - Validation Rules
  - 2D/3D Synchronization Rules
  - Material Presets
  - Stop-Ship Conditions
- Spec hash matches expected value

**Pass Criteria**: All checks pass

**Fix**: Update SPEC.md with missing sections or correct hash

---

### Gate 2: Registry Valid

**Requirement**: All entities must be registered with complete schemas.

**Checks**:
- `/docs/REGISTRY.md` file exists
- All 8 core entities documented:
  - Project
  - ProjectManifest
  - GridSettings
  - WallSegment (Wall)
  - Opening
  - MaterialPreset
  - EnvironmentState (LightingConfig)
  - ViewportState
- Each entity has schema, defaults, and validation rules
- Registry version matches manifest version

**Pass Criteria**: All entities documented with complete schemas

**Fix**: Add missing entities or complete schema definitions

---

### Gate 3: Routes Match Manifest

**Requirement**: All routes must be declared in route_manifest table.

**Checks**:
- Query `route_manifest` table
- Verify all routes in `routes.tsx` have corresponding entries
- No undeclared routes exist
- All visible routes are accessible

**Pass Criteria**: 100% route coverage

**Fix**: Add missing routes to route_manifest or remove undeclared routes

---

### Gate 4: Sample Loads Successfully

**Requirement**: Sample project must load without errors.

**Checks**:
- `/public/samples/sample-house-01.json` exists
- File parses as valid JSON
- Validates against ProjectManifest schema
- All wall IDs unique
- All opening wallId references exist
- All material references valid
- Lighting values in valid ranges
- Grid size > 0

**Pass Criteria**: Sample validates with zero errors

**Fix**: Correct sample JSON or update schema

---

### Gate 5: Save/Load Deterministic

**Requirement**: Save → Load must reproduce identical state.

**Checks**:
- Create test project with walls, openings, materials
- Save to JSON
- Clear state
- Load from JSON
- Compare: walls match, openings match, lighting match
- No data loss
- No floating-point drift (coordinates match to 2 decimals)

**Pass Criteria**: Loaded state === Saved state

**Fix**: Fix serialization/deserialization logic

---

### Gate 6: 2D/3D Parity

**Requirement**: Same manifest produces identical 2D and 3D representations.

**Checks**:
- Load sample project
- Count walls in 2D canvas
- Count wall meshes in 3D scene
- Verify wall count matches
- Verify opening count matches
- Run twice: results must be identical (deterministic)

**Pass Criteria**: 2D count === 3D count, deterministic rendering

**Fix**: Fix 2D or 3D rendering logic to ensure synchronization

---

### Gate 7: Tests Green

**Requirement**: All automated tests must pass.

**Checks**:
- Unit tests pass (if implemented)
- Integration tests pass (if implemented)
- Smoke tests pass:
  - Open editor
  - Draw wall
  - Place door
  - Toggle 3D view
  - Save project
  - Load project
- No console errors
- No unhandled exceptions

**Pass Criteria**: All tests pass, zero errors

**Fix**: Fix failing tests or broken functionality

---

### Gate 8: Touch Targets Valid

**Requirement**: All interactive elements meet iPad touch target size (44px minimum).

**Checks**:
- Tool buttons: >= 48px × 48px
- Canvas elements: 10px hit radius
- Control sliders: >= 44px height
- Buttons: >= 44px × 44px
- No interactive elements < 44px

**Pass Criteria**: All touch targets meet or exceed minimum size

**Fix**: Increase size of small interactive elements

---

### Gate 9: No Spec Drift

**Requirement**: All UI elements must be declared in spec.

**Checks**:
- Scan codebase for UI element IDs
- Compare against DECLARED_UI_ELEMENTS in specValidation.ts
- No undeclared elements found

**Pass Criteria**: Zero undeclared UI elements

**Fix**: Add elements to spec or remove from UI

---

### Gate 10: Performance Acceptable

**Requirement**: Editor must perform well on target hardware (iPad Air 2020).

**Checks**:
- 2D canvas updates: < 16ms (60 FPS)
- 3D scene updates: < 200ms
- Wall drawing: smooth, no jitter
- Pan/zoom: responsive
- No memory leaks (test 10-minute session)

**Pass Criteria**: All performance targets met

**Fix**: Optimize rendering, debounce updates, reduce complexity

---

## Evidence Pack Requirements

For each release, generate an evidence pack containing:

### 1. Screenshots
- All UI regions visible
- Tool dock with all tools
- Canvas with sample project loaded
- 3D viewport showing extruded walls
- Properties panel with controls
- Each tool in use (select, wall, door, window, measure)
- Grid visible and snap indicators
- High contrast mode (if implemented)

### 2. Spec Hash
- Current spec hash from SPEC.md
- Verification that hash matches expected value
- Change log if hash changed since last release

### 3. Build ID
- Git commit hash (if available)
- Build timestamp
- Version number (1.0.0)
- Environment (production/staging)

### 4. Test Logs
- Output from `pnpm run lint`
- Output from `pnpm run release:gates`
- Smoke test results
- Performance metrics

### 5. Sample Project
- `sample-house-01.json` file
- Validation results
- Screenshot of loaded sample

### 6. Validation Results
- Spec validation output
- Registry validation output
- Manifest schema validation output
- Route manifest check output

---

## Release Checklist

Before marking a release as "Ready":

- [ ] All 13 gates pass (see [ADR-004](./adr/004-thirteen-gate-release-pipeline.md) and [OPERATOR_CHECKLIST](./release/OPERATOR_CHECKLIST.md); this document's 10-gate list is historical)
- [ ] Evidence pack generated
- [ ] Documentation updated
- [ ] Change requests linked
- [ ] Audit log entries created
- [ ] No stop-ship violations
- [ ] Spec hash verified
- [ ] Sample project validates
- [ ] Tests green
- [ ] Performance acceptable

---

## Stop-Ship Violations

The following violations will block release:

1. **Spec Drift**: UI element not in spec
2. **Schema Violation**: Manifest fails validation
3. **2D/3D Mismatch**: Rendering not deterministic
4. **Data Loss**: Save/load loses data
5. **Touch Target Violation**: Element < 44px
6. **Performance Failure**: Update > 500ms
7. **Test Failure**: Any test fails
8. **Route Mismatch**: Undeclared route exists
9. **Sample Failure**: Sample doesn't load
10. **Registry Mismatch**: Unknown keys in manifest

---

## Bypass Procedure

**CRITICAL**: Release gates cannot be bypassed without:

1. Approved Change Request explaining why
2. Executive approval
3. Documented risk assessment
4. Mitigation plan
5. Audit log entry

**Default**: NO BYPASS ALLOWED

---

## CI Integration

The `release:gates` script runs all gate checks:

```bash
pnpm run release:gates
```

**Exit Codes**:
- 0: All gates pass (green build)
- 1: One or more gates fail (red build)

**CI Configuration**:
- Run on every commit
- Block merge if gates fail
- Generate evidence pack on success
- Notify team on failure

---

## Evidence Pack Generation

```bash
npm run generate:evidence
```

Creates `/evidence/release-{version}-{timestamp}/` containing:
- screenshots/
- logs/
- validation-results.json
- spec-hash.txt
- build-info.json
- sample-validation.json

---

## Version History

**1.0.0** (2026-02-15):
- Initial release gates defined
- 10 core gates
- Evidence pack requirements
- Stop-ship violations documented
