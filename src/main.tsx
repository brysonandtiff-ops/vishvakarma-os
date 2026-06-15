import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/vish-tokens.css";
import "./vish-theme.css";
import "./styles/vish-sacred-tokens.css";
import "./styles/vish-sacred-layers.css";
import "./styles/vish-marketing.css";
import "./styles/vish-workspace-shell.css";
import "./styles/vish-editor-chrome.css";
import "./styles/vish-editor-mantra.css";
import "./styles/vish-governance-polish.css";
import "./ipad-workspace.css";
import "./styles/vish-mockup-system.css";
import "./styles/vish-auth-gate.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import {
  bootstrapClientGovernanceState,
  configureEnforcement,
  enforce,
  enableDevelopmentMode,
} from "./governance/core/enforcer";

// ============================================================================
// GOVERNANCE ENFORCEMENT — APP STARTUP
// ============================================================================

// E2E builds use production RouteGuard/auth but relaxed enforcer (no startup throw).
const isE2eBuild = import.meta.env.MODE === 'e2e';

if (isE2eBuild || import.meta.env.DEV) {
  enableDevelopmentMode();
} else if (import.meta.env.PROD) {
  // Production SPA: advisory-only at runtime — verify-all.js / CI enforce hard gates.
  configureEnforcement({
    mode: 'production',
    enableAutoRepair: false,
    blockOnFailure: false,
  });
} else {
  enableDevelopmentMode();
}

bootstrapClientGovernanceState();

const logStartupEnforcement = (startupEnforcement: ReturnType<typeof enforce>) => {
  if (!startupEnforcement.success) {
    console.warn('[STARTUP] Governance enforcement detected issues:', startupEnforcement.errors);
    console.warn('[STARTUP] Auto-repairs applied:', startupEnforcement.repairs);
  }
  console.log(
    `[STARTUP] Governance enforcement completed in ${startupEnforcement.metrics.totalTime.toFixed(2)}ms`,
  );
};

const runStartupEnforcement = () => {
  logStartupEnforcement(enforce());
};

if (import.meta.env.PROD && typeof window !== 'undefined' && 'requestIdleCallback' in window) {
  window.requestIdleCallback(runStartupEnforcement, { timeout: 4000 });
} else {
  runStartupEnforcement();
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>
);
