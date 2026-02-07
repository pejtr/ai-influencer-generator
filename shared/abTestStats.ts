/**
 * Statistical significance calculations for A/B testing.
 * Uses Chi-Squared test for comparing conversion rates between variants.
 * Provides p-value, confidence intervals, and winner detection.
 */

export interface VariantStats {
  variantId: string;
  impressions: number;
  conversions: number; // clicks/installs
  dismissals: number;
  conversionRate: number; // 0-1
}

export interface ABTestSignificance {
  /** Is the result statistically significant at the given confidence level? */
  isSignificant: boolean;
  /** p-value from chi-squared test (lower = more significant) */
  pValue: number;
  /** Confidence level (e.g., 0.95 for 95%) */
  confidenceLevel: number;
  /** The winning variant ID, or null if no significant winner */
  winner: string | null;
  /** Relative improvement of winner over control (percentage) */
  relativeImprovement: number | null;
  /** Per-variant confidence intervals */
  variants: VariantWithCI[];
  /** Minimum sample size needed for significance */
  minSampleSize: number;
  /** Current total sample size */
  totalSamples: number;
  /** Human-readable summary */
  summary: string;
}

export interface VariantWithCI extends VariantStats {
  /** Lower bound of 95% confidence interval for conversion rate */
  ciLower: number;
  /** Upper bound of 95% confidence interval for conversion rate */
  ciUpper: number;
  /** Standard error */
  standardError: number;
}

/**
 * Calculate the chi-squared statistic for a 2xN contingency table.
 * Tests whether conversion rates differ significantly across variants.
 */
function chiSquaredTest(variants: VariantStats[]): { chiSquared: number; degreesOfFreedom: number } {
  const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);

  if (totalImpressions === 0 || totalConversions === 0) {
    return { chiSquared: 0, degreesOfFreedom: Math.max(variants.length - 1, 1) };
  }

  const overallRate = totalConversions / totalImpressions;
  let chiSquared = 0;

  for (const variant of variants) {
    if (variant.impressions === 0) continue;

    const expectedConversions = variant.impressions * overallRate;
    const expectedNonConversions = variant.impressions * (1 - overallRate);

    if (expectedConversions > 0) {
      chiSquared += Math.pow(variant.conversions - expectedConversions, 2) / expectedConversions;
    }
    if (expectedNonConversions > 0) {
      const nonConversions = variant.impressions - variant.conversions;
      chiSquared += Math.pow(nonConversions - expectedNonConversions, 2) / expectedNonConversions;
    }
  }

  return {
    chiSquared,
    degreesOfFreedom: Math.max(variants.length - 1, 1),
  };
}

/**
 * Approximate p-value from chi-squared statistic using the regularized
 * incomplete gamma function. This avoids needing external math libraries.
 */
function chiSquaredPValue(chiSquared: number, df: number): number {
  if (chiSquared <= 0 || df <= 0) return 1;

  // Use the regularized incomplete gamma function approximation
  // P(X > chiSquared) = 1 - gammaIncomplete(df/2, chiSquared/2) / gamma(df/2)
  return 1 - regularizedGammaP(df / 2, chiSquared / 2);
}

/**
 * Regularized lower incomplete gamma function P(a, x)
 * Uses series expansion for small x and continued fraction for large x.
 */
function regularizedGammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x === 0) return 0;

  if (x < a + 1) {
    // Use series expansion
    return gammaSeries(a, x);
  } else {
    // Use continued fraction
    return 1 - gammaContinuedFraction(a, x);
  }
}

function gammaSeries(a: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 1e-10;

  let sum = 1 / a;
  let term = 1 / a;

  for (let n = 1; n < maxIterations; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * epsilon) break;
  }

  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaContinuedFraction(a: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 1e-10;

  let b = x + 1 - a;
  let c = 1 / 1e-30;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i < maxIterations; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < epsilon) break;
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/**
 * Log of the Gamma function using Stirling's approximation (Lanczos)
 */
function logGamma(x: number): number {
  const coefficients = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.001208650973866179,
    -0.000005395239384953,
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += coefficients[j] / y;
  }

  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/**
 * Calculate Wilson score confidence interval for a proportion.
 * More accurate than normal approximation, especially for small samples.
 */
function wilsonCI(successes: number, trials: number, z: number = 1.96): { lower: number; upper: number } {
  if (trials === 0) return { lower: 0, upper: 0 };

  const p = successes / trials;
  const n = trials;
  const z2 = z * z;

  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / denominator;

  return {
    lower: Math.max(0, center - margin),
    upper: Math.min(1, center + margin),
  };
}

/**
 * Calculate minimum sample size per variant for detecting a given effect size.
 * Uses the formula: n = (Z_alpha/2 + Z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1-p2)^2
 */
function calculateMinSampleSize(
  baselineRate: number = 0.05,
  minimumDetectableEffect: number = 0.02,
  alpha: number = 0.05,
  power: number = 0.8
): number {
  const zAlpha = 1.96; // For alpha = 0.05 (two-tailed)
  const zBeta = 0.84;  // For power = 0.8

  const p1 = baselineRate;
  const p2 = baselineRate + minimumDetectableEffect;

  if (p1 === p2) return Infinity;

  const numerator = Math.pow(zAlpha + zBeta, 2) * (p1 * (1 - p1) + p2 * (1 - p2));
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}

/**
 * Main function: Calculate A/B test statistical significance.
 */
export function calculateABTestSignificance(
  variants: VariantStats[],
  confidenceLevel: number = 0.95
): ABTestSignificance {
  const alpha = 1 - confidenceLevel;
  const z = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;

  // Calculate confidence intervals for each variant
  const variantsWithCI: VariantWithCI[] = variants.map(v => {
    const ci = wilsonCI(v.conversions, v.impressions, z);
    const se = v.impressions > 0
      ? Math.sqrt((v.conversionRate * (1 - v.conversionRate)) / v.impressions)
      : 0;

    return {
      ...v,
      ciLower: ci.lower,
      ciUpper: ci.upper,
      standardError: se,
    };
  });

  const totalSamples = variants.reduce((sum, v) => sum + v.impressions, 0);

  // Need at least 2 variants with data
  const activeVariants = variants.filter(v => v.impressions > 0);
  if (activeVariants.length < 2) {
    const avgRate = activeVariants.length > 0 ? activeVariants[0].conversionRate : 0.05;
    return {
      isSignificant: false,
      pValue: 1,
      confidenceLevel,
      winner: null,
      relativeImprovement: null,
      variants: variantsWithCI,
      minSampleSize: calculateMinSampleSize(avgRate),
      totalSamples,
      summary: "Not enough data. Need at least 2 variants with impressions to compare.",
    };
  }

  // Chi-squared test
  const { chiSquared, degreesOfFreedom } = chiSquaredTest(activeVariants);
  const pValue = chiSquaredPValue(chiSquared, degreesOfFreedom);
  const isSignificant = pValue < alpha;

  // Find the best performing variant
  const sortedByRate = [...activeVariants].sort((a, b) => b.conversionRate - a.conversionRate);
  const bestVariant = sortedByRate[0];
  const controlVariant = activeVariants.find(v => v.variantId === "control") || activeVariants[0];

  let winner: string | null = null;
  let relativeImprovement: number | null = null;

  if (isSignificant && bestVariant) {
    winner = bestVariant.variantId;
    if (controlVariant && controlVariant.conversionRate > 0) {
      relativeImprovement = Math.round(
        ((bestVariant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 10000
      ) / 100;
    }
  }

  // Calculate minimum sample size
  const avgRate = activeVariants.reduce((sum, v) => sum + v.conversionRate, 0) / activeVariants.length;
  const minSampleSize = calculateMinSampleSize(avgRate || 0.05);

  // Generate summary
  let summary: string;
  if (isSignificant) {
    summary = `Statistically significant result (p=${pValue.toFixed(4)}). ` +
      `Variant "${winner}" is the winner` +
      (relativeImprovement !== null ? ` with ${relativeImprovement > 0 ? "+" : ""}${relativeImprovement}% improvement over control.` : ".");
  } else if (totalSamples < minSampleSize * activeVariants.length) {
    const needed = minSampleSize * activeVariants.length - totalSamples;
    summary = `Not yet significant (p=${pValue.toFixed(4)}). Need approximately ${needed} more impressions across all variants.`;
  } else {
    summary = `No significant difference found (p=${pValue.toFixed(4)}). Variants perform similarly at ${(confidenceLevel * 100).toFixed(0)}% confidence level.`;
  }

  return {
    isSignificant,
    pValue,
    confidenceLevel,
    winner,
    relativeImprovement,
    variants: variantsWithCI,
    minSampleSize,
    totalSamples,
    summary,
  };
}
