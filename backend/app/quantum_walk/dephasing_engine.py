"""
Qiskit and Mixed-State Density Matrix Engine for Quantum Walk with Coin Dephasing.

Milestone 5: Primary Decoherence Experiment (Phase Damping).

Mathematical Formulation:
- Total Hilbert space: 8 qubits -> 256 dimensions.
  Qubit 0: Coin qubit (LSB)
  Qubits 1..7: Position register (128 lattice sites, origin x = 0 at index 64).
- Initial State (Pure Density Matrix at t = 0):
  |ψ(0)⟩ = |p=64⟩ ⊗ (|0⟩ + i|1⟩)/√2
  ρ(0) = |ψ(0)⟩⟨ψ(0)|
  NOTE: Initial state preparation is strictly noise-free.

- Timestep Evolution Operator Sequence (t >= 1):
  1. Coin Operation:
     Apply Hadamard gate H to coin qubit 0:
     ρ₁ = (I₁₂₈ ⊗ H) ρ (I₁₂₈ ⊗ H)†
  2. Phase Damping Channel (Kraus Representation):
     Applied to coin qubit 0 immediately after H:
     K₀ = [[1, 0], [0, √(1 - p)]]
     K₁ = [[0, 0], [0, √p]]
     acting as:
     ρ₂ = (I₁₂₈ ⊗ K₀) ρ₁ (I₁₂₈ ⊗ K₀)† + (I₁₂₈ ⊗ K₁) ρ₁ (I₁₂₈ ⊗ K₁)†
     Multiplies coin off-diagonal elements (coherences between |0⟩ and |1⟩) by √(1 - p).
     Coin diagonal elements (populations) are preserved.
  3. Spatial Translation (Conditional Shift):
     Apply shift unitary U_S:
     ρ₃ = U_S ρ₂ U_S†
  4. Spatial Probability Extraction:
     P_noisy(x, t) = Tr(|p⟩⟨p| ⊗ I_c · ρ₃) = ρ₃[2p, 2p] + ρ₃[2p+1, 2p+1]
     where p = 64 + x.
"""

import math
from typing import Dict, List, Optional
import numpy as np

from qiskit import QuantumCircuit, QuantumRegister
from qiskit.circuit.library import UnitaryGate
from qiskit_aer.noise import phase_damping_error

from .circuit_builder import _SHIFT_GATE_128, create_shift_unitary_matrix


def build_dephasing_quantum_walk_circuit(
    num_steps: int, noise_strength: float
) -> QuantumCircuit:
    """
    Construct a Qiskit QuantumCircuit embedding Qiskit Aer's phase_damping_error instruction.

    Args:
        num_steps: Timestep count (0 <= num_steps <= 40).
        noise_strength: Phase damping parameter p in [0.0, 1.0].

    Returns:
        QuantumCircuit containing initial state preparation, coin H gates,
        phase-damping channel instructions on coin qubit 0, and conditional shift unitaries.
    """
    if num_steps < 0 or num_steps > 40:
        raise ValueError(f"num_steps must be in [0, 40], got {num_steps}")
    if not (0.0 <= noise_strength <= 1.0):
        raise ValueError(f"noise_strength must be in [0.0, 1.0], got {noise_strength}")

    c = QuantumRegister(1, name="c")
    p = QuantumRegister(7, name="p")
    qc = QuantumCircuit(c, p, name=f"QWalk_Dephased_t{num_steps}_p{noise_strength}")

    # 1. Noise-free initial state preparation
    # Position: origin p = 64 (bit 6 set, which is p[6] / qubit 7)
    qc.x(p[6])
    # Coin: (|0⟩ + i|1⟩)/√2
    qc.h(c[0])
    qc.s(c[0])

    if num_steps == 0:
        return qc

    # 2. Channel instruction for coin dephasing
    err_inst = None
    if noise_strength > 0.0:
        err_inst = phase_damping_error(noise_strength).to_instruction()

    all_qubits = [c[0]] + list(p)

    # 3. Step evolution
    for _ in range(num_steps):
        # Step A: Hadamard coin op
        qc.h(c[0])
        # Step B: Phase damping on coin qubit only
        if err_inst is not None:
            qc.append(err_inst, [c[0]])
        # Step C: Shift
        qc.append(_SHIFT_GATE_128, all_qubits)

    return qc


class DephasingQuantumWalkEngine:
    """
    Exact density-matrix simulation engine for the 1D quantum walk with coin dephasing.

    Operates on the full 256x256 mixed-state density matrix, ensuring mathematically
    exact simulation of open quantum system dynamics without stochastic shot noise.
    """

    NUM_POS_STATES = 128
    ORIGIN_INDEX = 64

    def __init__(self, max_steps: int = 15, noise_strength: float = 0.5):
        if max_steps < 0 or max_steps > 40:
            raise ValueError(f"max_steps must be in [0, 40], got {max_steps}")
        if not (0.0 <= noise_strength <= 1.0):
            raise ValueError(
                f"noise_strength must be in [0.0, 1.0], got {noise_strength}"
            )

        self.max_steps = max_steps
        self.noise_strength = float(noise_strength)

        # Precompute unitary shift matrix and total coin Hadamard
        self.U_shift = create_shift_unitary_matrix(self.NUM_POS_STATES)
        H_coin = np.array([[1.0, 1.0], [1.0, -1.0]], dtype=np.complex128) / np.sqrt(2.0)
        self.H_total = np.kron(np.eye(self.NUM_POS_STATES, dtype=np.complex128), H_coin)

        # Dephasing factor gamma = sqrt(1 - p)
        self.gamma = float(np.sqrt(1.0 - self.noise_strength))

        # Boolean mask for off-diagonal elements in coin subspace
        # Row index k = 2p + c; coin is k % 2
        c_row = np.arange(256) % 2
        self.coin_offdiag_mask = c_row[:, None] != c_row[None, :]

    def get_initial_density_matrix(self) -> np.ndarray:
        """
        Construct initial pure density matrix ρ(0) = |ψ(0)⟩⟨ψ(0)| at x = 0.
        """
        psi = np.zeros(256, dtype=np.complex128)
        # Position p = 64, coin (|0⟩ + i|1⟩)/√2
        psi[2 * self.ORIGIN_INDEX + 0] = 1.0 / np.sqrt(2.0)
        psi[2 * self.ORIGIN_INDEX + 1] = 1.0j / np.sqrt(2.0)
        return np.outer(psi, psi.conj())

    def simulate_all_steps(self) -> List[Dict[str, any]]:
        """
        Evolve density matrix from t = 0 through t = max_steps.

        Returns:
            List of snapshot dicts for t in [0, max_steps], containing:
            - step: int
            - distribution: Dict[int, float] (x -> probability)
            - mean: float
            - std_dev: float
            - norm_check: float
            - is_symmetric: bool
        """
        rho = self.get_initial_density_matrix()
        snapshots = []

        # Record t = 0
        snapshots.append(self._extract_step_data(0, rho))

        # Evolve step-by-step
        for t in range(1, self.max_steps + 1):
            # 1. Apply coin operation H to coin qubit
            rho = self.H_total @ rho @ self.H_total.conj().T

            # 2. Apply Phase Damping channel to coin qubit (scale off-diagonals by gamma)
            if self.noise_strength > 0.0:
                rho[self.coin_offdiag_mask] *= self.gamma

            # 3. Apply spatial shift
            rho = self.U_shift @ rho @ self.U_shift.conj().T

            snapshots.append(self._extract_step_data(t, rho))

        return snapshots

    def _extract_step_data(self, t: int, rho: np.ndarray) -> Dict[str, any]:
        """Extract spatial probability distribution and statistical moments from ρ."""
        diag = np.real(np.diag(rho))
        distribution: Dict[int, float] = {}

        for x in range(-t, t + 1):
            p = self.ORIGIN_INDEX + x
            prob = float(diag[2 * p] + diag[2 * p + 1])
            # Bound below by 0.0 against machine epsilon rounding
            distribution[x] = max(0.0, prob)

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
        std_dev = float(math.sqrt(max(0.0, variance)))

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
