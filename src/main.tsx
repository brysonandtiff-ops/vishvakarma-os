import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { enforce, enableDevelopmentMode } from "./governance/core/enforcer";

// ============================================================================
// GOVERNANCE ENFORCEMENT — APP STARTUP
// ============================================================================

// Enable development mode (auto-repair enabled)
enableDevelopmentMode();

// Run enforcement check on startup
const startupEnforcement = enforce();

if (!startupEnforcement.success) {
  console.warn('[STARTUP] Governance enforcement detected issues:', startupEnforcement.errors);
  console.warn('[STARTUP] Auto-repairs applied:', startupEnforcement.repairs);
}

console.log(`[STARTUP] Governance enforcement completed in ${startupEnforcement.metrics.totalTime.toFixed(2)}ms`);

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
