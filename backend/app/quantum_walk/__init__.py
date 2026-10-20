"""
QUANTUM REALITY — Quantum Walk Simulation Package
Milestone 4: Ideal (noise-free) 1D discrete-time quantum walk engine.
Milestone 5: Decoherent (phase-damping) 1D discrete-time quantum walk engine.
"""

from .circuit_builder import (
    QiskitQuantumWalkEngine,
    build_quantum_walk_circuit,
    create_shift_unitary_matrix,
)
from .classical_reference import ClassicalRandomWalkReference
from .dephasing_engine import (
    DephasingQuantumWalkEngine,
    build_dephasing_quantum_walk_circuit,
)
from .numpy_reference import NumpyQuantumWalkReference
from .schemas import (
    ClassicalStepData,
    DecoherenceTimestepSnapshot,
    DecoherenceWalkRequest,
    DecoherenceWalkResponse,
    DistributionPoint,
    IdealWalkRequest,
    IdealWalkResponse,
    NoisyStepData,
    QuantumStepData,
    RegisterEncodingInfo,
    TimestepSnapshot,
)
from .simulation_service import (
    DecoherenceQuantumWalkService,
    IdealQuantumWalkService,
)

__all__ = [
    "QiskitQuantumWalkEngine",
    "build_quantum_walk_circuit",
    "create_shift_unitary_matrix",
    "DephasingQuantumWalkEngine",
    "build_dephasing_quantum_walk_circuit",
    "ClassicalRandomWalkReference",
    "NumpyQuantumWalkReference",
    "DistributionPoint",
    "QuantumStepData",
    "NoisyStepData",
    "ClassicalStepData",
    "TimestepSnapshot",
    "DecoherenceTimestepSnapshot",
    "RegisterEncodingInfo",
    "IdealWalkRequest",
    "IdealWalkResponse",
    "DecoherenceWalkRequest",
    "DecoherenceWalkResponse",
    "IdealQuantumWalkService",
    "DecoherenceQuantumWalkService",
]
