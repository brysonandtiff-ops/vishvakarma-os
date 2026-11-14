/** Android Termux cannot finish Workbox 7 production Terser workers.
 * Use an unminified service worker only for local phone builds. The Cloudflare
 * Linux pipeline still uses production-mode SW minification and release gates.
 */
export function resolveWorkboxBuildMode(platform: string): 'production' | 'development' {
  return platform === 'android' ? 'development' : 'production';
}
