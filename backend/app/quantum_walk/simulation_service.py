"""
Quantum Walk Simulation Orchestrator Service.

Coordinates:
1. Ideal quantum walk simulation (Qiskit Statevector + NumPy reference).
2. Decoherent quantum walk simulation (Exact density-matrix phase damping engine).
3. Classical unbiased random-walk reference.
4. Total variation distance calculations and statistical comparisons.
"""

import time
from typing import List

from .circuit_builder import QiskitQuantumWalkEngine
from .classical_reference import ClassicalRandomWalkReference
from .dephasing_engine import DephasingQuantumWalkEngine
from .numpy_reference import NumpyQuantumWalkReference
from .schemas import (
    ClassicalStepData,
    DecoherenceTimestepSnapshot,
    DecoherenceWalkResponse,
    DistributionPoint,
    IdealWalkResponse,
    NoisyStepData,
    QuantumStepData,
    RegisterEncodingInfo,
    TimestepSnapshot,
)


class IdealQuantumWalkService:
    """Service orchestrating the ideal quantum walk and independent verifications."""

    @classmethod
    def run_simulation(cls, max_steps: int = 15) -> IdealWalkResponse:
        """
        Execute the full ideal simulation from t = 0 through max_steps.

        Args:
            max_steps: Maximum timestep (0 <= max_steps <= 40).

        Returns:
            IdealWalkResponse with complete quantum, classical, and validation data.
        """
        start_time = time.perf_counter()

        # 1. Run Qiskit simulation
        qiskit_engine = QiskitQuantumWalkEngine(max_steps=max_steps)
        qiskit_snapshots = qiskit_engine.simulate_all_steps()

        # 2. Run Independent NumPy reference simulation
        numpy_engine = NumpyQuantumWalkReference(max_steps=max_steps)
        numpy_snapshots = numpy_engine.simulate_all_steps()

        # 3. Assemble and cross-verify each timestep
        timesteps_data: List[TimestepSnapshot] = []

        for t in range(max_steps + 1):
            q_snap = qiskit_snapshots[t]
            np_snap = numpy_snapshots[t]

            # Classical reference for timestep t
            (
                cl_dist,
                cl_mean,
                cl_std,
                cl_theo_std,
                cl_norm,
            ) = ClassicalRandomWalkReference.compute_step_statistics(t)

            # Compute cross-engine discrepancy
            q_dist = q_snap["distribution"]
            np_dist = np_snap["distribution"]

            max_err = 0.0
            for x in range(-t, t + 1):
                err = abs(q_dist[x] - np_dist[x])
                if err > max_err:
                    max_err = err

            numpy_agreement = max_err < 1e-7

            # Ratio of quantum to classical standard deviation
            std_ratio = None
            if t > 0 and cl_std > 0:
                std_ratio = float(q_snap["std_dev"] / cl_std)

            # Build distribution point lists
            q_points = [
                DistributionPoint(x=x, probability=prob)
                for x, prob in sorted(q_dist.items())
            ]
            cl_points = [
                DistributionPoint(x=x, probability=prob)
                for x, prob in sorted(cl_dist.items())
            ]

            snapshot = TimestepSnapshot(
                step=t,
                quantum=QuantumStepData(
                    mean=q_snap["mean"],
                    std_dev=q_snap["std_dev"],
                    norm_check=q_snap["norm_check"],
                    is_symmetric=q_snap["is_symmetric"],
                    distribution=q_points,
                ),
                classical=ClassicalStepData(
                    mean=cl_mean,
                    std_dev=cl_std,
                    theoretical_std_dev=cl_theo_std,
                    norm_check=cl_norm,
                    distribution=cl_points,
                ),
                std_dev_ratio=std_ratio,
                numpy_ref_agreement=numpy_agreement,
                max_discrepancy_vs_numpy=max_err,
            )
            timesteps_data.append(snapshot)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return IdealWalkResponse(
            model_name="Discrete-Time Quantum Walk (1D Line, Hadamard Coin, Ideal)",
            academic_subtitle="Decoherence Study of a Quantum Walk",
            noise_status="none (ideal noise-free baseline)",
            initial_coin_state="(|0⟩ + i|1⟩)/√2",
            movement_convention="|0⟩ -> shift right (x -> x + 1), |1⟩ -> shift left (x -> x - 1)",
            timestep_sequence="Each timestep applies Hadamard H to coin, followed by conditional shift S: U = S · (I ⊗ H)",
            register_encoding=RegisterEncodingInfo(),
            max_steps=max_steps,
            timesteps=timesteps_data,
            simulation_engine="Qiskit Statevector / Aer (verified against independent NumPy tensor reference)",
            execution_time_ms=elapsed_ms,
        )


class DecoherenceQuantumWalkService:
    """Service orchestrating the decoherent quantum walk simulation."""

    @classmethod
    def run_simulation(
        cls, max_steps: int = 15, noise_strength: float = 0.5
    ) -> DecoherenceWalkResponse:
        """
        Execute the noisy quantum walk alongside the ideal baseline and classical reference.

        Args:
            max_steps: Maximum timestep (0 <= max_steps <= 40).
            noise_strength: Phase damping parameter p in [0.0, 1.0].

        Returns:
            DecoherenceWalkResponse containing all noisy, ideal, and classical data.
        """
        start_time = time.perf_counter()

        # 1. Run noisy density-matrix simulation
        noisy_engine = DephasingQuantumWalkEngine(
            max_steps=max_steps, noise_strength=noise_strength
        )
        noisy_snapshots = noisy_engine.simulate_all_steps()

        # 2. Run ideal baseline simulation
        ideal_engine = QiskitQuantumWalkEngine(max_steps=max_steps)
        ideal_snapshots = ideal_engine.simulate_all_steps()

        # 3. Assemble timesteps
        timesteps_data: List[DecoherenceTimestepSnapshot] = []

        for t in range(max_steps + 1):
            n_snap = noisy_snapshots[t]
            i_snap = ideal_snapshots[t]

            # Classical reference for timestep t
            (
                cl_dist,
                cl_mean,
                cl_std,
                cl_theo_std,
                cl_norm,
            ) = ClassicalRandomWalkReference.compute_step_statistics(t)

            n_dist = n_snap["distribution"]
            i_dist = i_snap["distribution"]

            # Compute Total Variation Distances: TV(P, Q) = 0.5 * sum |P(x) - Q(x)|
            tv_classical = 0.5 * sum(
                abs(n_dist[x] - cl_dist[x]) for x in range(-t, t + 1)
            )
            tv_ideal = 0.5 * sum(
                abs(n_dist[x] - i_dist[x]) for x in range(-t, t + 1)
            )

            # Std dev ratio vs classical
            ratio_cl = None
            if t > 0 and cl_std > 0.0:
                ratio_cl = float(n_snap["std_dev"] / cl_std)

            # Build point lists
            noisy_points = [
                DistributionPoint(x=x, probability=prob)
                for x, prob in sorted(n_dist.items())
            ]
            ideal_points = [
                DistributionPoint(x=x, probability=prob)
                for x, prob in sorted(i_dist.items())
            ]
            cl_points = [
                DistributionPoint(x=x, probability=prob)
                for x, prob in sorted(cl_dist.items())
            ]

            snapshot = DecoherenceTimestepSnapshot(
                step=t,
                noisy=NoisyStepData(
                    mean=n_snap["mean"],
                    std_dev=n_snap["std_dev"],
                    norm_check=n_snap["norm_check"],
                    is_symmetric=n_snap["is_symmetric"],
                    distribution=noisy_points,
                ),
                ideal=QuantumStepData(
                    mean=i_snap["mean"],
                    std_dev=i_snap["std_dev"],
                    norm_check=i_snap["norm_check"],
                    is_symmetric=i_snap["is_symmetric"],
                    distribution=ideal_points,
                ),
                classical=ClassicalStepData(
                    mean=cl_mean,
                    std_dev=cl_std,
                    theoretical_std_dev=cl_theo_std,
                    norm_check=cl_norm,
                    distribution=cl_points,
                ),
                total_variation_distance=float(tv_classical),
                total_variation_vs_ideal=float(tv_ideal),
                std_dev_ratio_vs_classical=ratio_cl,
            )
            timesteps_data.append(snapshot)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return DecoherenceWalkResponse(
            model_name="Discrete-Time Quantum Walk with Coin Dephasing",
            academic_subtitle="Decoherence Study of a Quantum Walk",
            noise_channel_name="Phase Damping (Dephasing) on Coin Qubit 0",
            noise_strength=noise_strength,
            simulation_mode="noisy mixed-state density matrix",
            kraus_operators_description="K0 = [[1, 0], [0, sqrt(1-p)]], K1 = [[0, 0], [0, sqrt(p)]]; multiplies off-diagonals by sqrt(1-p)",
            initial_coin_state="(|0⟩ + i|1⟩)/√2 (ideal state preparation without noise)",
            movement_convention="|0⟩ -> shift right (x -> x + 1), |1⟩ -> shift left (x -> x - 1)",
            timestep_sequence="1. Apply H to coin; 2. Apply Phase Damping(p) to coin; 3. Apply Conditional Shift S",
            register_encoding=RegisterEncodingInfo(),
            max_steps=max_steps,
            timesteps=timesteps_data,
            simulation_engine="Qiskit Aer / Density Matrix (exact Kraus superoperator evolution on 8 qubits)",
            execution_time_ms=elapsed_ms,
        )
