import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// T3-4: Self-hosted fonts — eliminates render-blocking Google Fonts request.
// These packages serve woff2 files from node_modules, included in the PWA
// precache manifest so they work offline after first load.
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/500.css';
import '@fontsource/noto-sans-devanagari/600.css';
import '@fontsource/noto-sans-devanagari/700.css';
// CSS load order: base → tokens → theme → zone shells → zone polish → overrides
import "./index.css";
import "./styles/vish-tokens.css";
import "./styles/vish-layout-tokens.css";
import "./vish-theme.css";
import "./styles/vish-sacred-tokens.css";
import "./styles/vish-realism.css";
import "./styles/vish-motion-system.css";
import "./styles/vish-copilot-swan.css";
import "./styles/vish-sacred-layers.css";
/* Editor zone */
import "./styles/vish-editor-chrome.css";
import "./styles/vish-editor-polish.css";
import "./styles/vish-editor-mantra.css";
import "./styles/vish-sacred-editor.css";
import "./styles/vish-mockup-system.css";
/* Workspace + governance zone */
import "./styles/vish-workspace-shell.css";
import "./styles/vish-workspace-polish.css";
import "./styles/vish-governance-polish.css";
import "./styles/vish-sacred-governance.css";
import "./ipad-workspace.css";
import "./styles/vish-ipad-editor-usability.css";
/* Marketing + auth zone */
import "./styles/vish-marketing.css";
import "./styles/vish-marketing-polish.css";
import "./styles/vish-sacred-marketing.css";
import "./styles/vish-auth-gate.css";
import "./styles/vish-login-page.css";
import "./styles/vish-sacred-auth.css";
import "./styles/vish-indian-sacred.css";
/* Global polish + theme overrides (last) */
import "./styles/vish-ui-polish.css";
import "./styles/vish-mantra-widget.css";
import "./styles/vish-theme-solar-mandala.css";
import "./styles/vish-divine-architect-theme.css";
import "./styles/vish-auth-reference-screen.css";
import "./styles/vish-auth-ipad-polish.css";
import "./styles/vish-auth-reference-match.css";
import "./styles/vish-auth-reference-breakpoint-fix.css";
import "./styles/vish-auth-exact-reference.css";
import "./styles/vish-ipad-king-polish.css";
import "./styles/vish-release-focus-ring.css";
import "./styles/vish-release-dialog-guard.css";
import "./styles/vish-no-drift-tooling-polish.css";
import "./styles/vish-voice-tour.css";
import "./styles/vish-qa-evidence.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { installPwaAutoUpdate } from "./pwaAutoUpdate";
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
installPwaAutoUpdate();

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

// ============================================================================
// STARTUP SPLASH TEARDOWN
// ============================================================================
// Fade out and remove the inline #boot-splash (index.html) once React has
// painted, handing off seamlessly to the app (or the SessionBootScreen mandala,
// which shares the same dark stage). A hard timeout guarantees the splash can
// never get stuck on a slow boot.
const dismissBootSplash = () => {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  splash.classList.add('boot-splash--hidden');
  const remove = () => splash.remove();
  splash.addEventListener('transitionend', remove, { once: true });
  // Fallback in case transitionend never fires (e.g. reduced-motion / detached).
  window.setTimeout(remove, 600);
};

if (typeof window !== 'undefined') {
  // Double rAF waits for the first real paint of the React tree before fading.
  requestAnimationFrame(() => requestAnimationFrame(dismissBootSplash));
  // Hard safety net so the splash is always dismissed.
  window.setTimeout(dismissBootSplash, 4000);
}
