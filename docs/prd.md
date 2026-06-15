# Requirements Document

> **Historical:** This document describes v1.0-era scope. For current production, see [CURRENT_PRODUCTION_ARCHITECTURE.md](./CURRENT_PRODUCTION_ARCHITECTURE.md).

## 1. Application Overview

### 1.1 Application Name
Vishvakarma.OS v1.0.0

### 1.2 Application Description
An iPad-first, browser-native architectural blueprint editor and real-time 3D studio with strict governance framework. The system provides a unified workspace for 2D blueprint editing, real-time 3D visualization, material application, solar lighting simulation, and comprehensive project governance. The application features a professional workstation aesthetic matching industry-standard architectural software.

## 2. User and Usage Scenarios

### 2.1 Target Users
- Architects and architectural designers
- Interior designers
- Construction professionals
- Design students and educators
- Project managers requiring blueprint governance

### 2.2 Core Usage Scenarios
- Creating and editing 2D architectural blueprints on iPad
- Real-time 3D visualization of floor plans
- Material selection and application
- Solar lighting simulation for different times of day
- Project version control and governance
- Collaborative design with multi-user editing
- Export and import of project files

## 3. Page Structure and Functionality

### 3.1 Page Hierarchy

> **Note:** This PRD describes the original v1.0 scope. The editor moved to `/editor`; marketing and billing routes were added in v1.1+. See [`README.md`](../README.md) and [`docs/README.md`](./README.md) for the current route map.

```
Vishvakarma.OS
├── / (Landing — marketing home)
├── /editor (Blueprint Editor — Main Workspace)
├── /projects (Project library)
├── /optimization (Design optimization)
├── /profile (Account + billing)
├── /features, /pricing (public marketing)
├── /auth, /reset-password (auth)
├── /spec-center (Specification Management)
├── /registry (Component Registry)
├── /change-requests (Change Management)
├── /releases (Release Center)
├── /world-records (Gate-count registry)
└── /audit (Audit Log)
```

### 3.2 Blueprint Editor (Main Workspace)

**Layout Structure**:
- Top: Application menu bar with File, Edit, View, Tools, Help menus
- Left: Fixed/collapsible sidebar for mode switching (2D Plan, 3D View, Materials, Project Settings)
- Left toolbar: Primary drawing and editing tools organized in logical groups (Draw, Modify, View, Export)
- Center: Main canvas area for 2D blueprint editing with infinite drafting board feel
- Right: Properties/Layers panel with categorized accordions or tabs
- Right viewport: Toggleable 3D visualization split view
- Bottom: Status bar displaying cursor coordinates, scale, selected tool hint

**Visual Design**:
- Primary workspace/canvas: dark gray (#2d2d2d to #3c3c3c) or very dark blue
- Secondary panels: off-white/light gray (#f8f9fa, #e8e8e8)
- Accent color: muted blue (#4a90e2) or teal for interactive states
- Typography: Inter, Roboto, or SF Pro/Segoe UI sans-serif with clear hierarchy
- Iconography: Modern minimalist line-based icons with consistent stroke weight
- Spacing: 8px grid system with generous padding
- Touch targets: Minimum 44px for iPad optimization

**2D Canvas Features**:
- Adjustable grid system with subtle light gray dots or lines on dark background
- Snap-to-grid functionality with visual feedback
- Wall drawing tool: click-to-start, click-to-end, drag-to-preview
- Door and window placement tools with real-time preview and snap-on-wall interaction
- Measurement tool with real-time dimension display
- Object selection with colored highlight box and resize handles
- Canvas interactions: one-finger draw, two-finger pan, pinch-to-zoom, three-finger undo/redo
- Apple Pencil support with pointer events
- Precision mode toggle for enhanced snap and measurement display
- Corner auto-connection and merge collinear segments

**Toolbar Design**:
- Logical tool groups: Draw, Modify, View, Export
- Icon buttons with labeled dropdowns
- Active tool indication: filled icon with accent background
- Subtle hover and active states
- Tool switching with smooth micro-animations

**Properties/Layers Panel**:
- Categorized accordions or tabs for organization
- Clean modern input fields with subtle borders and clear labels
- Layer list with visibility toggle, lock, and reorder capabilities
- Material properties display and editing
- Lighting controls with solar timeline slider
- Smooth panel expansion animations

**3D Viewport**:
- Real-time wall extrusion from 2D blueprint
- Automatic door and window opening rendering with hole carving
- View synchronized with 2D editor changes (100-200ms update)
- Simple ambient occlusion and soft shadows
- Camera controls: orbit rotation, pan, zoom with smooth jitter-free experience
- Material texture display
- Lighting presets for realistic visualization

**Material System**:
- Three material presets: paint, wood, concrete
- Apply materials to walls and floors
- Material properties stored in project manifest

**Lighting System**:
- Solar timeline slider for time simulation
- Radial dial UI (large, professional style) with sunAngle control
- Mode toggle: day/golden-hour/night with temperature and exposure adjustments
- Snap ticks (every 15 degrees) with haptic feedback
- Adjustable sun direction control
- Real-time lighting updates in 3D viewport

**Interaction Design**:
- Subtle micro-animations for panel expansion, button press, tooltip fade
- Clear hover, active, focus states on all interactive elements
- Clean modal windows: centered, shadow/backdrop, clear button hierarchy
- Snapping visual feedback with cursor/hover preview
- Measurement data display with clean charts and organized tables

**Project Management**:
- Save projects locally as project manifest JSON
- Load existing projects from JSON with safe parsing and schema validation
- Project manifest as single source of truth
- Example house-01 seed project
- Versioned migrations for future schema changes
- Error reporting for schema mismatches

### 3.3 Spec Center

**Purpose**: Centralized specification management and documentation

**Features**:
- Blueprint Editor v1.0.0 specification section display
- Tool list and interaction rules documentation
- Grid/snap rules reference
- File format (project manifest) specification
- Required UI regions documentation
- Version display with LOCKED tag
- Spec hash display (SHA256) for traceability

**Visual Design**:
- Professional documentation layout
- Clear typography hierarchy
- Code blocks for technical specifications
- Navigation sidebar for quick access to sections

### 3.4 Registry

**Purpose**: Component and feature registration management

**Features**:
- Entity registration display: project, grid settings, wall segments, openings, material presets, environment state, viewport state
- JSON schema display and validation
- Schema versioning: registry_version, manifest_version, migration_notes
- Runtime validators status
- Component dependency visualization

**Visual Design**:
- Structured data tables
- Schema visualization
- Status indicators for validators
- Search and filter capabilities

### 3.5 Change Requests

**Purpose**: Structured change management workflow

**Features**:
- Change request submission form
- Change request list with status tracking
- Approval workflow management
- Change impact assessment display
- Version history tracking

**Visual Design**:
- Clean form layouts
- Status badges with clear color coding
- Timeline visualization for approval workflow
- Detailed change description display

### 3.6 Releases

**Purpose**: Release gating and version control

**Features**:
- Green build gates display: spec exists, registry valid, routes match, example loads, save/load deterministic, 2D/3D consistency check, tests pass
- Evidence package page: screenshots, spec hash, build ID, test logs
- Release version list with status
- Release notes display
- Deployment status tracking

**Visual Design**:
- Gate status dashboard with clear pass/fail indicators
- Evidence gallery with organized screenshots and logs
- Version timeline visualization
- Release notes with structured formatting

### 3.7 Audit

**Purpose**: Comprehensive audit log tracking

**Features**:
- Audit log display tracking major actions: project creation, change request acceptance, release creation
- Deterministic state model with replayable operations
- Timestamp and user information for each action
- Filter and search capabilities
- Export audit log functionality

**Visual Design**:
- Chronological log display
- Action type categorization with icons
- Detailed action information expansion
- Search and filter controls

## 4. Business Rules and Logic

### 4.1 State Management
- Project manifest JSON as single source of truth
- Deterministic state model with replayable operations
- Quantize all points to grid step before save to prevent floating-point drift
- State synchronization between 2D editor and 3D viewport

### 4.2 Wall and Opening Logic
- Wall segments stored with precise coordinates, thickness, and height
- Openings (doors/windows) anchored to wall segments with parameterized position (0..1)
- Opening properties: width, height, sill height, swing direction toggle for doors
- Wall-end position clamping for openings
- Corner auto-connection and merge collinear segments
- Diagonal and corner wall handling for snap alignment

### 4.3 2D/3D Consistency
- All 2D elements automatically mapped to 3D geometry
- Real-time updates: modifications in 2D editor immediately reflected in 3D view
- Consistency validation to prevent divergence
- Deterministic mesh generation: same manifest builds same mesh count every time

### 4.4 Material and Lighting Rules
- Material presets: paint, wood, concrete
- Materials applied to walls and floors
- Material properties stored in project manifest
- Solar angle and mode (day/golden-hour/night) stored in environment state
- Lighting updates persist to project manifest

### 4.5 Governance Rules
- All features must have spec entry before implementation
- Registry schema must validate example projects
- Release gates must pass before deployment
- Spec changes require formal change request approval
- No ad-hoc page creation; single route manifest controls all navigation
- Audit log tracks all major actions

### 4.6 Collaboration Rules
- Real-time collaboration via WebSocket or WebRTC
- Per-element edit locking mechanism prevents users from overwriting each other
- Multi-user governance records all changes
- Real-time cursor and tool usage indicators
- Conflict resolution through locking mechanism

### 4.7 Export/Import Rules
- Export formats: JSON, 2D, 3D (GLTF/OBJ), PDF, SVG
- Export files contain all tools, snap, measurement, doors, windows, and governance history
- Import validates file format compatibility
- Import restores precise layout, properties, and version history

## 5. Exception and Boundary Conditions

| Scenario | Handling |
|----------|----------|
| Invalid wall placement | Display error message, prevent placement |
| Invalid opening placement | Display error message, prevent placement |
| Out-of-bounds interactions | Clamp to valid range, display warning |
| Invalid project manifest upload | Display validation error, prevent load |
| Malformed JSON data | Display parsing error, prevent load |
| Schema validation failure | Display schema mismatch error, block save |
| WebGL context loss | Attempt context restoration, display error if failed |
| 2D/3D consistency violation | Display warning, trigger consistency check |
| Coordinate precision error | Quantize to grid step, log warning |
| Overlapping openings | Display conflict indicator, prevent placement |
| Opening width exceeds wall length | Display error, prevent placement |
| Maximum geometry complexity | Display performance warning, suggest optimization |
| Corrupted manifest data | Attempt auto-repair, rollback if failed |
| Concurrent save operations | Queue operations, prevent data loss |
| Multi-user edit conflict | Lock element, display conflict message |
| Sync error in collaboration | Attempt re-sync, display error if failed |
| Export/import data loss | Validate data integrity, display error if detected |
| Stress test failure (500+ elements) | Display performance warning, suggest project split |

## 6. Acceptance Criteria

1. User opens Blueprint Editor and sees professional workstation interface with dark gray workspace and light gray panels
2. User selects wall tool from toolbar and draws wall on 2D canvas with snap-to-grid visual feedback
3. User places door on wall with real-time preview and accurate snap alignment
4. User toggles 3D view and sees real-time rendering of walls and door with correct geometry
5. User applies material to wall and sees material reflected in both 2D and 3D views
6. User adjusts solar timeline slider and sees lighting changes in 3D viewport
7. User saves project and project manifest JSON is created with all data
8. User loads saved project and all elements restore with exact coordinates and properties

## 7. Out of Scope for This Release

- Full BIM capabilities
- Structural engineering calculations
- Plumbing and HVAC systems
- Terrain modeling
- Multi-story buildings
- Photorealistic path tracing
- File size/type restrictions beyond basic validation
- Multi-device adaptation beyond iPad-first
- Social features (like, comment, share, chat) unless explicitly for collaboration
- Performance optimization for projects exceeding 500 elements
- Cloud sync integration
- Advanced animation or rendering effects
- Third-party plugin system
- Custom material creation beyond presets
- Advanced lighting beyond solar simulation
- Structural analysis or simulation
- Cost estimation or budgeting tools
- Print layout optimization
- Advanced export formats beyond specified
- Mobile phone optimization
- Offline mode with full functionality
- Real-time voice/video communication
- Advanced permission management beyond basic collaboration
- Integration with external CAD systems
- Automated design suggestions or AI features