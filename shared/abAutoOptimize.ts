/**
 * A/B Test Auto-Optimization using Thompson Sampling (Multi-Armed Bandit).
 * 
 * Instead of fixed equal traffic split, this algorithm dynamically allocates
 * more traffic to better-performing variants while still exploring alternatives.
 * 
 * Thompson Sampling uses Beta distributions to model uncertainty about each
 * variant's true conversion rate, then samples from these distributions to
 * decide which variant to show.
 */

export interface VariantAllocation {
  variantId: string;
  /** Current traffic allocation weight (0-1, sums to 1 across all variants) */
  weight: number;
  /** Observed conversion rate */
  conversionRate: number;
  /** Number of successes (conversions) */
  alpha: number;
  /** Number of failures (impressions - conversions) */
  beta: number;
  /** Probability of being the best variant (from simulation) */
  probBest: number;
}

export interface AutoOptimizeConfig {
  /** Whether auto-optimization is enabled */
  enabled: boolean;
  /** Minimum impressions per variant before optimization kicks in */
  minImpressionsPerVariant: number;
  /** Minimum exploration weight (ensures each variant gets at least this traffic) */
  minExplorationWeight: number;
  /** Number of Monte Carlo simulations for probability estimation */
  simulations: number;
}

export const DEFAULT_AUTO_OPTIMIZE_CONFIG: AutoOptimizeConfig = {
  enabled: false,
  minImpressionsPerVariant: 50,
  minExplorationWeight: 0.05, // Each variant gets at least 5% traffic
  simulations: 10000,
};

/**
 * Sample from a Beta distribution using the Jöhnk algorithm.
 * Beta(alpha, beta) represents our belief about the true conversion rate.
 */
function sampleBeta(alpha: number, beta: number): number {
  if (alpha <= 0 || beta <= 0) return 0.5;

  // Use gamma sampling for Beta distribution
  const gammaA = sampleGamma(alpha);
  const gammaB = sampleGamma(beta);
  
  if (gammaA + gammaB === 0) return 0.5;
  return gammaA / (gammaA + gammaB);
}

/**
 * Sample from Gamma distribution using Marsaglia and Tsang's method.
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    // For shape < 1, use the transformation method
    const u = Math.random();
    return sampleGamma(shape + 1) * Math.pow(u, 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;

    do {
      x = normalRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Generate a standard normal random variable using Box-Muller transform.
 */
function normalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Calculate traffic allocation weights using Thompson Sampling.
 * 
 * For each variant, we model the conversion rate as Beta(successes + 1, failures + 1).
 * We then run Monte Carlo simulations to estimate how often each variant "wins"
 * (has the highest sampled conversion rate), and use these probabilities as weights.
 */
export function calculateTrafficAllocation(
  variants: { variantId: string; impressions: number; conversions: number }[],
  config: AutoOptimizeConfig = DEFAULT_AUTO_OPTIMIZE_CONFIG
): VariantAllocation[] {
  if (variants.length === 0) return [];

  // Check if we have enough data for optimization
  const hasEnoughData = variants.every(v => v.impressions >= config.minImpressionsPerVariant);

  if (!hasEnoughData || !config.enabled) {
    // Equal allocation when not enough data or disabled
    const equalWeight = 1 / variants.length;
    return variants.map(v => ({
      variantId: v.variantId,
      weight: equalWeight,
      conversionRate: v.impressions > 0 ? v.conversions / v.impressions : 0,
      alpha: v.conversions + 1,
      beta: (v.impressions - v.conversions) + 1,
      probBest: equalWeight,
    }));
  }

  // Thompson Sampling: estimate P(best) for each variant via simulation
  const winCounts = new Array(variants.length).fill(0);

  for (let sim = 0; sim < config.simulations; sim++) {
    let bestIdx = 0;
    let bestSample = -1;

    for (let i = 0; i < variants.length; i++) {
      const alpha = variants[i].conversions + 1; // +1 prior (Beta(1,1) = uniform)
      const beta = (variants[i].impressions - variants[i].conversions) + 1;
      const sample = sampleBeta(alpha, beta);

      if (sample > bestSample) {
        bestSample = sample;
        bestIdx = i;
      }
    }

    winCounts[bestIdx]++;
  }

  // Convert win counts to probabilities
  const totalSims = config.simulations;
  const rawWeights = winCounts.map(w => w / totalSims);

  // Apply minimum exploration weight
  const minWeight = config.minExplorationWeight;
  const totalMinWeight = minWeight * variants.length;
  const remainingWeight = Math.max(0, 1 - totalMinWeight);

  const rawSum = rawWeights.reduce((s, w) => s + w, 0);
  const adjustedWeights = rawWeights.map(w => {
    return minWeight + (rawSum > 0 ? (w / rawSum) * remainingWeight : remainingWeight / variants.length);
  });

  // Normalize to ensure sum = 1
  const weightSum = adjustedWeights.reduce((s, w) => s + w, 0);
  const normalizedWeights = adjustedWeights.map(w => w / weightSum);

  return variants.map((v, i) => ({
    variantId: v.variantId,
    weight: normalizedWeights[i],
    conversionRate: v.impressions > 0 ? v.conversions / v.impressions : 0,
    alpha: v.conversions + 1,
    beta: (v.impressions - v.conversions) + 1,
    probBest: rawWeights[i],
  }));
}

/**
 * Select a variant based on Thompson Sampling weights.
 * Used client-side to determine which variant to show.
 */
export function selectVariantByWeight(allocations: VariantAllocation[]): string | null {
  if (allocations.length === 0) return null;

  const rand = Math.random();
  let cumulative = 0;

  for (const alloc of allocations) {
    cumulative += alloc.weight;
    if (rand < cumulative) {
      return alloc.variantId;
    }
  }

  // Fallback to last variant
  return allocations[allocations.length - 1].variantId;
}
