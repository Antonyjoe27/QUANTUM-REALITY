import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

import numpy as np
from fastapi.testclient import TestClient

from app.main import app


def verify_t40():
    client = TestClient(app)

    print("Testing T=40 under regimes p=0.0, 0.5, 1.0...")

    # 1. Regime C: Fully decohered p=1.00, T=40
    res_c = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": 40, "noise_strength": 1.0},
    )
    assert res_c.status_code == 200, f"Failed: {res_c.text}"
    data_c = res_c.json()

    snap_c = data_c["timesteps"][40]
    noisy_c = snap_c["noisy"]
    class_c = snap_c["classical"]

    sigma_noisy_c = noisy_c["std_dev"]
    sigma_class_c = class_c["std_dev"]
    tv_c = snap_c["total_variation_distance"]
    mu_c = noisy_c["mean"]
    sum_p_c = noisy_c["norm_check"]

    print("\n[Regime C: p=1.00, T=40]")
    print(f"  Noisy std dev:     {sigma_noisy_c:.6f} (theoretical sqrt(40) = {np.sqrt(40):.6f})")
    print(f"  Classical std dev: {sigma_class_c:.6f}")
    print(f"  TV to classical:   {tv_c:.6f}")
    print(f"  Mean position:     {mu_c:.6f}")
    print(f"  Sum P(x):          {sum_p_c:.6f}")

    assert abs(sigma_noisy_c - np.sqrt(40)) < 1e-4, f"Mismatch: {sigma_noisy_c} vs {np.sqrt(40)}"
    assert abs(sigma_class_c - np.sqrt(40)) < 1e-4, f"Mismatch: {sigma_class_c} vs {np.sqrt(40)}"
    assert abs(tv_c) < 1e-4, f"Mismatch: TV = {tv_c}"
    assert abs(mu_c) < 1e-4, f"Mismatch: mu = {mu_c}"
    assert abs(sum_p_c - 1.0) < 1e-5, f"Mismatch: sum_p = {sum_p_c}"

    # 2. Regime A: Coherent p=0.00, T=40
    res_a = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": 40, "noise_strength": 0.0},
    )
    assert res_a.status_code == 200, f"Failed: {res_a.text}"
    data_a = res_a.json()

    snap_a = data_a["timesteps"][40]
    noisy_a = snap_a["noisy"]
    ideal_a = snap_a["ideal"]
    class_a = snap_a["classical"]

    sigma_noisy_a = noisy_a["std_dev"]
    sigma_ideal_a = ideal_a["std_dev"]
    sigma_class_a = class_a["std_dev"]
    tv_ideal_a = snap_a["total_variation_vs_ideal"]

    print("\n[Regime A: p=0.00, T=40]")
    print(f"  Noisy std dev:     {sigma_noisy_a:.6f}")
    print(f"  Ideal std dev:     {sigma_ideal_a:.6f}")
    print(f"  Classical std dev: {sigma_class_a:.6f}")
    print(f"  TV to ideal:       {tv_ideal_a:.6f}")

    assert abs(sigma_noisy_a - sigma_ideal_a) < 1e-4
    assert abs(tv_ideal_a) < 1e-4

    # 3. Regime B: Intermediate p=0.50, T=40
    res_b = client.post(
        "/api/quantum-walk/decoherence",
        json={"max_steps": 40, "noise_strength": 0.5},
    )
    assert res_b.status_code == 200, f"Failed: {res_b.text}"
    data_b = res_b.json()

    snap_b = data_b["timesteps"][40]
    noisy_b = snap_b["noisy"]

    sigma_noisy_b = noisy_b["std_dev"]
    tv_class_b = snap_b["total_variation_distance"]

    print("\n[Regime B: p=0.50, T=40]")
    print(f"  Noisy std dev:     {sigma_noisy_b:.6f}")
    print(f"  Classical std dev: {snap_b['classical']['std_dev']:.6f}")
    print(f"  TV to classical:   {tv_class_b:.6f}")

    # Intermediate spreading: sigma_classical < sigma_intermediate < sigma_ideal
    assert sigma_class_a < sigma_noisy_b < sigma_ideal_a, (
        f"Ordering violated: {sigma_class_a} < {sigma_noisy_b} < {sigma_ideal_a}"
    )

    print("\n==========================================")
    print("ALL T=40 SCIENTIFIC BENCHMARKS REPRODUCED!")
    print("==========================================")


if __name__ == "__main__":
    verify_t40()
