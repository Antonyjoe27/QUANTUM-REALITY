"""
Qiskit Quantum Walk Circuit Builder and Simulation Engine.

Physical and Register Model (Milestone 4):
- 1 Coin Qubit: qubit 0 (least significant qubit in Qiskit bitstring index).
- 7 Position Qubits: qubits 1 through 7 (encoding 2^7 = 128 position sites).
- Total Qubits: 8 qubits -> 2^8 = 256 statevector dimensions.
- Coordinate Origin:
    Physical coordinate x = 0 is mapped to position index p = 64.
    Physical coordinate x in [-40, +40] maps to p in [24, 104].
    Since p remains strictly within [24, 104] for t <= 40, the periodic
    modular boundary at p = 0 and p = 127 is never reached (no cyclic wrap).
- Qubit Indexing & Basis State:
    State index k in [0, 255]:
        k = (p << 1) | c = 2*p + c
        where c in {0, 1} is coin (qubit 0)
        and p in [0, 127] is position (qubits 1..7).
- Initial State Preparation:
    Position: |x=0⟩ -> p=64 (binary 1000000_2, qubit 7 = 1) -> X(7) gate.
    Coin: (|0⟩ + i|1⟩)/√2 -> prepared from |0⟩ by applying H(0) then S(0).
- Timestep Evolution Operator:
    At each step:
        1. Coin operation: Hadamard H on qubit 0.
        2. Conditional Shift S:
            |p, 0⟩ -> |(p + 1) mod 128, 0⟩ (Right shift for coin |0⟩)
            |p, 1⟩ -> |(p - 1) mod 128, 1⟩ (Left shift for coin |1⟩)
    Total step operator: U_step = U_S · (I_pos ⊗ H_coin)
"""

import math
from typing import Dict, List, Tuple
import numpy as np

from qiskit import QuantumCircuit, QuantumRegister
from qiskit.circuit.library import UnitaryGate
from qiskit.quantum_info import Operator, Statevector


def create_shift_unitary_matrix(num_pos_states: int = 128) -> np.ndarray:
    """
    Construct the 256x256 unitary permutation matrix for the conditional shift operator.

    In Qiskit basis ordering:
        Basis index k = 2 * p + c, where c ∈ {0, 1} and p ∈ {0, ..., num_pos_states-1}.
        - For coin c = 0 (right shift): |p, 0⟩ -> |(p + 1) mod 128, 0⟩
        - For coin c = 1 (left shift):  |p, 1⟩ -> |(p - 1) mod 128, 1⟩

    Returns:
        np.ndarray of shape (256, 256) with dtype complex128, verified to satisfy U†U = I.
    """
    dim = 2 * num_pos_states
    U_shift = np.zeros((dim, dim), dtype=np.complex128)

    for p in range(num_pos_states):
        for c in range(2):
            in_idx = 2 * p + c
            # Periodic translation on the 128-site ring (boundary never reached for t <= 40)
            out_p = (p + 1) % num_pos_states if c == 0 else (p - 1) % num_pos_states
            out_idx = 2 * out_p + c
            U_shift[out_idx, in_idx] = 1.0

    # Verify unitarity numerically
    is_unitary = np.allclose(U_shift.conj().T @ U_shift, np.eye(dim), atol=1e-12)
    if not is_unitary:
        raise ValueError("Constructed shift operator is not strictly unitary (U†U != I).")

    return U_shift


# Cached shift matrix and unitary gate for simulation efficiency
_SHIFT_MATRIX_128 = create_shift_unitary_matrix(128)
_SHIFT_GATE_128 = UnitaryGate(_SHIFT_MATRIX_128, label="Shift_1D")


def build_quantum_walk_circuit(num_steps: int) -> QuantumCircuit:
    """
    Build a complete Qiskit QuantumCircuit representing the walk up to num_steps.

    Args:
        num_steps: Number of discrete steps (0 <= num_steps <= 40).

    Returns:
        A Qiskit QuantumCircuit with 1 coin qubit and 7 position qubits.
    """
    if num_steps < 0 or num_steps > 40:
        raise ValueError(f"num_steps must be in [0, 40], got {num_steps}")

    coin_reg = QuantumRegister(1, name="c")
    pos_reg = QuantumRegister(7, name="p")
    qc = QuantumCircuit(coin_reg, pos_reg, name=f"QWalk_Ideal_t{num_steps}")

    # 1. Initialize position to x = 0 (register index p = 64 = 0b1000000)
    # pos_reg[0..6] correspond to qubits 1..7.
    # p = 64 has bit 6 set (pos_reg[6], which is qubit 7).
    qc.x(pos_reg[6])

    # 2. Initialize coin to (|0⟩ + i|1⟩)/√2
    # H|0⟩ = (|0⟩ + |1⟩)/√2; S((|0⟩ + |1⟩)/√2) = (|0⟩ + i|1⟩)/√2
    qc.h(coin_reg[0])
    qc.s(coin_reg[0])

    # 3. Apply num_steps iterations of (H then Shift)
    all_qubits = [coin_reg[0]] + list(pos_reg)
    for _ in range(num_steps):
        qc.h(coin_reg[0])
        qc.append(_SHIFT_GATE_128, all_qubits)

    return qc


class QiskitQuantumWalkEngine:
    """
    Executes and extracts exact statevectors and distributions for the ideal quantum walk.

    Uses Qiskit's analytical Statevector evolution engine, ensuring zero shot-noise
    and numerical precision up to machine epsilon.
    """

    NUM_POS_STATES = 128
    ORIGIN_INDEX = 64

    def __init__(self, max_steps: int = 15):
        if max_steps < 0 or max_steps > 40:
            raise ValueError(f"max_steps must be between 0 and 40, got {max_steps}")
        self.max_steps = max_steps

        # Precompute step operator for fast iterative evolution
        step_circuit = QuantumCircuit(8)
        step_circuit.h(0)
        step_circuit.append(_SHIFT_GATE_128, range(8))
        self.step_operator = Operator(step_circuit)

    def get_initial_statevector(self) -> Statevector:
        """Construct the initial Statevector at t = 0."""
        # Basis state |00000000⟩
        sv = Statevector.from_label("0" * 8)
        # Position p = 64 (qubit 7) and coin (|0⟩ + i|1⟩)/√2 (qubit 0)
        init_circuit = QuantumCircuit(8)
        init_circuit.x(7)
        init_circuit.h(0)
        init_circuit.s(0)
        return sv.evolve(init_circuit)

    def extract_position_distribution(
        self, sv: Statevector, t: int
    ) -> Dict[int, float]:
        """
        Extract the position probability distribution P(x, t) for all x in [-t, +t].

        Sum probabilities over coin states:
            P(x, t) = |⟨p, 0|ψ⟩|² + |⟨p, 1|ψ⟩|²  where p = ORIGIN_INDEX + x
        """
        probs = np.abs(sv.data) ** 2
        dist: Dict[int, float] = {}

        for x in range(-t, t + 1):
            p = self.ORIGIN_INDEX + x
            prob = float(probs[2 * p] + probs[2 * p + 1])
            dist[x] = prob

        return dist

    def simulate_all_steps(self) -> List[Dict[str, any]]:
        """
        Evolve the walk from t = 0 through t = max_steps and extract all snapshots.

        Returns:
            List of snapshot dicts containing step, distribution, mean, std_dev, norm_check, is_symmetric.
        """
        current_sv = self.get_initial_statevector()
        snapshots = []

        # Step 0
        snapshots.append(self._analyze_step(0, current_sv))

        # Iteratively evolve for steps 1 .. max_steps
        for t in range(1, self.max_steps + 1):
            current_sv = current_sv.evolve(self.step_operator)
            snapshots.append(self._analyze_step(t, current_sv))

        return snapshots

    def _analyze_step(self, t: int, sv: Statevector) -> Dict[str, any]:
        """Compute metrics for statevector at timestep t."""
        dist = self.extract_position_distribution(sv, t)
        norm_sum = float(sum(dist.values()))

        if t == 0:
            return {
                "step": 0,
                "distribution": dist,
                "mean": 0.0,
                "std_dev": 0.0,
                "norm_check": norm_sum,
                "is_symmetric": True,
            }

        mean = float(sum(x * p for x, p in dist.items()))
        variance = float(sum((x - mean) ** 2 * p for x, p in dist.items()))
        std_dev = float(math.sqrt(max(0.0, variance)))

        # Symmetry test: P(x, t) == P(-x, t)
        is_symmetric = all(abs(dist[x] - dist[-x]) < 1e-12 for x in range(1, t + 1))

        return {
            "step": t,
            "distribution": dist,
            "mean": mean,
            "std_dev": std_dev,
            "norm_check": norm_sum,
            "is_symmetric": is_symmetric,
        }
