type QaToolsEnvironment = Pick<ImportMetaEnv, 'DEV' | 'MODE'> & {
  VITE_ENABLE_QA_TOOLS?: string;
};

export function areQaToolsEnabled(
  env: QaToolsEnvironment = import.meta.env,
): boolean {
  return env.DEV || env.MODE.startsWith('e2e') || env.VITE_ENABLE_QA_TOOLS === 'true';
}

export const QA_TOOLS_ENABLED = areQaToolsEnabled();
