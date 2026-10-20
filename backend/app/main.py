"""
QUANTUM REALITY — Backend API
Milestone 4: Ideal Quantum Walk Engine with Qiskit and NumPy reference.
Milestone 5: Decoherence Study with Phase Damping on Coin Qubit.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.quantum_walk import (
    DecoherenceQuantumWalkService,
    DecoherenceWalkRequest,
    DecoherenceWalkResponse,
    IdealQuantumWalkService,
    IdealWalkRequest,
    IdealWalkResponse,
)

app = FastAPI(
    title="Quantum Reality API",
    description="Backend for the Decoherence Study of a Quantum Walk (IA project).",
    version="0.3.0",
)

# Allow the Vite dev server to reach this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", summary="Health check")
def health_check() -> dict:
    """
    Returns a JSON object confirming the API is running.
    Maintains exact Milestone 2 schema compatibility for health checks.
    """
    return {
        "status": "ok",
        "service": "quantum-reality-api",
        "version": "0.1.0",
        "simulation_engine": "not_connected",
        "milestone": 2,
    }


@app.post(
    "/api/quantum-walk/ideal",
    response_model=IdealWalkResponse,
    summary="Simulate Ideal Quantum Walk",
    description="Simulate noise-free 1D discrete-time quantum walk using Qiskit, cross-verified with NumPy.",
)
def simulate_ideal_walk(
    request: IdealWalkRequest = IdealWalkRequest(),
) -> IdealWalkResponse:
    """
    Simulate the ideal discrete-time quantum walk on a 1D line.

    - Coin state: (|0⟩ + i|1⟩)/√2 (symmetric Hadamard walk).
    - Position register: 7 qubits (128 sites, origin at index 64).
    - Steps: 0 to 40 (strictly preventing cyclic boundary wrap).
    - Cross-verified against independent NumPy amplitude tensor reference.
    - Accompanied by classical unbiased random walk reference (σ = √t).
    """
    try:
        return IdealQuantumWalkService.run_simulation(max_steps=request.max_steps)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@app.post(
    "/api/quantum-walk/decoherence",
    response_model=DecoherenceWalkResponse,
    summary="Simulate Decoherent Quantum Walk with Coin Dephasing",
    description="Simulate 1D discrete-time quantum walk under coin phase damping noise using density-matrix simulation.",
)
def simulate_decoherent_walk(
    request: DecoherenceWalkRequest = DecoherenceWalkRequest(),
) -> DecoherenceWalkResponse:
    """
    Simulate the decoherent discrete-time quantum walk on a 1D line with coin dephasing.

    - Noise channel: Phase Damping on coin qubit 0 after each Hadamard gate.
    - Parameter p in [0.0, 1.0]:
        p = 0.0: Ideal quantum walk baseline (ballistic spreading σ ∝ t).
        p = 1.0: Complete coin dephasing (exact convergence to classical binomial walk σ = √t).
        0 < p < 1: Intermediate decoherence transition.
    - Mixed-state density-matrix simulation on 8 qubits (256 states).
    - Accompanied by ideal baseline, classical reference, and total variation distance TV(P_noisy, P_classical).
    """
    try:
        return DecoherenceQuantumWalkService.run_simulation(
            max_steps=request.max_steps, noise_strength=request.noise_strength
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
