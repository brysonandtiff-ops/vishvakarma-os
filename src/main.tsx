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
import "./styles/vish-indian-sacred.css";
import "./styles/vish-ui-polish.css";
import "./styles/vish-mantra-widget.css";
import "./styles/vish-voice-tour.css";
import "./styles/vish-empty-guided-start.css";
import "./styles/vish-ui-display-fixes.css";
import "./styles/vish-device-unity.css";
import "./styles/vish-ios-performance-hardening.css";
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

function dismissBootSplash() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const splash = document.getElementById('boot-splash');
  if (!splash) return;

  const hide = () => {
    splash.classList.add('boot-splash--hidden');
    splash.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => splash.remove(), 520);
  };

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(hide);
  });
}

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

function scheduleStartupEnforcement() {
  const run = () => logStartupEnforcement(enforce());

  if (typeof window === 'undefined') {
    run();
    return;
  }

  // Startup enforcement validates client governance state only. Project/building
  // compliance requires a ProjectManifest and runs from editor/export flows.
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2_000 });
    return;
  }

  globalThis.setTimeout(run, 0);
}

scheduleStartupEnforcement();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </StrictMode>,
);

dismissBootSplash();
