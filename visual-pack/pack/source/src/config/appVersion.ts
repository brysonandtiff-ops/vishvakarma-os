import packageJson from '../../package.json';

/** Display prefix for product version strings (e.g. v1.5.0). */
export const APP_VERSION = `v${packageJson.version}`;

/** Semantic version from package.json without the v prefix. */
export const APP_VERSION_RAW = packageJson.version;
