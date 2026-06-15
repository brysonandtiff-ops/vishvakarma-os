/** @deprecated Use src/styles/vish-tokens.css — not consumed by Tailwind or production UI. */
// Architect's Table Theme Tokens
// Warm, tactile drafting table aesthetic for Blueprint Editor workspace

export const architectTheme = {
  // Parchment and paper tones
  colors: {
    parchment: {
      light: '#F9F6F0',      // Cream paper
      DEFAULT: '#F5F1E8',    // Aged parchment
      dark: '#E8E3D6',       // Darker parchment
    },
    ink: {
      light: '#4A4A4A',      // Light ink
      DEFAULT: '#2C2C2C',    // Drawing ink
      dark: '#1A1A1A',       // Dark ink
    },
    brass: {
      light: '#D4AF37',      // Polished brass
      DEFAULT: '#B8941F',    // Aged brass
      dark: '#9A7A1A',       // Tarnished brass
    },
    wood: {
      light: '#8B6F47',      // Light wood
      DEFAULT: '#6B5638',    // Drafting table wood
      dark: '#4A3D28',       // Dark wood
    },
    grid: {
      minor: '#D4CFC4',      // Subtle grid lines
      major: '#B8941F',      // Brass major grid (20% opacity)
    },
    accent: {
      blue: '#4A7BA7',       // Blueprint blue (muted)
      red: '#C85A54',        // Red pencil
      green: '#6B8E6B',      // Green pencil
    },
  },

  // Typography - technical precision
  fonts: {
    technical: '"SF Mono", "Monaco", "Courier New", monospace',
    display: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
  },

  // Spacing - generous for touch
  spacing: {
    touchTarget: '44px',
    toolButton: '48px',
    panelPadding: '24px',
    controlSpacing: '16px',
  },

  /** iPad Pro 12.9" landscape logical width — used by ipad-workspace.css */
  breakpoints: {
    tabletMax: '1194px',
  },

  // Shadows - subtle, tactile
  shadows: {
    tool: '0 2px 8px rgba(0, 0, 0, 0.12)',
    panel: '0 4px 16px rgba(0, 0, 0, 0.08)',
    canvas: 'inset 0 0 20px rgba(0, 0, 0, 0.05)',
  },

  // Borders - warm, defined
  borders: {
    subtle: '1px solid #E8E3D6',
    medium: '2px solid #D4CFC4',
    strong: '2px solid #B8941F',
  },
};

// CSS custom properties for Architect's Table theme
export const architectThemeCSS = `
  /* Architect's Table Theme */
  .architect-theme {
    /* Parchment colors */
    --parchment-light: #F9F6F0;
    --parchment: #F5F1E8;
    --parchment-dark: #E8E3D6;
    
    /* Ink colors */
    --ink-light: #4A4A4A;
    --ink: #2C2C2C;
    --ink-dark: #1A1A1A;
    
    /* Brass accents */
    --brass-light: #D4AF37;
    --brass: #B8941F;
    --brass-dark: #9A7A1A;
    
    /* Wood tones */
    --wood-light: #8B6F47;
    --wood: #6B5638;
    --wood-dark: #4A3D28;
    
    /* Grid */
    --grid-minor: #D4CFC4;
    --grid-major: rgba(184, 148, 31, 0.2);
    
    /* Accents */
    --accent-blue: #4A7BA7;
    --accent-red: #C85A54;
    --accent-green: #6B8E6B;
    
    /* Shadows */
    --shadow-tool: 0 2px 8px rgba(0, 0, 0, 0.12);
    --shadow-panel: 0 4px 16px rgba(0, 0, 0, 0.08);
    --shadow-canvas: inset 0 0 20px rgba(0, 0, 0, 0.05);
    
    /* Spacing */
    --touch-target: 44px;
    --tool-button: 48px;
    --panel-padding: 24px;
    --control-spacing: 16px;
  }
  
  /* Canvas styling */
  .architect-canvas {
    background-color: var(--parchment);
    box-shadow: var(--shadow-canvas);
    border: 2px solid var(--parchment-dark);
  }
  
  /* Tool dock styling */
  .architect-tool-dock {
    background: linear-gradient(to right, var(--wood-dark), var(--wood));
    border-right: 2px solid var(--wood-dark);
    box-shadow: var(--shadow-panel);
  }
  
  /* Tool button styling */
  .architect-tool-button {
    min-width: var(--tool-button);
    min-height: var(--tool-button);
    color: var(--parchment);
    background-color: transparent;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .architect-tool-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--brass);
  }
  
  .architect-tool-button.active {
    background-color: var(--brass);
    border-color: var(--brass-light);
    color: var(--ink-dark);
  }
  
  /* Properties panel styling */
  .architect-properties {
    background-color: var(--parchment-light);
    border-left: 2px solid var(--parchment-dark);
    padding: var(--panel-padding);
  }
  
  /* Control styling */
  .architect-control {
    min-height: var(--touch-target);
    font-family: 'SF Pro Display', -apple-system, sans-serif;
    color: var(--ink);
  }
  
  /* Slider styling */
  .architect-slider {
    accent-color: var(--brass);
  }
  
  /* Grid overlay */
  .architect-grid-minor {
    stroke: var(--grid-minor);
    stroke-width: 1;
  }
  
  .architect-grid-major {
    stroke: var(--brass);
    stroke-width: 2;
    opacity: 0.2;
  }
  
  /* Wall rendering */
  .architect-wall {
    stroke: var(--ink);
    stroke-width: 10;
    stroke-linecap: square;
  }
  
  .architect-wall.selected {
    stroke: var(--brass);
  }
  
  /* Opening markers */
  .architect-opening-door {
    fill: var(--accent-red);
  }
  
  .architect-opening-window {
    fill: var(--accent-blue);
  }
  
  /* Measurement text */
  .architect-measurement {
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 12px;
    fill: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  
  /* High contrast mode */
  .high-contrast .architect-canvas {
    background-color: #FFFFFF;
  }
  
  .high-contrast .architect-wall {
    stroke: #000000;
    stroke-width: 12;
  }
  
  .high-contrast .architect-measurement {
    font-size: 14px;
    font-weight: 600;
  }
`;

// High contrast toggle state
export interface ThemeState {
  highContrast: boolean;
}

export const defaultThemeState: ThemeState = {
  highContrast: false,
};
