import type { PlanTier } from '@/config/billingPlans';

export type CastInviteRole = 'viewer' | 'family' | 'council_reviewer';

export function canStartCast(tier: PlanTier): boolean {
  return tier === 'studio' || tier === 'enterprise';
}

export function canUseCastLenses(tier: PlanTier): boolean {
  return tier === 'studio' || tier === 'enterprise';
}

export function canUseCastChrono(tier: PlanTier): boolean {
  return tier === 'studio' || tier === 'enterprise';
}

export function castMaxViewers(tier: PlanTier): number {
  return tier === 'enterprise' ? 999 : 3;
}

export function canUseRoleScopedInvites(tier: PlanTier): boolean {
  return tier === 'enterprise';
}

export function canExportCastEvidence(tier: PlanTier): boolean {
  return tier === 'enterprise';
}

export function canUseViewerPins(tier: PlanTier): boolean {
  return tier === 'enterprise';
}

export const CAST_ROLE_LABELS: Record<CastInviteRole, string> = {
  viewer: 'Viewer',
  family: 'Family',
  council_reviewer: 'Council reviewer',
};
