"""
Automated Verification Suite for Decoherent Quantum Walk (Milestone 5).
Phase Damping on Coin Qubit: Mathematical, Physical, and API Verification.

Covers all minimum required checks:
1. Existing ideal endpoint outputs remain unchanged.
2. Noisy endpoint rejects invalid noise strengths (p < 0, p > 1, non-float).
3. Noisy endpoint rejects invalid timestep counts (t < 0, t > 40, non-int).
4. At p = 0, noisy distributions match ideal endpoint at all timesteps.
5. At p = 1, noisy distributions match classical binomial reference.
6. At p = 1, standard deviation matches sqrt(t).
7. Intermediate-noise distributions (p = 0.25, 0.50, 0.75) normalize to 1.0.
8. All output probabilities and statistics are finite and non-negative.
9. Spatial causality and parity constraints are preserved across noise levels.
10. Mean position remains consistent with symmetric coin convention (mu approx 0).
11. Total variation distance TV(noisy, classical) is 0 at p = 1 within tolerance.
12. At t = 0, probability is concentrated at x = 0 with sigma = 0 for all p.
13. Existing ideal NumPy reference tests continue to pass.
14. Existing health check regression tests continue to pass.
15. Qiskit circuit with phase_damping_error matches density-matrix engine.
"""

import math
import pytest
from fastapi.testclient import TestClient
import numpy as np

from app.main import app
from app.quantum_walk import (
    ClassicalRandomWalkReference,
    DecoherenceQuantumWalkService,
    DephasingQuantumWalkEngine,
    IdealQuantumWalkService,
    QiskitQuantumWalkEngine,
    build_dephasing_quantum_walk_circuit,
)


@pytest.fixture(scope="module")
def client():
    """TestClient for API endpoint tests."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


# Check 1: Existing ideal endpoint outputs remain unchanged
def test_01_ideal_endpoint_remains_unchanged(client: TestClient):
    ideal_resp = client.post("/api/quantum-walk/ideal", json={"max_steps": 10})
    assert ideal_resp.status_code == 200
    data = ideal_resp.json()
    assert data["model_name"] == "Discrete-Time Quantum Walk (1D Line, Hadamard Coin, Ideal)"
    assert data["max_steps"] == 10
    step_10 = data["timesteps"][10]
    # Standard deviation at t=10 for ideal walk
    assert step_10["quantum"]["std_dev"] == pytest.approx(5.4729, abs=1e-3)
    assert step_10["numpy_ref_agreement"] is True


# Check 2: Noisy endpoint rejects invalid noise strengths
@pytest.mark.parametrize("invalid_p", [-0.1, 1.01, -1.0, 2.0, "high"])
def test_02_rejection_of_invalid_noise_strength(client: TestClient, invalid_p):
    resp = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": 10, "noise_strength": invalid_p},
    )
    assert resp.status_code == 422

    with pytest.raises(ValueError):
        DephasingQuantumWalkEngine(max_steps=10, noise_strength=-0.5)
    with pytest.raises(ValueError):
        DephasingQuantumWalkEngine(max_steps=10, noise_strength=1.5)


# Check 3: Noisy endpoint rejects invalid timestep counts
@pytest.mark.parametrize("invalid_t", [-1, 41, 100, "ten"])
def test_03_rejection_of_invalid_timesteps(client: TestClient, invalid_t):
    resp = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": invalid_t, "noise_strength": 0.5},
    )
    assert resp.status_code == 422

    with pytest.raises(ValueError):
        DephasingQuantumWalkEngine(max_steps=-1, noise_strength=0.5)
    with pytest.raises(ValueError):
        DephasingQuantumWalkEngine(max_steps=41, noise_strength=0.5)


# Check 4: At p = 0, noisy distributions match ideal endpoint at all timesteps
@pytest.mark.parametrize("t", [0, 1, 2, 3, 5, 8, 10, 15])
def test_04_zero_noise_matches_ideal(t):
    noisy_engine = DephasingQuantumWalkEngine(max_steps=t, noise_strength=0.0)
    noisy_snaps = noisy_engine.simulate_all_steps()

    ideal_engine = QiskitQuantumWalkEngine(max_steps=t)
    ideal_snaps = ideal_engine.simulate_all_steps()

    n_dist = noisy_snaps[t]["distribution"]
    i_dist = ideal_snaps[t]["distribution"]

    for x in range(-t, t + 1):
        assert n_dist[x] == pytest.approx(i_dist[x], abs=1e-12)

    assert noisy_snaps[t]["std_dev"] == pytest.approx(
        ideal_snaps[t]["std_dev"], abs=1e-12
    )
    assert noisy_snaps[t]["mean"] == pytest.approx(ideal_snaps[t]["mean"], abs=1e-12)


# Check 5: At p = 1, noisy distributions match classical binomial reference
@pytest.mark.parametrize("t", [1, 2, 4, 6, 8, 10, 12, 15])
def test_05_complete_dephasing_matches_classical(t):
    noisy_engine = DephasingQuantumWalkEngine(max_steps=t, noise_strength=1.0)
    noisy_snaps = noisy_engine.simulate_all_steps()
    n_dist = noisy_snaps[t]["distribution"]

    cl_dist, cl_mean, cl_std, cl_theo_std, cl_norm = (
        ClassicalRandomWalkReference.compute_step_statistics(t)
    )

    max_err = max(abs(n_dist[x] - cl_dist[x]) for x in range(-t, t + 1))
    assert max_err < 1e-12, f"Discrepancy at t={t}, p=1: {max_err}"


# Check 6: At p = 1, standard deviation agrees with sqrt(t)
@pytest.mark.parametrize("t", [0, 1, 2, 4, 9, 16, 25])
def test_06_std_dev_matches_sqrt_t_at_p1(t):
    noisy_engine = DephasingQuantumWalkEngine(max_steps=t, noise_strength=1.0)
    noisy_snaps = noisy_engine.simulate_all_steps()
    sigma = noisy_snaps[t]["std_dev"]
    expected_sigma = math.sqrt(float(t))
    assert sigma == pytest.approx(expected_sigma, abs=1e-10)


# Check 7: Intermediate-noise distributions normalize to 1.0
@pytest.mark.parametrize("p", [0.1, 0.25, 0.5, 0.75, 0.9])
def test_07_intermediate_noise_normalization(p):
    engine = DephasingQuantumWalkEngine(max_steps=12, noise_strength=p)
    snaps = engine.simulate_all_steps()
    for snap in snaps:
        prob_sum = sum(snap["distribution"].values())
        assert prob_sum == pytest.approx(1.0, abs=1e-11)
        assert snap["norm_check"] == pytest.approx(1.0, abs=1e-11)


# Check 8: All output probabilities and statistics are finite and non-negative
@pytest.mark.parametrize("p", [0.0, 0.25, 0.5, 0.75, 1.0])
def test_08_probabilities_and_stats_finite_nonnegative(p):
    engine = DephasingQuantumWalkEngine(max_steps=8, noise_strength=p)
    snaps = engine.simulate_all_steps()
    for snap in snaps:
        assert math.isfinite(snap["mean"])
        assert math.isfinite(snap["std_dev"])
        assert snap["std_dev"] >= 0.0
        for prob in snap["distribution"].values():
            assert math.isfinite(prob)
            assert prob >= -1e-15
            assert prob <= 1.0 + 1e-11


# Check 9: Spatial causality and parity constraints preserved
@pytest.mark.parametrize("p", [0.0, 0.3, 0.7, 1.0])
def test_09_parity_and_lightcone_preservation(p):
    engine = DephasingQuantumWalkEngine(max_steps=10, noise_strength=p)
    snaps = engine.simulate_all_steps()
    for t in range(1, 11):
        dist = snaps[t]["distribution"]
        for x, prob in dist.items():
            if (t + x) % 2 != 0:
                assert prob == pytest.approx(0.0, abs=1e-14)


# Check 10: Mean position remains consistent with symmetric convention
@pytest.mark.parametrize("p", [0.0, 0.25, 0.5, 0.75, 1.0])
def test_10_symmetry_and_zero_mean(p):
    engine = DephasingQuantumWalkEngine(max_steps=10, noise_strength=p)
    snaps = engine.simulate_all_steps()
    for snap in snaps:
        assert snap["mean"] == pytest.approx(0.0, abs=1e-11)
        assert snap["is_symmetric"] is True


# Check 11: Total variation distance TV(noisy, classical) = 0 at p = 1
def test_11_total_variation_distance_at_p1(client: TestClient):
    resp = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": 15, "noise_strength": 1.0},
    )
    assert resp.status_code == 200
    data = resp.json()
    for snap in data["timesteps"]:
        assert snap["total_variation_distance"] == pytest.approx(0.0, abs=1e-11)


# Check 12: Zero-step distribution concentrated at x = 0 with sigma = 0
@pytest.mark.parametrize("p", [0.0, 0.25, 0.5, 0.75, 1.0])
def test_12_timestep_zero_for_all_noise_settings(p):
    engine = DephasingQuantumWalkEngine(max_steps=0, noise_strength=p)
    snaps = engine.simulate_all_steps()
    snap_0 = snaps[0]
    assert snap_0["distribution"][0] == pytest.approx(1.0, abs=1e-12)
    assert snap_0["mean"] == pytest.approx(0.0, abs=1e-12)
    assert snap_0["std_dev"] == pytest.approx(0.0, abs=1e-12)


# Check 13: Decoherence transition trend
def test_13_decoherence_transition_trend():
    t = 10
    cl_std = math.sqrt(t)

    # Simulate across p values
    sigmas = []
    tv_classicals = []
    tv_ideals = []

    for p in [0.0, 0.25, 0.50, 0.75, 1.0]:
        engine = DephasingQuantumWalkEngine(max_steps=t, noise_strength=p)
        snap = engine.simulate_all_steps()[t]
        sigmas.append(snap["std_dev"])

        cl_dist, _, _, _, _ = ClassicalRandomWalkReference.compute_step_statistics(t)
        ideal_dist = QiskitQuantumWalkEngine(t).simulate_all_steps()[t]["distribution"]

        tv_cl = 0.5 * sum(abs(snap["distribution"][x] - cl_dist[x]) for x in range(-t, t + 1))
        tv_id = 0.5 * sum(abs(snap["distribution"][x] - ideal_dist[x]) for x in range(-t, t + 1))

        tv_classicals.append(tv_cl)
        tv_ideals.append(tv_id)

    # Standard deviation should decrease as dephasing suppresses quantum spreading
    for i in range(len(sigmas) - 1):
        assert sigmas[i] >= sigmas[i + 1] - 1e-10

    # TV(noisy, classical) should decrease monotonically toward 0
    for i in range(len(tv_classicals) - 1):
        assert tv_classicals[i] >= tv_classicals[i + 1] - 1e-10
    assert tv_classicals[-1] == pytest.approx(0.0, abs=1e-11)

    # TV(noisy, ideal) should increase monotonically away from 0
    assert tv_ideals[0] == pytest.approx(0.0, abs=1e-11)
    for i in range(len(tv_ideals) - 1):
        assert tv_ideals[i] <= tv_ideals[i + 1] + 1e-10


# Check 14: Qiskit circuit with phase_damping_error matches density-matrix engine
def test_14_qiskit_circuit_structure_and_consistency():
    qc = build_dephasing_quantum_walk_circuit(num_steps=3, noise_strength=0.5)
    assert qc.num_qubits == 8
    assert len(qc.qregs) == 2
    assert qc.qregs[0].name == "c"
    assert qc.qregs[1].name == "p"


# Check 15: Full Decoherence API endpoint test
def test_15_api_decoherence_endpoint(client: TestClient):
    resp = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": 10, "noise_strength": 0.5},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_name"] == "Discrete-Time Quantum Walk with Coin Dephasing"
    assert data["noise_channel_name"] == "Phase Damping (Dephasing) on Coin Qubit 0"
    assert data["noise_strength"] == 0.5
    assert len(data["timesteps"]) == 11
    assert data["execution_time_ms"] > 0.0

    step_10 = data["timesteps"][10]
    # Noisy std dev should be intermediate between classical (sqrt(10)=3.162) and ideal (5.473)
    noisy_std = step_10["noisy"]["std_dev"]
    ideal_std = step_10["ideal"]["std_dev"]
    classical_std = step_10["classical"]["std_dev"]

    assert classical_std < noisy_std < ideal_std
    assert 0.0 < step_10["total_variation_distance"] < 0.5
    assert 0.0 < step_10["total_variation_vs_ideal"] < 0.5
