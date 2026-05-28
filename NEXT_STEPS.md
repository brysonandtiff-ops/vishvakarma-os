# Next Steps & Roadmap
## Vishvakarma.OS v1.0.0 → v1.1.0

**Current Status**: Internal demo ready; public production launch blocked pending live Firebase/Supabase evidence  
**Build**: YELLOW — automated gates pass locally; manual device and production backend proof still required  
**Last Updated**: 2026-05-29

---

## ✅ Recently Completed (v1.0.0 Polish)

### Corner Auto-Join Feature ✅
- **Status**: IMPLEMENTED
- **Description**: Walls automatically snap to nearby endpoints when drawing
- **Details**:
  - Snap distance: 20px radius
  - Visual feedback: Green pulsing circles when snapping
  - Works with grid snap: Grid snap first, then endpoint snap
  - Improves UX: Makes creating enclosed rooms much easier
- **Files Modified**: `BlueprintCanvas.tsx`

### Visual Feedback Enhancements ✅
- **Status**: IMPLEMENTED
- **Description**: Enhanced visual indicators for better user experience
- **Details**:
  - Green circle indicator when snapping to wall endpoints
  - Dual-ring design (solid + translucent) for emphasis
  - Real-time feedback during wall drawing
  - Maintains Architect's Table aesthetic
- **Files Modified**: `BlueprintCanvas.tsx`

---

## 🎯 Recommended Next Steps

### Priority 1: Testing & Quality Assurance (High Impact)

#### 1.1 Manual Testing Suite
- [ ] **Save/Load Determinism** (Gate 5)
  - Test: Create project → Save → Load → Verify identical state
  - Verify: All walls, openings, materials, lighting match exactly
  - Document: Create test checklist with pass/fail criteria
  
- [ ] **2D/3D Parity** (Gate 6)
  - Test: Draw complex layout → Verify 3D matches 2D exactly
  - Check: Wall positions, heights, opening placements
  - Document: Screenshot comparisons for verification
  
- [ ] **Performance Testing** (Gate 10)
  - Test: Run on iPad Air 2020 (target device)
  - Measure: Canvas rendering FPS, 3D viewport FPS
  - Verify: Smooth 60fps with 20+ walls and 10+ openings
  - Document: Performance metrics and bottlenecks

#### 1.2 Automated Test Suite (Gate 7)
- [ ] Set up Jest + React Testing Library
- [ ] Unit tests for room calculations (Shoelace formula)
- [ ] Unit tests for snap-to-grid logic
- [ ] Unit tests for corner auto-join
- [ ] Component tests for ToolRail
- [ ] Component tests for PropertiesPanel
- [ ] Integration tests for undo/redo system
- [ ] E2E tests for complete workflows

**Estimated Effort**: 2-3 days  
**Impact**: Moves build from YELLOW to GREEN

---

### Priority 2: UX Polish (Medium Impact)

#### 2.1 Drag-to-Reposition Openings
- [ ] Implement drag handles on opening markers
- [ ] Update parametric position during drag
- [ ] Show position percentage during drag
- [ ] Snap to wall endpoints when near
- [ ] Track in undo/redo history

**Estimated Effort**: 4-6 hours  
**Impact**: Significantly improves opening placement workflow

#### 2.2 Room Labeling
- [ ] Add Text tool (T) to ToolRail
- [ ] Click-to-place text labels
- [ ] Editable text with double-click
- [ ] Font size and color options
- [ ] Auto-position at room centroid
- [ ] Store in Project Manifest

**Estimated Effort**: 6-8 hours  
**Impact**: Essential for multi-room projects

#### 2.3 Persistent Dimension Annotations
- [ ] Add Dimension tool (Shift+M)
- [ ] Click two points to create dimension line
- [ ] Show measurement with leader lines
- [ ] Store dimensions in Project Manifest
- [ ] Toggle visibility with keyboard shortcut
- [ ] Export dimensions to PDF

**Estimated Effort**: 8-10 hours  
**Impact**: Professional architectural documentation

---

### Priority 3: Advanced Features (Lower Impact)

#### 3.1 Export to PDF
- [ ] Install jsPDF library
- [ ] Render 2D canvas to PDF
- [ ] Include measurements and labels
- [ ] Add project metadata (name, date)
- [ ] Scale to standard paper sizes (A4, Letter)
- [ ] Download button in toolbar

**Estimated Effort**: 6-8 hours  
**Impact**: Essential for sharing and printing

#### 3.2 Custom Material Library
- [ ] Extend MaterialPreset interface
- [ ] Add custom material creation dialog
- [ ] Color picker for custom colors
- [ ] Texture upload (optional)
- [ ] Save custom materials to database
- [ ] Material library management page

**Estimated Effort**: 10-12 hours  
**Impact**: Enhances visualization options

#### 3.3 Furniture Placement
- [ ] Add Furniture tool (F)
- [ ] Predefined furniture library (bed, table, chair, etc.)
- [ ] Click-to-place with rotation
- [ ] Drag-to-reposition
- [ ] Show in 3D viewport as simple boxes
- [ ] Store in Project Manifest

**Estimated Effort**: 12-16 hours  
**Impact**: Helps visualize space planning

---

## 📋 Release Planning

### v1.0.1 (Patch Release)
**Target**: 1 week  
**Focus**: Bug fixes and minor improvements
- [ ] Fix any reported bugs
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Optimize performance

### v1.1.0 (Minor Release)
**Target**: 2-3 weeks  
**Focus**: Testing and UX polish
- [ ] Complete automated test suite (Gate 7)
- [ ] Implement drag-to-reposition openings
- [ ] Add room labeling
- [ ] Add persistent dimension annotations
- [ ] Export to PDF

**Expected Build Status**: 🟢 GREEN (all 10 gates passing)

### v1.2.0 (Minor Release)
**Target**: 4-6 weeks  
**Focus**: Advanced features
- [ ] Custom material library
- [ ] Furniture placement
- [ ] Lighting fixtures
- [ ] Area calculation display in UI
- [ ] Multi-project management

### v2.0.0 (Major Release)
**Target**: 3-6 months  
**Focus**: Multi-story and collaboration
- [ ] Multi-story building support
- [ ] Terrain modeling
- [ ] Collaborative editing (real-time)
- [ ] Export to DXF/DWG
- [ ] BIM integration
- [ ] Mobile app (iOS/Android)

---

## 🔧 Technical Debt

### High Priority
1. [ ] Add error boundaries for React components
2. [ ] Implement proper loading states for database operations
3. [ ] Add retry logic for failed API calls
4. [ ] Optimize canvas rendering (use offscreen canvas)
5. [ ] Implement virtual scrolling for large project lists

### Medium Priority
6. [ ] Refactor BlueprintCanvas into smaller components
7. [ ] Extract canvas drawing logic into separate utility
8. [ ] Add TypeScript strict mode
9. [ ] Implement proper logging system
10. [ ] Add analytics tracking (privacy-respecting)

### Low Priority
11. [ ] Migrate to Vite 5.x
12. [ ] Update all dependencies to latest versions
13. [ ] Add Storybook for component documentation
14. [ ] Implement design system tokens
15. [ ] Add accessibility audit (WCAG 2.1 AA)

---

## 📊 Success Metrics

### v1.0.0 (Current)
- ✅ 100% feature completeness (41/41 features)
- ✅ 6/6 automated gates passing
- ✅ 0 lint errors, 0 TypeScript errors
- ⚠️ 4 manual testing warnings (expected)

### v1.1.0 (Target)
- 🎯 100% feature completeness + 3 new features
- 🎯 10/10 gates passing (all GREEN)
- 🎯 80%+ test coverage
- 🎯 < 100ms canvas render time
- 🎯 60fps on iPad Air 2020

### v2.0.0 (Vision)
- 🎯 Multi-story support (up to 10 floors)
- 🎯 Real-time collaboration (5+ users)
- 🎯 Export to industry formats (DXF, DWG, IFC)
- 🎯 Mobile app with Apple Pencil support
- 🎯 10,000+ active users

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [x] All automated gates passing
- [x] Lint passing (0 errors)
- [x] TypeScript passing (0 errors)
- [x] Documentation complete
- [ ] Manual testing complete (Gates 5, 6, 10)
- [ ] Performance testing complete
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] iPad testing (Air 2020, Pro 2021)

### Deployment
- [ ] Set up production environment
- [ ] Configure Supabase production instance
- [ ] Set up CDN for static assets
- [ ] Configure domain and SSL
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Set up analytics (privacy-respecting)

### Post-Deployment
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Create user documentation
- [ ] Create video tutorials
- [ ] Set up support channels

---

## 📚 Documentation Needs

### User Documentation
- [ ] Getting Started guide
- [ ] Tool reference (all 5 tools)
- [ ] Keyboard shortcuts reference
- [ ] Video tutorials (5-10 minutes each)
- [ ] FAQ section
- [ ] Troubleshooting guide

### Developer Documentation
- [ ] Architecture overview
- [ ] Component documentation
- [ ] API reference
- [ ] Database schema documentation
- [ ] Deployment guide
- [ ] Contributing guide

### Governance Documentation
- [x] SPEC.md (locked)
- [x] REGISTRY.md (complete)
- [x] RELEASE.md (10 gates)
- [ ] CHANGELOG.md (version history)
- [ ] MIGRATION.md (upgrade guides)
- [ ] SECURITY.md (security policy)

---

## 💡 Feature Ideas (Backlog)

### Community Requests
- [ ] Import from DXF/DWG
- [ ] Curved walls
- [ ] Stairs and ramps
- [ ] Roof design
- [ ] Landscaping tools
- [ ] Cost estimation
- [ ] Material quantities
- [ ] Energy efficiency calculations

### Innovation Ideas
- [ ] AI-powered room suggestions
- [ ] AR preview (view in real space)
- [ ] VR walkthrough
- [ ] Voice commands
- [ ] Gesture controls (iPad)
- [ ] Automatic furniture arrangement
- [ ] Style transfer (apply design styles)
- [ ] Compliance checking (building codes)

---

**Last Updated**: 2026-02-15  
**Next Review**: 2026-02-22  
**Status**: ✅ v1.0.0 Production Ready, Planning v1.1.0
