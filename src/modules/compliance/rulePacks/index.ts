import { getComplianceRulesForJurisdiction } from '@/rules/registry';
import type { ProjectJurisdiction } from '@/domain/projects/jurisdiction';
import { AU_NCC_VOL2_H1_DISCLAIMER, AU_NCC_VOL2_H1_RULE_PACK } from '@/modules/compliance/rulePacks/auNccVol2H1';
import type { ComplianceCitation, ComplianceRulePack } from '@/modules/compliance/rulePacks/types';

const RULE_PACKS: ComplianceRulePack[] = [AU_NCC_VOL2_H1_RULE_PACK];

const citationByRuleId = new Map<string, ComplianceCitation>(
  RULE_PACKS.flatMap((pack) => pack.entries.map((entry) => [entry.ruleId, entry.citation])),
);

export function getRulePacksForJurisdiction(jurisdiction: ProjectJurisdiction): ComplianceRulePack[] {
  return RULE_PACKS.filter((pack) => pack.jurisdiction === jurisdiction);
}

export function getCitationForRule(ruleId: string): ComplianceCitation | undefined {
  return citationByRuleId.get(ruleId);
}

export function getRulePackDisclaimer(jurisdiction: ProjectJurisdiction): string {
  const pack = getRulePacksForJurisdiction(jurisdiction)[0];
  return pack?.disclaimer ?? AU_NCC_VOL2_H1_RULE_PACK.disclaimer;
}

/** Ensures every active jurisdiction rule has a pack entry (Gate 14 target). */
export function validateRulePackIntegrity(jurisdiction: ProjectJurisdiction): string[] {
  const activeRuleIds = new Set(getComplianceRulesForJurisdiction(jurisdiction).map((r) => r.id));
  const pack = getRulePacksForJurisdiction(jurisdiction)[0];
  if (!pack) {
    return [`No rule pack registered for jurisdiction "${jurisdiction}"`];
  }

  const packRuleIds = new Set(pack.entries.map((e) => e.ruleId));
  const missing: string[] = [];
  for (const ruleId of activeRuleIds) {
    if (!packRuleIds.has(ruleId)) {
      missing.push(`Missing pack entry for rule "${ruleId}"`);
    }
  }
  return missing;
}

export { AU_NCC_VOL2_H1_RULE_PACK, AU_NCC_VOL2_H1_DISCLAIMER };
export type { ComplianceCitation, ComplianceRulePack, RulePackEntry } from '@/modules/compliance/rulePacks/types';
