/** Co-owners receive admin governance access and enterprise-tier entitlements for testing. */
export const CO_OWNER_EMAILS = ['ajkdentureventure@gmail.com'] as const;

export type CoOwnerEmail = (typeof CO_OWNER_EMAILS)[number];

export function isCoOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return CO_OWNER_EMAILS.some((coOwnerEmail) => coOwnerEmail === normalized);
}
