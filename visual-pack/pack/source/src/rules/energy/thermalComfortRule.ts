import { analyzeThermal } from '@/core/simulations/thermalEngine';
import { NCC_AU_THRESHOLDS } from '@/modules/compliance/constants';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const thermalComfortRule: ComplianceRule = {
  id: 'energy-thermal-comfort',
  description: 'Thermal comfort score (energy performance stub)',
  category: 'energy',
  validate(project: Project): ComplianceResult {
    const thermal = analyzeThermal(project.manifest);
    const findings: ComplianceFinding[] = [];

    if (thermal.overallComfort < NCC_AU_THRESHOLDS.thermalComfortFail) {
      findings.push({
        ruleId: 'energy-thermal-comfort',
        category: 'energy',
        status: 'fail',
        message: `Overall thermal comfort ${thermal.overallComfort}% is below ${NCC_AU_THRESHOLDS.thermalComfortFail}%.`,
      });
    } else if (thermal.overallComfort < NCC_AU_THRESHOLDS.thermalComfortWarning) {
      findings.push({
        ruleId: 'energy-thermal-comfort',
        category: 'energy',
        status: 'warning',
        message: `Thermal comfort ${thermal.overallComfort}% is below target ${NCC_AU_THRESHOLDS.thermalComfortWarning}%.`,
      });
    }

    return {
      ruleId: 'energy-thermal-comfort',
      category: 'energy',
      status: statusFromFindings(findings),
      description: 'Thermal comfort score (energy performance stub)',
      findings,
    };
  },
};
