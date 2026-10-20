"""
Independent Classical Random Walk Reference.

Computes the exact probability distribution, mean, and standard deviation
for an unbiased 1D classical random walk starting at origin x = 0.

At each discrete timestep:
- Walker steps right (+1) with probability 1/2.
- Walker steps left (-1) with probability 1/2.

Analytical distribution:
    P_classical(x, t) = (1 / 2^t) * binom(t, (t + x)/2)
    valid for -t <= x <= +t where (t + x) is even; 0 otherwise.
    At t = 0: P(0, 0) = 1.0.

Key statistical properties:
    Mean: μ_cl(t) = 0.0
    Variance: Var(x, t) = t
    Standard deviation: σ_cl(t) = √t
"""

import math
from typing import Dict, List, Tuple


class ClassicalRandomWalkReference:
    """Analytical engine for classical unbiased 1D random walk."""

    @staticmethod
    def compute_distribution(t: int) -> Dict[int, float]:
        """
        Compute the classical probability distribution for all coordinates in [-t, +t].

        Args:
            t: Discrete timestep count (t >= 0).

        Returns:
            Dictionary mapping integer coordinate x -> probability P_classical(x, t).
        """
        if t < 0:
            raise ValueError(f"Timestep t must be non-negative, got {t}")

        if t == 0:
            return {0: 1.0}

        distribution: Dict[int, float] = {}
        normalizer = 2**t

        for x in range(-t, t + 1):
            if (t + x) % 2 != 0:
                # Wrong parity: cannot be reached at step t
                distribution[x] = 0.0
            else:
                k = (t + x) // 2
                prob = math.comb(t, k) / normalizer
                distribution[x] = float(prob)

        return distribution

    @classmethod
    def compute_step_statistics(
        cls, t: int
    ) -> Tuple[Dict[int, float], float, float, float, float]:
        """
        Compute distribution and full statistics for timestep t.

        Returns:
            Tuple of (distribution_dict, mean, std_dev, theoretical_std_dev, norm_sum)
        """
        dist = cls.compute_distribution(t)
        norm_sum = sum(dist.values())

        if t == 0:
            return dist, 0.0, 0.0, 0.0, norm_sum

        mean = sum(x * p for x, p in dist.items())
        variance = sum((x - mean) ** 2 * p for x, p in dist.items())
        std_dev = math.sqrt(variance)
        theoretical_std_dev = math.sqrt(float(t))

        return dist, mean, std_dev, theoretical_std_dev, norm_sum

    @classmethod
    def generate_all_timesteps(
        cls, max_steps: int
    ) -> List[Dict[str, any]]:
        """Generate classical data for all steps 0 through max_steps."""
        results = []
        for t in range(max_steps + 1):
            dist, mean, std_dev, theo_std, norm_sum = cls.compute_step_statistics(t)
            points = [{"x": x, "probability": p} for x, p in sorted(dist.items())]
            results.append(
                {
                    "step": t,
                    "mean": mean,
                    "std_dev": std_dev,
                    "theoretical_std_dev": theo_std,
                    "norm_check": norm_sum,
                    "distribution": points,
                }
            )
        return results
