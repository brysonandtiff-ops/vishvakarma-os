# Route Manifest Schema

## Overview

The Route Manifest is the single source of truth for all navigation in Vishvakarma.OS. It is stored in the database and controls which pages are accessible in the application.

**Critical Rule**: No ad-hoc page creation is allowed. All routes must be registered in the Route Manifest.

## Database Schema

```sql
CREATE TABLE route_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  component TEXT NOT NULL,
  category TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Field Descriptions

- `id` (UUID, required): Unique identifier
- `path` (string, required, unique): URL path (e.g., '/', '/spec-center')
- `name` (string, required): Display name for navigation
- `component` (string, required): Component name (e.g., 'EditorPage')
- `category` (enum, required): Route category
  - `editor`: Blueprint editor routes
  - `governance`: Governance framework routes
  - `system`: System management routes
- `visible` (boolean, required): Show in navigation menu
- `order_index` (integer, required): Display order in navigation
- `created_at` (timestamp, required): Creation timestamp

## Current Routes (v1.0.0)

| Path | Name | Component | Category | Order |
|------|------|-----------|----------|-------|
| / | Blueprint Editor | EditorPage | editor | 1 |
| /spec-center | Spec Center | SpecCenterPage | governance | 2 |
| /registry | Registry Center | RegistryPage | governance | 3 |
| /change-requests | Change Requests | ChangeRequestsPage | governance | 4 |
| /releases | Release Center | ReleasesPage | governance | 5 |
| /audit | Audit Log | AuditLogPage | system | 6 |

## Adding New Routes

### Process

1. **Create Specification** in Spec Center
2. **Create Change Request** for new route
3. **Get Approval** for change request
4. **Insert Route** into route_manifest table
5. **Implement Component** matching the component name
6. **Update routes.tsx** to import and map the component
7. **Create Audit Log** entry
8. **Include in Release** with evidence pack

### SQL Example

```sql
INSERT INTO route_manifest (path, name, component, category, visible, order_index)
VALUES ('/new-feature', 'New Feature', 'NewFeaturePage', 'editor', true, 7);
```

### Code Example

```typescript
// In routes.tsx
import NewFeaturePage from './pages/NewFeaturePage';

const routes: RouteConfig[] = [
  // ... existing routes
  {
    name: 'New Feature',
    path: '/new-feature',
    element: <NewFeaturePage />,
    visible: true,
  },
];
```

## Route Categories

### Editor
Routes related to blueprint editing and design work.

**Characteristics**:
- Primary workspace
- Canvas-based interfaces
- Real-time visualization
- Tool-focused

### Governance
Routes for governance framework and process management.

**Characteristics**:
- Specification management
- Change control
- Release management
- Audit trails

### System
Routes for system administration and monitoring.

**Characteristics**:
- Logs and monitoring
- Configuration
- System health
- Diagnostics

## Visibility Rules

Routes with `visible: false` are:
- Not shown in navigation menu
- Still accessible via direct URL
- Used for system/admin routes
- Hidden from regular users

## Order Index

- Lower numbers appear first
- Gaps allowed for future insertions
- Typically increment by 1
- Can be reordered without breaking functionality

## Validation Rules

1. Path must start with '/'
2. Path must be unique
3. Component name must match actual component file
4. Category must be valid enum value
5. Order index must be >= 0

## Integration with Navigation

The AppLayout component reads from route_manifest to build navigation:

```typescript
// Pseudo-code
const navigation = await getRouteManifest();
// Returns routes ordered by order_index where visible = true
```

## Stop-Ship Violations

The following will cause stop-ship enforcement:

1. **Ad-hoc Route Creation**: Creating routes without route_manifest entry
2. **Missing Specs**: Routes without corresponding specifications
3. **Unapproved Changes**: Route changes without approved change requests
4. **Missing Audit**: Route additions without audit log entries

## Migration Strategy

When adding routes in new versions:

1. Create migration SQL file
2. Insert new route_manifest entries
3. Update documentation
4. Create audit log entries
5. Include in release notes

## Example Migration

```sql
-- Migration: add_settings_route
-- Version: 1.1.0

INSERT INTO route_manifest (path, name, component, category, visible, order_index)
VALUES ('/settings', 'Settings', 'SettingsPage', 'system', true, 7);

-- Audit log
INSERT INTO audit_logs (action, entity_type, entity_id, details)
SELECT 
  'route_added',
  'route_manifest',
  id,
  jsonb_build_object('path', '/settings', 'name', 'Settings')
FROM route_manifest
WHERE path = '/settings';
```

## Best Practices

1. **Plan Routes Early**: Define routes in specification phase
2. **Consistent Naming**: Use clear, descriptive names
3. **Logical Grouping**: Use categories effectively
4. **Order Thoughtfully**: Group related routes together
5. **Document Changes**: Update this schema doc with each route addition
6. **Test Navigation**: Verify all routes are accessible
7. **Audit Everything**: Log all route changes

## Future Enhancements

Potential additions for future versions:

- Route permissions/roles
- Route parameters/dynamic routes
- Route metadata (icons, descriptions)
- Route groups/submenus
- Route aliases/redirects
- Route deprecation status
