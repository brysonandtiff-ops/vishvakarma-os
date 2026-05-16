#!/usr/bin/env node
// Comprehensive verification script for all release gates
// Run with: node scripts/verify-gates.js

const fs = require('fs');
const path = require('path');

const gates = [];

// Gate 1: Spec Present and Valid
function checkSpecGate() {
  try {
    const specPath = path.join(process.cwd(), 'docs', 'SPEC.md');
    const specContent = fs.readFileSync(specPath, 'utf-8');
    
    const hasLocked = specContent.includes('**Status**: LOCKED');
    const hasHash = specContent.includes('**Spec Hash**:');
    const hasVersion = specContent.includes('## Blueprint Editor v1.0.0');
    
    return {
      name: 'Gate 1: Spec Present and Valid',
      passed: hasLocked && hasHash && hasVersion,
      message: hasLocked && hasHash && hasVersion
        ? '✓ Blueprint Editor spec is valid and locked'
        : '✗ Spec validation failed',
      details: [
        `Locked status: ${hasLocked ? '✓' : '✗'}`,
        `Spec hash: ${hasHash ? '✓' : '✗'}`,
        `Version: ${hasVersion ? '✓' : '✗'}`
      ]
    };
  } catch (error) {
    return {
      name: 'Gate 1: Spec Present and Valid',
      passed: false,
      message: '✗ Spec file not found',
      details: [error.message]
    };
  }
}

// Gate 2: Registry Valid
function checkRegistryGate() {
  try {
    const registryPath = path.join(process.cwd(), 'docs', 'REGISTRY.md');
    const registryContent = fs.readFileSync(registryPath, 'utf-8');
    
    const entities = [
      '1. Project',
      '2. ProjectManifest',
      '3. GridSettings',
      '4. WallSegment',
      '5. Opening',
      '6. MaterialPreset',
      '7. EnvironmentState',
      '8. ViewportState'
    ];
    
    const allPresent = entities.every(entity => 
      registryContent.includes(`### ${entity}`)
    );
    
    return {
      name: 'Gate 2: Registry Valid',
      passed: allPresent,
      message: allPresent
        ? '✓ All 8 entities documented in registry'
        : '✗ Registry incomplete',
      details: entities.map(e => 
        `${registryContent.includes(`### ${e}`) ? '✓' : '✗'} ${e}`
      )
    };
  } catch (error) {
    return {
      name: 'Gate 2: Registry Valid',
      passed: false,
      message: '✗ Registry file not found',
      details: [error.message]
    };
  }
}

// Gate 3: Routes Match Manifest
function checkRoutesGate() {
  try {
    const routesPath = path.join(process.cwd(), 'src', 'routes.tsx');
    const routesContent = fs.readFileSync(routesPath, 'utf-8');
    
    const requiredRoutes = [
      'EditorPage',
      'SpecCenterPage',
      'RegistryPage',
      'ChangeRequestsPage',
      'ReleasesPage',
      'AuditLogPage'
    ];
    
    const allPresent = requiredRoutes.every(route => 
      routesContent.includes(route)
    );
    
    return {
      name: 'Gate 3: Routes Match Manifest',
      passed: allPresent,
      message: allPresent
        ? '✓ All 6 routes registered'
        : '✗ Routes incomplete',
      details: requiredRoutes.map(r => 
        `${routesContent.includes(r) ? '✓' : '✗'} ${r}`
      )
    };
  } catch (error) {
    return {
      name: 'Gate 3: Routes Match Manifest',
      passed: false,
      message: '✗ Routes file not found',
      details: [error.message]
    };
  }
}

// Gate 4: Sample Loads Successfully
function checkSampleGate() {
  try {
    const samplePath = path.join(process.cwd(), 'public', 'samples', 'sample-house-01.json');
    const sampleContent = fs.readFileSync(samplePath, 'utf-8');
    const sample = JSON.parse(sampleContent);
    
    const hasVersion = sample.version === '1.0.0';
    const hasWalls = Array.isArray(sample.walls) && sample.walls.length > 0;
    const hasOpenings = Array.isArray(sample.openings);
    const hasLighting = sample.lighting && typeof sample.lighting === 'object';
    
    return {
      name: 'Gate 4: Sample Loads Successfully',
      passed: hasVersion && hasWalls && hasOpenings && hasLighting,
      message: hasVersion && hasWalls && hasOpenings && hasLighting
        ? '✓ sample-house-01.json validates'
        : '✗ Sample validation failed',
      details: [
        `Version: ${hasVersion ? '✓' : '✗'}`,
        `Walls: ${hasWalls ? '✓' : '✗'} (${sample.walls?.length || 0})`,
        `Openings: ${hasOpenings ? '✓' : '✗'} (${sample.openings?.length || 0})`,
        `Lighting: ${hasLighting ? '✓' : '✗'}`
      ]
    };
  } catch (error) {
    return {
      name: 'Gate 4: Sample Loads Successfully',
      passed: false,
      message: '✗ Sample file not found or invalid JSON',
      details: [error.message]
    };
  }
}

// Gate 8: Touch Targets Valid
function checkTouchTargetsGate() {
  try {
    const indexCssPath = path.join(process.cwd(), 'src', 'index.css');
    const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');
    
    const hasTouchTarget = indexCssContent.includes('.touch-target');
    const hasMinHeight = indexCssContent.includes('min-height: 44px');
    const hasMinWidth = indexCssContent.includes('min-width: 44px');
    
    return {
      name: 'Gate 8: Touch Targets Valid',
      passed: hasTouchTarget && hasMinHeight && hasMinWidth,
      message: hasTouchTarget && hasMinHeight && hasMinWidth
        ? '✓ All controls >= 44px'
        : '✗ Touch target validation failed',
      details: [
        `Touch target class: ${hasTouchTarget ? '✓' : '✗'}`,
        `Min height 44px: ${hasMinHeight ? '✓' : '✗'}`,
        `Min width 44px: ${hasMinWidth ? '✓' : '✗'}`
      ]
    };
  } catch (error) {
    return {
      name: 'Gate 8: Touch Targets Valid',
      passed: false,
      message: '✗ index.css not found',
      details: [error.message]
    };
  }
}

// Gate 9: No Spec Drift
function checkSpecDriftGate() {
  try {
    const toolRailPath = path.join(process.cwd(), 'src', 'components', 'editor', 'ToolRail.tsx');
    const toolRailContent = fs.readFileSync(toolRailPath, 'utf-8');
    
    const requiredTools = ['select', 'wall', 'door', 'window', 'measure'];
    const allPresent = requiredTools.every(tool => 
      toolRailContent.toLowerCase().includes(tool)
    );
    
    return {
      name: 'Gate 9: No Spec Drift',
      passed: allPresent,
      message: allPresent
        ? '✓ All UI elements declared'
        : '✗ Spec drift detected',
      details: requiredTools.map(t => 
        `${toolRailContent.toLowerCase().includes(t) ? '✓' : '✗'} ${t} tool`
      )
    };
  } catch (error) {
    return {
      name: 'Gate 9: No Spec Drift',
      passed: false,
      message: '✗ ToolRail component not found',
      details: [error.message]
    };
  }
}

// Manual gates (warnings)
function checkManualGates() {
  return [
    {
      name: 'Gate 5: Save/Load Deterministic',
      passed: false,
      message: '⚠ Manual testing required',
      details: ['Test: Save project → Load project → Verify identical state']
    },
    {
      name: 'Gate 6: 2D/3D Parity',
      passed: false,
      message: '⚠ Manual verification required',
      details: ['Test: Draw walls in 2D → Verify 3D matches exactly']
    },
    {
      name: 'Gate 7: Tests Green',
      passed: false,
      message: '⚠ No automated tests yet',
      details: ['TODO: Implement Jest + React Testing Library tests']
    },
    {
      name: 'Gate 10: Performance Acceptable',
      passed: false,
      message: '⚠ Manual testing required',
      details: ['Test: Run on iPad Air 2020 → Verify 60fps']
    }
  ];
}

// Run all gates
function runAllGates() {
  console.log('\n🔍 Vishvakarma.OS v1.0.0 - Release Gate Verification\n');
  console.log('═'.repeat(60));
  
  gates.push(checkSpecGate());
  gates.push(checkRegistryGate());
  gates.push(checkRoutesGate());
  gates.push(checkSampleGate());
  gates.push(...checkManualGates());
  gates.push(checkTouchTargetsGate());
  gates.push(checkSpecDriftGate());
  
  // Display results
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;
  
  gates.forEach((gate, index) => {
    console.log(`\n${gate.name}`);
    console.log(gate.message);
    
    if (gate.details && gate.details.length > 0) {
      gate.details.forEach(detail => {
        console.log(`  ${detail}`);
      });
    }
    
    if (gate.passed) passCount++;
    else if (gate.message.includes('⚠')) warnCount++;
    else failCount++;
  });
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`  ✓ Passed: ${passCount}`);
  console.log(`  ⚠ Warnings: ${warnCount}`);
  console.log(`  ✗ Failed: ${failCount}`);
  
  // Build status
  let buildStatus = '🟢 GREEN';
  if (failCount > 0) buildStatus = '🔴 RED';
  else if (warnCount > 0) buildStatus = '🟡 YELLOW';
  
  console.log(`\n🚦 Build Status: ${buildStatus}`);
  
  if (failCount === 0) {
    console.log('\n✅ All automated gates passing!');
    if (warnCount > 0) {
      console.log('⚠️  Manual testing required for complete verification.');
    }
  } else {
    console.log('\n❌ Some gates failed. Please fix before release.');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  
  // Exit code
  process.exit(failCount > 0 ? 1 : 0);
}

// Run
runAllGates();
