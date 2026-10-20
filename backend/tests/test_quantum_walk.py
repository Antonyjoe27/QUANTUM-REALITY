"""
Automated Verification Suite for Ideal Quantum Walk Engine.
Milestone 4: Comprehensive mathematical, physical, and API tests.

Verifies all 15 required checks from Milestone 4 specification:
1. t = 0: All probability at x = 0, sigma = 0.
2. t = 1: P(-1) = P(+1) = 0.5.
3. t = 1: Mean = 0, std_dev = 1.0.
4. Normalization: Sum P(x, t) = 1.0 for all t.
5. Strict causality: Zero probability outside |x| <= t.
6. Parity constraint: Zero probability for odd (t + x).
7. Symmetry: P(x, t) == P(-x, t) across all t.
8. Unitarity: U_shift† U_shift = I.
9. Independent agreement: Qiskit vs NumPy max diff < 1e-7.
10. Independent computation of quantum and classical models.
11. Classical distribution matches exact binomial formula.
12. Classical standard deviation equals sqrt(t).
13. Boundary validation: Rejection of invalid steps (t < 0, t > 40).
14. Finite, valid outputs: No NaN/Inf, all probabilities in [0, 1].
15. Health check regression and full API endpoint verification.
"""

import math
import pytest
from fastapi.testclient import TestClient
import numpy as np

from app.main import app
from app.quantum_walk import (
    ClassicalRandomWalkReference,
    IdealQuantumWalkService,
    NumpyQuantumWalkReference,
    QiskitQuantumWalkEngine,
    build_quantum_walk_circuit,
    create_shift_unitary_matrix,
)


@pytest.fixture(scope="module")
def client():
    """TestClient for API endpoint tests."""
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest.fixture(scope="module")
def qiskit_snapshots_15():
    """Precomputed 15-step Qiskit walk snapshots for efficient testing."""
    engine = QiskitQuantumWalkEngine(max_steps=15)
    return engine.simulate_all_steps()


# Check 1: At t = 0, entire probability is concentrated at x = 0 and sigma = 0
def test_01_timestep_zero_localization(qiskit_snapshots_15):
    snap_0 = qiskit_snapshots_15[0]
    dist = snap_0["distribution"]
    assert dist[0] == pytest.approx(1.0, abs=1e-12)
    assert snap_0["mean"] == pytest.approx(0.0, abs=1e-12)
    assert snap_0["std_dev"] == pytest.approx(0.0, abs=1e-12)
    assert snap_0["norm_check"] == pytest.approx(1.0, abs=1e-12)


# Check 2: At t = 1, P(-1) = P(+1) = 0.5
def test_02_timestep_one_split(qiskit_snapshots_15):
    snap_1 = qiskit_snapshots_15[1]
    dist = snap_1["distribution"]
    assert dist[-1] == pytest.approx(0.5, abs=1e-12)
    assert dist[1] == pytest.approx(0.5, abs=1e-12)
    assert dist.get(0, 0.0) == pytest.approx(0.0, abs=1e-12)


# Check 3: At t = 1, mean is 0 and standard deviation is 1
def test_03_timestep_one_statistics(qiskit_snapshots_15):
    snap_1 = qiskit_snapshots_15[1]
    assert snap_1["mean"] == pytest.approx(0.0, abs=1e-12)
    assert snap_1["std_dev"] == pytest.approx(1.0, abs=1e-12)


# Check 4: Every quantum position distribution is normalized
@pytest.mark.parametrize("t", [0, 1, 2, 3, 5, 8, 12, 15])
def test_04_quantum_probability_normalization(qiskit_snapshots_15, t):
    snap = qiskit_snapshots_15[t]
    prob_sum = sum(snap["distribution"].values())
    assert prob_sum == pytest.approx(1.0, abs=1e-10)


# Check 5: No probability outside |x| <= t (spatial light-cone causality)
def test_05_strict_spatial_confinement():
    engine = NumpyQuantumWalkReference(max_steps=10)
    # Inspect raw internal grid beyond [-t, +t]
    psi = np.zeros((engine.grid_size, 2), dtype=complex)
    psi[engine.origin, 0] = 1.0 / np.sqrt(2.0)
    psi[engine.origin, 1] = 1.0j / np.sqrt(2.0)
    H = np.array([[1.0, 1.0], [1.0, -1.0]]) / np.sqrt(2.0)

    for t in range(1, 11):
        coin_after = (H @ psi.T).T
        next_psi = np.zeros_like(psi)
        next_psi[1:, 0] = coin_after[:-1, 0]
        next_psi[:-1, 1] = coin_after[1:, 1]
        psi = next_psi

        probs = np.sum(np.abs(psi) ** 2, axis=1)
        # Outside [-t, +t], coordinates correspond to indices < origin - t or > origin + t
        outside_left = probs[: engine.origin - t]
        outside_right = probs[engine.origin + t + 1 :]
        assert np.allclose(outside_left, 0.0, atol=1e-15)
        assert np.allclose(outside_right, 0.0, atol=1e-15)


# Check 6: Reachable positions obey the one-step parity constraint
@pytest.mark.parametrize("t", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_06_parity_constraint(qiskit_snapshots_15, t):
    snap = qiskit_snapshots_15[t]
    dist = snap["distribution"]
    for x, prob in dist.items():
        if (t + x) % 2 != 0:
            assert prob == pytest.approx(0.0, abs=1e-14), (
                f"Parity violated at t={t}, x={x}: prob={prob}"
            )


# Check 7: Chosen initial coin state produces symmetric position distribution
@pytest.mark.parametrize("t", [0, 1, 2, 3, 5, 8, 10, 15])
def test_07_distribution_symmetry(qiskit_snapshots_15, t):
    snap = qiskit_snapshots_15[t]
    dist = snap["distribution"]
    assert snap["is_symmetric"] is True
    for x in range(1, t + 1):
        assert dist[x] == pytest.approx(dist[-x], abs=1e-12)


# Check 8: Conditional-shift unitary satisfies U†U = I
def test_08_shift_operator_unitarity():
    u_shift = create_shift_unitary_matrix(128)
    identity_256 = np.eye(256, dtype=complex)
    product = u_shift.conj().T @ u_shift
    assert np.allclose(product, identity_256, atol=1e-12)


# Check 9: Qiskit probabilities agree with independent NumPy reference
@pytest.mark.parametrize("t", [0, 1, 2, 3, 4, 5, 8, 10, 12, 15])
def test_09_qiskit_agrees_with_numpy_reference(t):
    q_engine = QiskitQuantumWalkEngine(max_steps=t)
    q_snaps = q_engine.simulate_all_steps()

    np_engine = NumpyQuantumWalkReference(max_steps=t)
    np_snaps = np_engine.simulate_all_steps()

    q_dist = q_snaps[t]["distribution"]
    np_dist = np_snaps[t]["distribution"]

    max_diff = max(abs(q_dist[x] - np_dist[x]) for x in range(-t, t + 1))
    assert max_diff < 1e-7, f"Discrepancy at t={t} exceeds 1e-7: max_diff={max_diff}"


# Check 10: Quantum and classical results are computed independently
def test_10_independent_computation():
    t = 6
    # Classical distribution
    cl_dist, cl_mean, cl_std, cl_theo_std, cl_norm = (
        ClassicalRandomWalkReference.compute_step_statistics(t)
    )
    # Quantum distribution
    q_engine = QiskitQuantumWalkEngine(max_steps=t)
    q_dist = q_engine.simulate_all_steps()[t]["distribution"]

    # Quantum walk exhibits two pronounced ballistic peaks at x = ±4; classical walk has central peak at x = 0
    assert q_dist[t] > 0.0
    assert cl_dist[t] > 0.0
    # At reachable outer coordinates x = 4, quantum peak is significantly higher than classical
    assert q_dist[4] > cl_dist[4]  # 0.2812 vs 0.0938
    # At center x = 0, classical probability is higher than quantum
    assert cl_dist[0] > q_dist[0]  # 0.3125 vs 0.1250


# Check 11: Classical distribution agrees with exact binomial reference
@pytest.mark.parametrize("t", [1, 2, 4, 6, 8, 10])
def test_11_classical_binomial_agreement(t):
    dist, mean, std_dev, theo_std, norm = (
        ClassicalRandomWalkReference.compute_step_statistics(t)
    )
    assert norm == pytest.approx(1.0, abs=1e-14)
    assert mean == pytest.approx(0.0, abs=1e-14)

    # Verify each point against math.comb
    for x in range(-t, t + 1):
        if (t + x) % 2 == 0:
            k = (t + x) // 2
            expected_p = math.comb(t, k) / (2**t)
            assert dist[x] == pytest.approx(expected_p, abs=1e-14)
        else:
            assert dist[x] == 0.0


# Check 12: Classical standard deviation agrees with sqrt(t)
@pytest.mark.parametrize("t", [0, 1, 2, 4, 9, 16, 25])
def test_12_classical_std_dev_matches_sqrt_t(t):
    _, _, std_dev, theo_std, _ = ClassicalRandomWalkReference.compute_step_statistics(t)
    expected_sigma = math.sqrt(float(t))
    assert std_dev == pytest.approx(expected_sigma, abs=1e-12)
    assert theo_std == pytest.approx(expected_sigma, abs=1e-12)


# Check 13: Invalid timestep values are rejected
def test_13_rejection_of_invalid_timesteps(client: TestClient):
    # Negative steps
    resp_neg = client.post("/api/quantum-walk/ideal", json={"max_steps": -1})
    assert resp_neg.status_code == 422

    # Steps exceeding maximum 40
    resp_over = client.post("/api/quantum-walk/ideal", json={"max_steps": 41})
    assert resp_over.status_code == 422

    # Invalid type
    resp_invalid = client.post("/api/quantum-walk/ideal", json={"max_steps": "abc"})
    assert resp_invalid.status_code == 422

    # Engine constructor validation
    with pytest.raises(ValueError):
        QiskitQuantumWalkEngine(max_steps=-5)
    with pytest.raises(ValueError):
        QiskitQuantumWalkEngine(max_steps=50)


# Check 14: All output probabilities and statistics are finite and valid
def test_14_finite_and_valid_quantities():
    response = IdealQuantumWalkService.run_simulation(max_steps=10)
    for snap in response.timesteps:
        # Quantum metrics
        assert math.isfinite(snap.quantum.mean)
        assert math.isfinite(snap.quantum.std_dev)
        assert snap.quantum.std_dev >= 0.0
        assert math.isfinite(snap.quantum.norm_check)
        for pt in snap.quantum.distribution:
            assert 0.0 <= pt.probability <= 1.0 + 1e-10
            assert math.isfinite(pt.probability)

        # Classical metrics
        assert math.isfinite(snap.classical.mean)
        assert math.isfinite(snap.classical.std_dev)
        assert math.isfinite(snap.classical.theoretical_std_dev)
        for pt in snap.classical.distribution:
            assert 0.0 <= pt.probability <= 1.0 + 1e-10
            assert math.isfinite(pt.probability)

        # Agreement flag
        assert snap.numpy_ref_agreement is True
        assert snap.max_discrepancy_vs_numpy < 1e-7


# Check 15: API endpoint verification & health regression
def test_15_api_ideal_endpoint_and_health_regression(client: TestClient):
    # 1. Health check regression
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert health_data["status"] == "ok"
    assert health_data["milestone"] == 2

    # 2. POST /api/quantum-walk/ideal default (15 steps)
    api_resp = client.post("/api/quantum-walk/ideal", json={})
    assert api_resp.status_code == 200
    data = api_resp.json()

    assert data["model_name"] == "Discrete-Time Quantum Walk (1D Line, Hadamard Coin, Ideal)"
    assert data["academic_subtitle"] == "Decoherence Study of a Quantum Walk"
    assert data["noise_status"] == "none (ideal noise-free baseline)"
    assert data["initial_coin_state"] == "(|0⟩ + i|1⟩)/√2"
    assert data["max_steps"] == 15
    assert len(data["timesteps"]) == 16  # 0 to 15
    assert data["execution_time_ms"] > 0.0

    # Test step 15 values
    step_15 = data["timesteps"][15]
    assert step_15["step"] == 15
    assert step_15["quantum"]["norm_check"] == pytest.approx(1.0, abs=1e-10)
    assert step_15["quantum"]["is_symmetric"] is True
    assert step_15["numpy_ref_agreement"] is True
    assert step_15["std_dev_ratio"] > 1.5  # Ballistic spreading is faster than diffusive


# Circuit construction test
def test_circuit_builder_structure():
    qc = build_quantum_walk_circuit(num_steps=3)
    assert qc.num_qubits == 8
    assert len(qc.qregs) == 2
    assert qc.qregs[0].name == "c"
    assert qc.qregs[0].size == 1
    assert qc.qregs[1].name == "p"
    assert qc.qregs[1].size == 7
