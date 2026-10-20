"""
Independent NumPy Reference Implementation of 1D Discrete-Time Quantum Walk.

This implementation is mathematically direct and completely independent of
Qiskit circuit construction, gate synthesis, and simulator backends.

Mathematical specification:
- Coin Hilbert space: H_c = span{|0⟩, |1⟩}
- Position Hilbert space: H_p = span{|x⟩ : x ∈ Z}
- Initial state: |ψ(0)⟩ = |x=0⟩ ⊗ (|0⟩ + i|1⟩)/√2
- Coin operator: Hadamard H = (1/√2) * [[1, 1], [1, -1]]
- Shift operator: S = Σ_x (|x+1⟩⟨x| ⊗ |0⟩⟨0| + |x-1⟩⟨x| ⊗ |1⟩⟨1|)
- Discrete step: |ψ(t+1)⟩ = S · (I ⊗ H) |ψ(t)⟩
- Position probability: P(x, t) = |ψ(x, 0, t)|² + |ψ(x, 1, t)|²
"""

import numpy as np
from typing import Dict, List, Tuple


class NumpyQuantumWalkReference:
    """Independent mathematical tensor reference for 1D Hadamard quantum walk."""

    def __init__(self, max_steps: int):
        if max_steps < 0:
            raise ValueError(f"max_steps must be non-negative, got {max_steps}")
        self.max_steps = max_steps
        # Grid covers coordinates from -max_steps to +max_steps
        self.grid_size = 2 * max_steps + 1
        self.origin = max_steps

    def simulate_all_steps(self) -> List[Dict[str, any]]:
        """
        Simulate all steps from 0 through max_steps.

        Returns:
            List of dictionaries, one per timestep t in [0, max_steps], containing:
            - step: int
            - distribution: Dict[int, float] (x -> probability)
            - mean: float
            - std_dev: float
            - norm_check: float
            - is_symmetric: bool
        """
        # Complex state tensor: psi[pos_idx, coin_state]
        psi = np.zeros((self.grid_size, 2), dtype=np.complex128)

        # Initial state at t = 0: origin with coin (|0⟩ + i|1⟩)/√2
        psi[self.origin, 0] = 1.0 / np.sqrt(2.0)
        psi[self.origin, 1] = 1.0j / np.sqrt(2.0)

        # Hadamard coin operator
        H = np.array([[1.0, 1.0], [1.0, -1.0]], dtype=np.complex128) / np.sqrt(2.0)

        snapshots = []

        # Record t = 0 snapshot
        snapshots.append(self._extract_snapshot(0, psi))

        # Evolve step by step
        for t in range(1, self.max_steps + 1):
            # 1. Coin operation on coin dimension: (H @ psi.T).T
            coin_transformed = (H @ psi.T).T

            # 2. Shift operation:
            # |0⟩ moves right (pos_idx -> pos_idx + 1)
            # |1⟩ moves left (pos_idx -> pos_idx - 1)
            next_psi = np.zeros_like(psi)
            next_psi[1:, 0] = coin_transformed[:-1, 0]
            next_psi[:-1, 1] = coin_transformed[1:, 1]

            psi = next_psi
            snapshots.append(self._extract_snapshot(t, psi))

        return snapshots

    def _extract_snapshot(self, t: int, psi: np.ndarray) -> Dict[str, any]:
        """Extract probabilities, mean, standard deviation, and symmetry at step t."""
        # Calculate P(x, t) = |ψ(x, 0)|² + |ψ(x, 1)|²
        prob_array = np.sum(np.abs(psi) ** 2, axis=1)

        # Restrict to reachable coordinate window [-t, +t]
        distribution: Dict[int, float] = {}
        for x in range(-t, t + 1):
            idx = self.origin + x
            prob = float(prob_array[idx])
            distribution[x] = prob

        norm_sum = float(sum(distribution.values()))

        if t == 0:
            return {
                "step": 0,
                "distribution": distribution,
                "mean": 0.0,
                "std_dev": 0.0,
                "norm_check": norm_sum,
                "is_symmetric": True,
            }

        mean = float(sum(x * p for x, p in distribution.items()))
        variance = float(sum((x - mean) ** 2 * p for x, p in distribution.items()))
        std_dev = float(np.sqrt(max(0.0, variance)))

        # Verify symmetry P(x) == P(-x) within numerical tolerance
        is_symmetric = all(
            abs(distribution[x] - distribution[-x]) < 1e-12 for x in range(1, t + 1)
        )

        return {
            "step": t,
            "distribution": distribution,
            "mean": mean,
            "std_dev": std_dev,
            "norm_check": norm_sum,
            "is_symmetric": is_symmetric,
        }
