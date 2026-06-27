/**
 * Operator / QA overlay chrome (theme picker, evidence panel, touch audit, voice tour).
 * Hidden in production builds unless explicitly enabled via VITE_OPERATOR_CHROME_ENABLED=true.
 */
export const OPERATOR_CHROME_ENABLED =
  import.meta.env.VITE_OPERATOR_CHROME_ENABLED === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_OPERATOR_CHROME_ENABLED !== 'false');
