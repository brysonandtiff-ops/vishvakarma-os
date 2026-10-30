/**
 * External browser analytics is intentionally disabled.
 *
 * Keep this component as a stable mount point so existing layout imports do not
 * churn while the product remains Cloudflare-only. Consent is still stored by
 * the banner, but granting it does not load a third-party telemetry runtime.
 */
export default function ConsentAnalytics() {
  return null;
}
