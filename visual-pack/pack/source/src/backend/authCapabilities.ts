export type AuthWinner = 'email' | 'google' | 'none';

export type AuthCapabilitiesManifest = {
  testedAt: string;
  commitSha?: string;
  deploymentUrl: string;
  emailLink: {
    config: boolean;
    liveSend: boolean;
    liveSendNote?: string;
  };
  google: {
    config: boolean;
    liveSignIn: boolean;
    liveSignInNote?: string;
  };
  winner: AuthWinner;
  winnerRationale?: string;
};

const MANIFEST_URL = '/auth-capabilities.json';

function parseWinner(value: unknown): AuthWinner | null {
  if (value === 'email' || value === 'google' || value === 'none') {
    return value;
  }
  return null;
}

export function getBuildTimeAuthWinner(): AuthWinner | null {
  const envWinner = import.meta.env.VITE_AUTH_WINNER;
  return parseWinner(envWinner);
}

export function resolveAuthWinner(
  manifest: AuthCapabilitiesManifest | null,
  buildTimeWinner: AuthWinner | null = getBuildTimeAuthWinner()
): AuthWinner {
  if (buildTimeWinner) {
    return buildTimeWinner;
  }

  if (manifest?.winner) {
    return manifest.winner;
  }

  return 'none';
}

export async function fetchAuthCapabilitiesManifest(): Promise<AuthCapabilitiesManifest | null> {
  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as AuthCapabilitiesManifest;
    if (!parseWinner(body.winner)) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}
