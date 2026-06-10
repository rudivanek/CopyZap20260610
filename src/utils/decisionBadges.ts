/**
 * Decision Badges - Display-only helper
 *
 * Determines which decision badge (if any) a version qualifies for.
 * This is purely for display purposes and does NOT affect scoring or ranking.
 */

interface SubScores {
  conversion: number;
  trust: number;
  risk: number;
}

interface VersionWithScores {
  versionId: string;
  finalScore: number;
  subScores?: SubScores;
}

export interface DecisionBadge {
  label: string;
  type: 'best-overall' | 'conversion' | 'safest' | 'balanced';
  priority: number;
  icon?: string;
}

/**
 * Gets the decision badge for a version based on its scores
 * Returns only ONE badge per version using priority system
 */
export function getDecisionBadgeForVersion(
  version: VersionWithScores,
  allVersions: VersionWithScores[]
): DecisionBadge | null {
  if (!version.subScores) return null;

  const { conversion, trust, risk } = version.subScores;
  const qualifiedBadges: DecisionBadge[] = [];

  // 1. Best Overall - highest Final Score (Priority 1)
  const highestScore = Math.max(...allVersions.map(v => v.finalScore));
  if (version.finalScore === highestScore) {
    qualifiedBadges.push({
      label: 'Best Overall',
      type: 'best-overall',
      priority: 1,
      icon: 'check'
    });
  }

  // 2. Strongest Conversion - highest Conversion score AND Conversion >= 70 (Priority 2)
  const highestConversion = Math.max(
    ...allVersions
      .filter(v => v.subScores && v.subScores.conversion >= 70)
      .map(v => v.subScores?.conversion ?? 0)
  );
  if (conversion === highestConversion && conversion >= 70) {
    qualifiedBadges.push({
      label: 'Best for Conversion',
      type: 'conversion',
      priority: 2,
      icon: 'zap'
    });
  }

  // 3. Safest - lowest Risk AND Trust >= 55 (Priority 3)
  const lowestRisk = Math.min(
    ...allVersions
      .filter(v => v.subScores && v.subScores.trust >= 55)
      .map(v => v.subScores?.risk ?? 100)
  );
  if (risk === lowestRisk && trust >= 55) {
    qualifiedBadges.push({
      label: 'Low Risk',
      type: 'safest',
      priority: 3,
      icon: 'shield'
    });
  }

  // 4. Balanced - smallest difference between Conversion and Trust AND both >= 50 (Priority 4)
  if (conversion >= 50 && trust >= 50) {
    const differences = allVersions
      .filter(v => v.subScores && v.subScores.conversion >= 50 && v.subScores.trust >= 50)
      .map(v => {
        if (!v.subScores) return Infinity;
        return Math.abs(v.subScores.conversion - v.subScores.trust);
      });

    if (differences.length > 0) {
      const smallestDiff = Math.min(...differences);
      const thisDiff = Math.abs(conversion - trust);

      if (thisDiff === smallestDiff) {
        qualifiedBadges.push({
          label: 'Well Balanced',
          type: 'balanced',
          priority: 4,
          icon: 'circle'
        });
      }
    }
  }

  // Return highest priority badge (lowest priority number)
  if (qualifiedBadges.length === 0) return null;
  qualifiedBadges.sort((a, b) => a.priority - b.priority);
  return qualifiedBadges[0];
}

/**
 * Gets CSS classes for badge styling
 * Best Overall has slightly stronger styling to emphasize priority
 */
export function getBadgeStyles(badgeType: DecisionBadge['type']): string {
  switch (badgeType) {
    case 'best-overall':
      return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700';
    case 'conversion':
      return 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    case 'safest':
      return 'bg-slate-50 dark:bg-slate-950/30 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800';
    case 'balanced':
      return 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
    default:
      return 'bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800';
  }
}

/**
 * Generates a confidence-supporting summary for the Best Overall winner
 * Used to replace potentially weak analysis.summary text
 *
 * This is DISPLAY-ONLY and does NOT affect scoring, ranking, or badge logic.
 *
 * @param version - The winner version
 * @param allVersions - All versions for comparison
 * @returns Confidence-supporting summary string or null if not winner
 */
export function getWinnerSummary(
  version: VersionWithScores,
  allVersions: VersionWithScores[]
): string | null {
  // Only generate for highest scoring version (Best Overall)
  const highestScore = Math.max(...allVersions.map(v => v.finalScore));
  if (version.finalScore !== highestScore) {
    return null;
  }

  if (!version.subScores) {
    return "Strongest overall performance across all evaluated dimensions. Most effective option among the compared versions.";
  }

  const { conversion, trust, risk } = version.subScores;

  // Generate confidence-supporting summary based on characteristics
  const isHighConversion = conversion >= 75;
  const isHighTrust = trust >= 75;
  const isLowRisk = risk <= 25;
  const isBalanced = Math.abs(conversion - trust) <= 10;

  if (isHighConversion && isHighTrust) {
    return "Delivers the strongest combination of persuasive impact and credibility. Outperforms other versions across critical effectiveness dimensions.";
  }

  if (isBalanced && isHighTrust) {
    return "Achieves optimal balance while maintaining strong audience trust. Most well-rounded and strategically sound option in this comparison.";
  }

  if (isHighConversion && isLowRisk) {
    return "Maximizes conversion potential while minimizing friction points. Most effective at driving action without compromising message clarity.";
  }

  if (isHighTrust) {
    return "Establishes the strongest credibility foundation while effectively driving desired action. Most trustworthy and compelling option overall.";
  }

  // General confidence-supporting fallback
  return "Demonstrates the strongest overall balance across clarity, credibility, and persuasion. Most effective version in this comparison.";
}

/**
 * Generates a short comparative explanation for why a version is Best Overall
 * Max 12-15 words, specific, comparative, references strengths
 *
 * This is DISPLAY-ONLY and does NOT affect scoring, ranking, or badge logic.
 *
 * @param version - The version to explain (must be Best Overall)
 * @param allVersions - All versions for comparison
 * @returns Short explanation string or null if not Best Overall
 */
export function getBestOverallExplanation(
  version: VersionWithScores,
  allVersions: VersionWithScores[]
): string | null {
  // Only generate for highest scoring version (Best Overall)
  const highestScore = Math.max(...allVersions.map(v => v.finalScore));
  if (version.finalScore !== highestScore) {
    return null;
  }

  if (!version.subScores) return null;

  const { conversion, trust, risk } = version.subScores;

  // Calculate characteristics to determine explanation type
  const isHighConversion = conversion >= 75;
  const isHighTrust = trust >= 75;
  const isLowRisk = risk <= 25;
  const isBalanced = Math.abs(conversion - trust) <= 10;

  // Check if this version dominates in multiple areas
  const conversionRank = allVersions.filter(v => v.subScores && v.subScores.conversion > conversion).length;
  const trustRank = allVersions.filter(v => v.subScores && v.subScores.trust > trust).length;
  const riskRank = allVersions.filter(v => v.subScores && v.subScores.risk < risk).length;

  const dominatesConversion = conversionRank === 0;
  const dominatesTrust = trustRank === 0;
  const dominatesRisk = riskRank === 0;

  // Generate explanation based on characteristics (all < 15 words)
  if (isHighConversion && isHighTrust && isBalanced) {
    return "Best balance of persuasion and credibility across all versions.";
  }

  if (dominatesConversion && dominatesTrust) {
    return "Strongest combination of conversion power and trustworthiness.";
  }

  if (isHighConversion && isLowRisk) {
    return "Highest conversion potential with minimal friction and risk factors.";
  }

  if (isBalanced && isHighTrust) {
    return "Most balanced approach with strong credibility and clear messaging.";
  }

  if (dominatesConversion && isLowRisk) {
    return "Most effective persuasion with lowest risk of audience resistance.";
  }

  if (isHighTrust && dominatesRisk) {
    return "Best credibility and clarity with minimal trust barriers.";
  }

  if (isBalanced) {
    return "Optimal balance of conversion focus and trust-building elements.";
  }

  if (isHighConversion) {
    return "Strongest conversion positioning while maintaining solid trust signals.";
  }

  if (isHighTrust) {
    return "Best trust and credibility foundation with effective call to action.";
  }

  // Fallback: compare to average
  const avgFinalScore = allVersions.reduce((sum, v) => sum + v.finalScore, 0) / allVersions.length;
  const scoreDiff = version.finalScore - avgFinalScore;

  if (scoreDiff >= 10) {
    return "Significantly outperforms other versions in overall effectiveness and impact.";
  }

  return "Most effective combination of clarity, credibility, and persuasion.";
}
