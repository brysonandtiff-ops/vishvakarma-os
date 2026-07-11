export function areQaToolsEnabled(
  env: Pick<ImportMetaEnv, 'DEV' | 'MODE' | 'VITE_ENABLE_QA_TOOLS'> = import.meta.env,
): boolean {
  return env.DEV || env.MODE.startsWith('e2e') || env.VITE_ENABLE_QA_TOOLS === 'true';
}

export const QA_TOOLS_ENABLED = areQaToolsEnabled();
