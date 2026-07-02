import { DeviceValidationPanel } from "./components/qa/DeviceValidationPanel";
import "./styles/vish-device-validation.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-devanagari/500.css';
import '@fontsource/noto-sans-devanagari/600.css';
import '@fontsource/noto-sans-devanagari/700.css';
import "./index.css";
import "./styles/vish-tokens.css";
import "./styles/vish-layout-tokens.css";
import "./vish-theme.css";
import "./styles/vish-sacred-tokens.css";
import "./styles/vish-realism.css";
import "./styles/vish-motion-system.css";
import "./styles/vish-copilot-swan.css";
import "./styles/vish-sacred-layers.css";
import "./styles/vish-editor-chrome.css";
import "./styles/vish-editor-polish.css";
import "./styles/vish-editor-mantra.css";
import "./styles/vish-sacred-editor.css";
import "./styles/vish-mockup-system.css";
import "./styles/vish-workspace-shell.css";
import "./styles/vish-workspace-polish.css";
import "./styles/vish-governance-polish.css";
import "./styles/vish-sacred-governance.css";
import "./ipad-workspace.css";
import "./styles/vish-ipad-editor-usability.css";
import "./styles/vish-marketing.css";
import "./styles/vish-marketing-polish.css";
import "./styles/vish-sacred-marketing.css";
import "./styles/vish-auth-gate.css";
import "./styles/vish-login-page.css";
import "./styles/vish-sacred-auth.css";
import "./styles/vish-indian-sacred.css";
import "./styles/vish-ui-polish.css";
import "./styles/vish-mantra-widget.css";
import "./styles/vish-theme-solar-mandala.css";
import "./styles/vish-vibhuti-obsidian.css";
import "./styles/vish-theme-bhumi.css";
import "./styles/vish-divine-architect-theme.css";
import "./styles/vish-auth-reference-screen.css";
import "./styles/vish-auth-ipad-polish.css";
import "./styles/vish-auth-reference-match.css";
import "./styles/vish-auth-reference-breakpoint-fix.css";
import "./styles/vish-auth-exact-reference.css";
import "./styles/vish-auth-layout-tidy.css";
import "./styles/vish-ipad-king-polish.css";
import "./styles/vish-release-focus-ring.css";
import "./styles/vish-release-dialog-guard.css";
import "./styles/vish-no-drift-tooling-polish.css";
import "./styles/vish-voice-tour.css";
import "./styles/vish-qa-evidence.css";
import "./styles/vish-empty-guided-start.css";
import "./styles/vish-touch-audit-hud.css";
import "./styles/vish-ui-display-fixes.css";
import "./styles/vish-device-unity.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { installPwaAutoUpdate } from "./pwaAutoUpdate";
import {
  bootstrapClientGovernanceState,
  configureEnforcement,
  enforce,
  enableDevelopmentMode,
} from "./governance/core/enforcer";

const isE2eBuild = import.meta.env.MODE === 'e2e';

if (isE2eBuild || import.meta.env.DEV) {
  enableDevelopmentMode();
} else if (import.meta.env.PROD) {
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
};

logStartupEnforcement(enforce('startup'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper>
      <App />
      <DeviceValidationPanel />
    </AppWrapper>
  </StrictMode>,
);
