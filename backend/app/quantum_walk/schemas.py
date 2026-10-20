"""
Pydantic schemas for the Ideal and Decoherent Quantum Walk Engines.
Conforms strictly to the Milestone 4 and Milestone 5 specifications.
"""

from typing import Any, List, Optional
from pydantic import BaseModel, Field


class DistributionPoint(BaseModel):
    """A single spatial point in the position probability distribution."""

    x: int = Field(..., description="Physical position coordinate on the 1D lattice.")
    probability: float = Field(..., description="Probability P(x, t) at coordinate x.")


class QuantumStepData(BaseModel):
    """Ideal quantum walk metrics and distribution at a single timestep."""

    mean: float = Field(..., description="Mean position coordinate μ(t) = Σ x·P(x, t).")
    std_dev: float = Field(
        ..., description="Standard deviation σ(t) = √(Σ (x - μ(t))²·P(x, t))."
    )
    norm_check: float = Field(
        ..., description="Sum of position probabilities Σ P(x, t), theoretically 1.0."
    )
    is_symmetric: bool = Field(
        ..., description="True if P(x, t) == P(-x, t) within numerical tolerance."
    )
    distribution: list[DistributionPoint] = Field(
        ..., description="Probability distribution over integer coordinates [-t, +t]."
    )


class NoisyStepData(BaseModel):
    """Noisy (decohered) quantum walk metrics and distribution at a single timestep."""

    mean: float = Field(..., description="Noisy mean position coordinate μ_noisy(t).")
    std_dev: float = Field(
        ..., description="Noisy standard deviation σ_noisy(t) = √(Σ (x - μ)²·P_noisy(x))."
    )
    norm_check: float = Field(
        ..., description="Sum of noisy probabilities, theoretically 1.0."
    )
    is_symmetric: bool = Field(
        ..., description="True if P_noisy(x, t) == P_noisy(-x, t) within numerical tolerance."
    )
    distribution: list[DistributionPoint] = Field(
        ..., description="Noisy probability distribution over integer coordinates [-t, +t]."
    )


class ClassicalStepData(BaseModel):
    """Classical unbiased random walk reference metrics and distribution."""

    mean: float = Field(..., description="Mean position coordinate μ_cl(t) = 0.0.")
    std_dev: float = Field(
        ..., description="Empirical standard deviation σ_cl(t) from distribution."
    )
    theoretical_std_dev: float = Field(
        ..., description="Theoretical standard deviation = √t for unbiased random walk."
    )
    norm_check: float = Field(
        ..., description="Sum of classical probabilities, theoretically 1.0."
    )
    distribution: list[DistributionPoint] = Field(
        ..., description="Classical probability distribution over [-t, +t]."
    )


class TimestepSnapshot(BaseModel):
    """Complete simulation snapshot at timestep t combining quantum and classical data."""

    step: int = Field(..., description="Current timestep t (0 <= t <= max_steps).")
    quantum: QuantumStepData = Field(..., description="Quantum walk data from Qiskit.")
    classical: ClassicalStepData = Field(
        ..., description="Classical unbiased random walk reference data."
    )
    std_dev_ratio: Optional[float] = Field(
        default=None,
        description="Ratio σ_quantum / σ_classical (ballistic vs diffusive indicator; null at t=0).",
    )
    numpy_ref_agreement: bool = Field(
        ...,
        description="True if Qiskit distribution matches independent NumPy reference within 1e-7.",
    )
    max_discrepancy_vs_numpy: float = Field(
        ...,
        description="Maximum absolute probability difference between Qiskit and NumPy reference.",
    )


class DecoherenceTimestepSnapshot(BaseModel):
    """Complete simulation snapshot at timestep t for the decoherence experiment."""

    step: int = Field(..., description="Current timestep t (0 <= t <= max_steps).")
    noisy: NoisyStepData = Field(
        ..., description="Noisy quantum walk distribution subjected to phase damping."
    )
    ideal: QuantumStepData = Field(
        ..., description="Noise-free ideal quantum walk baseline distribution."
    )
    classical: ClassicalStepData = Field(
        ..., description="Analytical unbiased classical random-walk reference."
    )
    total_variation_distance: float = Field(
        ...,
        description="Total variation distance TV(P_noisy, P_classical) = 0.5 * Σ |P_noisy(x) - P_cl(x)|.",
    )
    total_variation_vs_ideal: float = Field(
        ...,
        description="Total variation distance TV(P_noisy, P_ideal) = 0.5 * Σ |P_noisy(x) - P_ideal(x)|.",
    )
    std_dev_ratio_vs_classical: Optional[float] = Field(
        default=None,
        description="Ratio σ_noisy / σ_classical (converges to 1.0 as p -> 1; null at t=0).",
    )


class RegisterEncodingInfo(BaseModel):
    """Hardware / simulator register allocation and mapping details."""

    total_qubits: int = Field(8, description="Total qubits in circuit.")
    coin_qubit: int = Field(0, description="Qubit index for the coin (LSB).")
    position_qubits: list[int] = Field(
        [1, 2, 3, 4, 5, 6, 7],
        description="Qubit indices encoding the 7-bit position coordinate.",
    )
    num_position_states: int = Field(
        128, description="Total position states (2^7 = 128)."
    )
    origin_index: int = Field(
        64, description="Binary index corresponding to x = 0."
    )
    coordinate_formula: str = Field(
        "x = p - 64, where p in [0, 127] is the 7-bit position integer",
        description="Formula mapping register index to physical coordinate.",
    )
    boundary_safe_range: str = Field(
        "[-40, +40] maps to register indices [24, 104], strictly avoiding cyclic boundary wrap",
        description="Proof that max 40 steps cannot wrap around the 128-state boundary.",
    )


class IdealWalkRequest(BaseModel):
    """Request payload for running the ideal quantum walk simulation."""

    max_steps: int = Field(
        default=15,
        ge=0,
        le=40,
        description="Maximum number of timesteps to simulate (allowed range: 0 to 40).",
    )


class IdealWalkResponse(BaseModel):
    """Response payload containing metadata and snapshots for all timesteps 0 through max_steps."""

    model_name: str = Field(
        "Discrete-Time Quantum Walk (1D Line, Hadamard Coin, Ideal)",
        description="Formal model designation.",
    )
    academic_subtitle: str = Field(
        "Decoherence Study of a Quantum Walk",
        description="Academic project subtitle.",
    )
    noise_status: str = Field(
        "none (ideal noise-free baseline)",
        description="Indicates that no noise channels are applied in this baseline milestone.",
    )
    initial_coin_state: str = Field(
        "(|0⟩ + i|1⟩)/√2",
        description="Initial coin state chosen for symmetric distribution.",
    )
    movement_convention: str = Field(
        "|0⟩ -> shift right (x -> x + 1), |1⟩ -> shift left (x -> x - 1)",
        description="Spatial translation convention conditioned on coin state.",
    )
    timestep_sequence: str = Field(
        "Each timestep applies Hadamard H to coin, followed by conditional shift S: U = S · (I ⊗ H)",
        description="Evolution operator applied at each discrete step.",
    )
    register_encoding: RegisterEncodingInfo = Field(
        default_factory=RegisterEncodingInfo,
        description="Register and qubit allocation specifications.",
    )
    max_steps: int = Field(..., description="Requested maximum timestep count.")
    timesteps: list[TimestepSnapshot] = Field(
        ..., description="Snapshot records from timestep 0 through max_steps."
    )
    simulation_engine: str = Field(
        "Qiskit Statevector / Aer (verified against independent NumPy tensor reference)",
        description="Underlying simulation engines.",
    )
    execution_time_ms: float = Field(
        ..., description="Wall-clock simulation execution time in milliseconds."
    )


class DecoherenceWalkRequest(BaseModel):
    """Request payload for running the decoherent (noisy) quantum walk simulation."""

    max_steps: int = Field(
        default=15,
        ge=0,
        le=40,
        description="Maximum number of timesteps to simulate (allowed range: 0 to 40).",
    )
    noise_strength: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Phase damping parameter p in [0.0, 1.0] applied to coin after each H gate.",
    )


class DecoherenceWalkResponse(BaseModel):
    """Response payload containing metadata and snapshots for the decoherence experiment."""

    model_name: str = Field(
        "Discrete-Time Quantum Walk with Coin Dephasing",
        description="Formal model designation.",
    )
    academic_subtitle: str = Field(
        "Decoherence Study of a Quantum Walk",
        description="Academic project subtitle.",
    )
    noise_channel_name: str = Field(
        "Phase Damping (Dephasing) on Coin Qubit 0",
        description="Quantum noise channel model applied.",
    )
    noise_strength: float = Field(
        ...,
        description="Channel parameter p in [0, 1]. p=0 is ideal; p=1 is complete coin dephasing.",
    )
    simulation_mode: str = Field(
        "noisy mixed-state density matrix",
        description="Simulation representation used for the open quantum system.",
    )
    kraus_operators_description: str = Field(
        "K0 = [[1, 0], [0, sqrt(1-p)]], K1 = [[0, 0], [0, sqrt(p)]]; multiplies off-diagonals by sqrt(1-p)",
        description="Mathematical definition of the Kraus channel acting on coin state.",
    )
    initial_coin_state: str = Field(
        "(|0⟩ + i|1⟩)/√2 (ideal state preparation without noise)",
        description="Initial coin state at t=0.",
    )
    movement_convention: str = Field(
        "|0⟩ -> shift right (x -> x + 1), |1⟩ -> shift left (x -> x - 1)",
        description="Spatial translation convention conditioned on coin state.",
    )
    timestep_sequence: str = Field(
        "1. Apply H to coin; 2. Apply Phase Damping(p) to coin; 3. Apply Conditional Shift S",
        description="Explicit sequence of operations per timestep.",
    )
    register_encoding: RegisterEncodingInfo = Field(
        default_factory=RegisterEncodingInfo,
        description="Register and qubit allocation specifications.",
    )
    max_steps: int = Field(..., description="Requested maximum timestep count.")
    timesteps: list[DecoherenceTimestepSnapshot] = Field(
        ..., description="Snapshot records from timestep 0 through max_steps."
    )
    simulation_engine: str = Field(
        "Qiskit Aer / Density Matrix (exact Kraus superoperator evolution on 8 qubits)",
        description="Underlying simulation engines.",
    )
    execution_time_ms: float = Field(
        ..., description="Wall-clock simulation execution time in milliseconds."
    )
