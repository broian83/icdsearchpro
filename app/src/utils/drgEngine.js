/**
 * DRG Engine for BPJS Claim Simulation
 * Simplified rules engine based on INA-CBG/iDRG system
 */

/**
 * Find DRG group for a principal diagnosis
 * @param {string} principalDx - ICD-10 code (e.g., "J18.9")
 * @param {Object[]} drgGroups - Array of DRG group objects from drg_groups.json
 * @returns {Object|null} - Matching DRG group or null
 */
export function findDRGGroup(principalDx, drgGroups) {
  if (!principalDx || !drgGroups) return null;
  const normalizedCode = principalDx.trim().toUpperCase();
  return drgGroups.find(group =>
    group.principalDx.some(code => code.toUpperCase() === normalizedCode)
  ) || null;
}

/**
 * Classify a single code as CC, MCC, or neither for a given DRG group
 * @param {string} code - ICD-10 code to classify
 * @param {string} drgCode - DRG group code
 * @param {Object} ccRules - CC/MCC rules from cc_mcc_rules.json
 * @returns {{ type: 'cc'|'mcc'|'none', description: string }}
 */
export function classifyCode(code, drgCode, ccRules) {
  if (!code || !ccRules) return { type: 'none', description: '' };
  const normalizedCode = code.trim().toUpperCase();

  // Check group-specific CC/MCC first (takes priority)
  const groupRules = ccRules.ccByGroup?.[drgCode];
  if (groupRules) {
    if (groupRules.mcc?.some(c => c.toUpperCase() === normalizedCode)) {
      return { type: 'mcc', description: ccRules.ccDescriptions?.[normalizedCode] || '' };
    }
    if (groupRules.cc?.some(c => c.toUpperCase() === normalizedCode)) {
      return { type: 'cc', description: ccRules.ccDescriptions?.[normalizedCode] || '' };
    }
  }

  // Fallback to universal lists
  if (ccRules.universalMCC?.some(c => c.toUpperCase() === normalizedCode)) {
    return { type: 'mcc', description: ccRules.ccDescriptions?.[normalizedCode] || '' };
  }
  if (ccRules.universalCC?.some(c => c.toUpperCase() === normalizedCode)) {
    return { type: 'cc', description: ccRules.ccDescriptions?.[normalizedCode] || '' };
  }

  return { type: 'none', description: '' };
}

/**
 * Determine severity level based on secondary diagnoses
 * @param {string} drgCode - DRG group code
 * @param {string[]} secondaryDx - Array of ICD-10 codes
 * @param {Object} ccRules - CC/MCC rules
 * @returns {{ level: string, ccCount: number, mccCount: number, matchedCC: Object[], matchedMCC: Object[] }}
 */
export function determineSeverity(drgCode, secondaryDx, ccRules) {
  const matchedCC = [];
  const matchedMCC = [];

  (secondaryDx || []).forEach(code => {
    const classification = classifyCode(code, drgCode, ccRules);
    if (classification.type === 'mcc') {
      matchedMCC.push({ code, description: classification.description });
    } else if (classification.type === 'cc') {
      matchedCC.push({ code, description: classification.description });
    }
  });

  let level;
  if (matchedMCC.length >= 2 || (matchedMCC.length >= 1 && matchedCC.length >= 3)) {
    level = 'III';
  } else if (matchedMCC.length >= 1) {
    level = 'II';
  } else if (matchedCC.length >= 1) {
    level = 'I';
  } else {
    level = '0';
  }

  return { level, ccCount: matchedCC.length, mccCount: matchedMCC.length, matchedCC, matchedMCC };
}

/**
 * Calculate estimated payment
 * @param {Object} drgGroup - DRG group object
 * @param {string} severity - "0", "I", "II", "III"
 * @param {string} kelas - "kelas3", "kelas2", "kelas1"
 * @returns {number} - Estimated payment in IDR
 */
export function calculatePayment(drgGroup, severity, kelas) {
  if (!drgGroup?.severity?.[severity]) return 0;
  const sevData = drgGroup.severity[severity];
  const kelasKey = 'tariff' + (kelas || 'kelas2').charAt(0).toUpperCase() + (kelas || 'kelas2').slice(1);
  return sevData[kelasKey] || 0;
}

/**
 * Analyze procedure impact on DRG
 * @param {string[]} procedures - Array of ICD-9 codes
 * @param {Object} procedureRules - Procedure impact data
 * @param {Object} currentDRG - Current DRG group
 * @returns {Object} - Procedure analysis result
 */
export function analyzeProcedures(procedures, procedureRules, currentDRG) {
  if (!procedures?.length || !procedureRules?.procedures) {
    return { hasProcedures: false, severityBoostApplied: 0, additionalCost: 0, procedures: [] };
  }

  let totalSeverityBoost = 0;
  let totalAdditionalCostKelas3 = 0;
  let totalAdditionalCostKelas2 = 0;
  let totalAdditionalCostKelas1 = 0;
  let shiftedDRG = null;
  const procedureImpacts = [];

  procedures.forEach(procCode => {
    const rule = procedureRules.procedures.find(p => p.code === procCode);
    if (rule) {
      totalSeverityBoost += rule.severityBoost || 0;
      totalAdditionalCostKelas3 += rule.tariffAdd?.kelas3 || 0;
      totalAdditionalCostKelas2 += rule.tariffAdd?.kelas2 || 0;
      totalAdditionalCostKelas1 += rule.tariffAdd?.kelas1 || 0;
      if (rule.drgShift) shiftedDRG = rule.drgShift;
      procedureImpacts.push({
        code: rule.code,
        title: rule.titleID || rule.title,
        severityBoost: rule.severityBoost,
        additionalCost: rule.tariffAdd?.kelas3 || 0,
        drgShift: rule.drgShift
      });
    }
  });

  return {
    hasProcedures: procedureImpacts.length > 0,
    severityBoostApplied: totalSeverityBoost,
    additionalCost: totalAdditionalCostKelas3,
    additionalCostKelas3: totalAdditionalCostKelas3,
    additionalCostKelas2: totalAdditionalCostKelas2,
    additionalCostKelas1: totalAdditionalCostKelas1,
    shiftedDRG,
    procedures: procedureImpacts
  };
}

/**
 * Calculate coding accuracy score
 * @param {string} principalDx - Principal diagnosis code
 * @param {string[]} secondaryDx - Secondary diagnosis codes
 * @param {string[]} procedures - Procedure codes
 * @param {Object} drgGroup - DRG group (can be null)
 * @param {Object} severity - Severity result
 * @returns {{ score: number, issues: Object[], recommendations: string[] }}
 */
export function calculateAccuracy(principalDx, secondaryDx, procedures, drgGroup, severity) {
  const issues = [];
  const recommendations = [];
  let score = 100;

  if (!principalDx) {
    issues.push({ type: 'error', code: null, message: 'Diagnosis utama belum diisi' });
    score -= 30;
  }

  if (!drgGroup) {
    issues.push({ type: 'error', code: principalDx, message: `Kode ${principalDx} tidak ditemukan dalam DRG groups` });
    score -= 20;
  }

  if (secondaryDx.length === 0) {
    issues.push({ type: 'warning', code: null, message: 'Tidak ada diagnosis sekunder — pastikan tidak ada komorbiditas aktif yang terlewat' });
    score -= 15;
    recommendations.push('Periksa resume medis untuk diagnosis sekunder yang aktif dikelola');
  }

  if (severity.level === '0' && secondaryDx.length > 0) {
    issues.push({ type: 'info', code: null, message: 'Diagnosis sekunder tidak terklasifikasi sebagai CC/MCC' });
    score -= 5;
    recommendations.push('Gunakan kode ICD-10 paling spesifik untuk diagnosis sekunder');
  }

  if (procedures.length === 0) {
    issues.push({ type: 'info', code: null, message: 'Tidak ada prosedur — pastikan semua tindakan terkode' });
    score -= 5;
  }

  if (score >= 80) {
    recommendations.push('Koding sudah cukup baik — pastikan dokumentasi klinis mendukung');
  } else if (score >= 60) {
    recommendations.push('Perlu perbaikan pada beberapa aspek koding');
  } else {
    recommendations.push('Koding perlu perbaikan signifikan — konsultasi dengan tim casemix');
  }

  return { score: Math.max(0, score), issues, recommendations };
}

/**
 * Full simulation: takes a case and returns complete analysis
 * @param {Object} caseData - { principalDx, secondaryDx[], procedures[], kelas }
 * @param {Object} drgGroups - DRG groups data
 * @param {Object} ccRules - CC/MCC rules
 * @param {Object} procedureRules - Procedure impact data
 * @returns {Object} - Full simulation result
 */
export function simulateClaim(caseData, drgGroups, ccRules, procedureRules) {
  const { principalDx, secondaryDx = [], procedures = [], kelas = 'kelas2' } = caseData;

  const drgGroup = findDRGGroup(principalDx, drgGroups);
  const severity = determineSeverity(drgGroup?.drgCode || '', secondaryDx, ccRules);
  const procedureImpact = analyzeProcedures(procedures, procedureRules, drgGroup);

  // Apply procedure severity boost
  let effectiveSeverity = severity.level;
  if (procedureImpact.severityBoostApplied > 0) {
    const levels = ['0', 'I', 'II', 'III'];
    const currentIdx = levels.indexOf(effectiveSeverity);
    const newIdx = Math.min(currentIdx + procedureImpact.severityBoostApplied, 3);
    effectiveSeverity = levels[newIdx];
  }

  const basePayment = calculatePayment(drgGroup, effectiveSeverity, kelas);
  const totalPayment = basePayment + procedureImpact.additionalCost;
  const accuracy = calculateAccuracy(principalDx, secondaryDx, procedures, drgGroup, severity);

  return {
    input: { principalDx, secondaryDx, procedures, kelas },
    drg: drgGroup ? {
      code: drgGroup.drgCode,
      name: drgGroup.drgName,
      nameID: drgGroup.drgNameID,
      mdc: drgGroup.mdc,
      mdcName: drgGroup.mdcName
    } : null,
    severity: {
      level: effectiveSeverity,
      baseLevel: severity.level,
      ccCount: severity.ccCount,
      mccCount: severity.mccCount,
      matchedCC: severity.matchedCC,
      matchedMCC: severity.matchedMCC
    },
    payment: {
      base: basePayment,
      procedureAddition: procedureImpact.additionalCost,
      total: totalPayment,
      kelas,
      kelas3: calculatePayment(drgGroup, effectiveSeverity, 'kelas3') + (procedureImpact.additionalCostKelas3 || 0),
      kelas2: calculatePayment(drgGroup, effectiveSeverity, 'kelas2') + (procedureImpact.additionalCostKelas2 || 0),
      kelas1: calculatePayment(drgGroup, effectiveSeverity, 'kelas1') + (procedureImpact.additionalCostKelas1 || 0)
    },
    procedureImpact,
    accuracy
  };
}

/**
 * Generate what-if scenarios
 * @param {Object} caseData - Original case
 * @param {Object} drgGroups - DRG groups data
 * @param {Object} ccRules - CC/MCC rules
 * @param {Object} procedureRules - Procedure impact data
 * @returns {Object[]} - Array of scenario comparisons
 */
export function generateWhatIfScenarios(caseData, drgGroups, ccRules, procedureRules) {
  const scenarios = [];
  const baseResult = simulateClaim(caseData, drgGroups, ccRules, procedureRules);

  // Scenario 1: Remove each secondary diagnosis one at a time
  caseData.secondaryDx?.forEach((removedCode, idx) => {
    const newSecondary = caseData.secondaryDx.filter((_, i) => i !== idx);
    const newCase = { ...caseData, secondaryDx: newSecondary };
    const newResult = simulateClaim(newCase, drgGroups, ccRules, procedureRules);

    const classification = classifyCode(removedCode, baseResult.drg?.code || '', ccRules);
    scenarios.push({
      scenario: `Jika ${removedCode} (${classification.description || 'tidak diklasifikasi'}) tidak dikodekan`,
      type: classification.type === 'mcc' ? 'critical' : classification.type === 'cc' ? 'warning' : 'info',
      impact: {
        severityBefore: baseResult.severity.level,
        severityAfter: newResult.severity.level,
        paymentBefore: baseResult.payment.total,
        paymentAfter: newResult.payment.total,
        difference: newResult.payment.total - baseResult.payment.total
      },
      explanation: classification.type === 'mcc'
        ? `Menghapus MCC ${removedCode} menurunkan severity dari ${baseResult.severity.level} ke ${newResult.severity.level}`
        : classification.type === 'cc'
        ? `Menghapus CC ${removedCode} mengurangi jumlah CC namun severity tetap ${newResult.severity.level}`
        : `Kode ${removedCode} bukan CC/MCC — tidak mempengaruhi severity`
    });
  });

  // Scenario 2: Add a common MCC if not present
  const commonMCCs = ['I50.9', 'N17.9', 'J96.00', 'A41.9', 'I63.9'];
  const existingCodes = [caseData.principalDx, ...(caseData.secondaryDx || [])].map(c => c?.toUpperCase());
  const missingMCC = commonMCCs.find(code => !existingCodes.includes(code));

  if (missingMCC && baseResult.severity.level !== 'III') {
    const newSecondary = [...(caseData.secondaryDx || []), missingMCC];
    const newCase = { ...caseData, secondaryDx: newSecondary };
    const newResult = simulateClaim(newCase, drgGroups, ccRules, procedureRules);
    const classification = classifyCode(missingMCC, baseResult.drg?.code || '', ccRules);

    scenarios.push({
      scenario: `Jika tambah ${missingMCC} (${classification.description})`,
      type: 'opportunity',
      impact: {
        severityBefore: baseResult.severity.level,
        severityAfter: newResult.severity.level,
        paymentBefore: baseResult.payment.total,
        paymentAfter: newResult.payment.total,
        difference: newResult.payment.total - baseResult.payment.total
      },
      explanation: `${missingMCC} adalah MCC → menambah severity dari ${baseResult.severity.level} ke ${newResult.severity.level}`
    });
  }

  // Scenario 3: Remove all secondary diagnoses
  if (caseData.secondaryDx?.length > 0) {
    const noSecondaryCase = { ...caseData, secondaryDx: [] };
    const noSecondaryResult = simulateClaim(noSecondaryCase, drgGroups, ccRules, procedureRules);
    scenarios.push({
      scenario: 'Jika semua diagnosis sekunder tidak dikodekan',
      type: 'critical',
      impact: {
        severityBefore: baseResult.severity.level,
        severityAfter: noSecondaryResult.severity.level,
        paymentBefore: baseResult.payment.total,
        paymentAfter: noSecondaryResult.payment.total,
        difference: noSecondaryResult.payment.total - baseResult.payment.total
      },
      explanation: `Menghapus semua diagnosis sekunder menurunkan severity dari ${baseResult.severity.level} ke ${noSecondaryResult.severity.level}`
    });
  }

  return scenarios;
}

export default {
  findDRGGroup,
  classifyCode,
  determineSeverity,
  calculatePayment,
  analyzeProcedures,
  calculateAccuracy,
  simulateClaim,
  generateWhatIfScenarios
};
