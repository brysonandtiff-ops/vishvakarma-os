import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

export type AuthenticatorAssuranceLevel = 'aal1' | 'aal2' | null;

export type TotpFactor = {
  id: string;
  friendlyName: string;
  status: 'verified' | 'unverified';
};

export type MfaStatus = {
  currentLevel: AuthenticatorAssuranceLevel;
  nextLevel: AuthenticatorAssuranceLevel;
  verifiedTotpFactors: TotpFactor[];
};

export type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

type RawFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type?: string;
  status?: string;
};

type MfaClient = {
  getAuthenticatorAssuranceLevel: () => Promise<{
    data: {
      currentLevel: AuthenticatorAssuranceLevel;
      nextLevel: AuthenticatorAssuranceLevel;
    } | null;
    error: Error | null;
  }>;
  listFactors: () => Promise<{
    data: { all?: RawFactor[]; totp?: RawFactor[] } | null;
    error: Error | null;
  }>;
  enroll: (params: {
    factorType: 'totp';
    friendlyName?: string;
  }) => Promise<{
    data: {
      id: string;
      totp: { qr_code: string; secret: string; uri: string };
    } | null;
    error: Error | null;
  }>;
  challengeAndVerify: (params: {
    factorId: string;
    code: string;
  }) => Promise<{ data: unknown; error: Error | null }>;
  unenroll: (params: {
    factorId: string;
  }) => Promise<{ data: unknown; error: Error | null }>;
};

function getMfaClient(): MfaClient {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase Auth is not configured.');
  return client.auth.mfa as unknown as MfaClient;
}

function normalizeCode(code: string) {
  const normalized = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error('Enter the 6-digit code from your authenticator app.');
  }
  return normalized;
}

function normalizeFactor(factor: RawFactor): TotpFactor {
  return {
    id: factor.id,
    friendlyName: factor.friendly_name?.trim() || 'Authenticator app',
    status: factor.status === 'verified' ? 'verified' : 'unverified',
  };
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const mfa = getMfaClient();
  const [assurance, factors] = await Promise.all([
    mfa.getAuthenticatorAssuranceLevel(),
    mfa.listFactors(),
  ]);

  if (assurance.error) throw assurance.error;
  if (factors.error) throw factors.error;

  const rawFactors = factors.data?.totp ?? factors.data?.all ?? [];
  const verifiedTotpFactors = rawFactors
    .filter(
      (factor) =>
        (factor.factor_type === undefined || factor.factor_type === 'totp') &&
        factor.status === 'verified',
    )
    .map(normalizeFactor);

  return {
    currentLevel: assurance.data?.currentLevel ?? null,
    nextLevel: assurance.data?.nextLevel ?? null,
    verifiedTotpFactors,
  };
}

export async function enrollTotpFactor(
  friendlyName = 'Vishvakarma.OS authenticator',
): Promise<TotpEnrollment> {
  const { data, error } = await getMfaClient().enroll({
    factorType: 'totp',
    friendlyName: friendlyName.trim().slice(0, 120),
  });

  if (error) throw error;
  if (!data?.id || !data.totp?.qr_code || !data.totp.secret) {
    throw new Error('Supabase did not return a valid TOTP enrollment.');
  }

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

export async function verifyTotpFactor(factorId: string, code: string) {
  const { error } = await getMfaClient().challengeAndVerify({
    factorId,
    code: normalizeCode(code),
  });
  if (error) throw error;
}

export async function unenrollTotpFactor(factorId: string) {
  const { error } = await getMfaClient().unenroll({ factorId });
  if (error) throw error;
}
