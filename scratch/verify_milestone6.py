import sys
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, "backend")

import json
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 80)
print("MILESTONE 6: INTEGRATION VERIFICATION")
print("=" * 80)

# 1. Health endpoint
res_health = client.get("/health")
assert res_health.status_code == 200
print(f"1. Health Check: Status {res_health.status_code} -> {res_health.json()}")

# 2. CORS verification
headers = {
    "Origin": "http://localhost:5173",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
}
res_cors = client.options("/api/quantum-walk/decoherence", headers=headers)
print(f"2. CORS Preflight check: Status {res_cors.status_code}")
print(f"   Allow-Origin Header: {res_cors.headers.get('access-control-allow-origin')}")

# 3. Ideal Endpoint Regression check
res_ideal = client.post("/api/quantum-walk/ideal", json={"max_steps": 10})
assert res_ideal.status_code == 200
data_ideal = res_ideal.json()
print(f"3. Ideal Endpoint: Status {res_ideal.status_code}, Steps {len(data_ideal['timesteps'])}, sigma(10) = {data_ideal['timesteps'][10]['quantum']['std_dev']:.4f}")

# 4. Decoherence Request across 3 regimes
print("\n4. Decoherence Simulation Across Regimes:")

# Regime A: p = 0.0 (Ideal limit)
res_p0 = client.post("/api/quantum-walk/decoherence", json={"max_steps": 15, "noise_strength": 0.0})
assert res_p0.status_code == 200
data_p0 = res_p0.json()
snap_p0 = data_p0["timesteps"][15]
print(f"   Regime A (p=0.0): sigma_noisy={snap_p0['noisy']['std_dev']:.4f}, sigma_ideal={snap_p0['ideal']['std_dev']:.4f}, TV(noisy, ideal)={snap_p0['total_variation_vs_ideal']:.2e}")
assert abs(snap_p0['noisy']['std_dev'] - snap_p0['ideal']['std_dev']) < 1e-10

# Regime B: p = 0.5 (Intermediate)
res_p5 = client.post("/api/quantum-walk/decoherence", json={"max_steps": 15, "noise_strength": 0.5})
assert res_p5.status_code == 200
data_p5 = res_p5.json()
snap_p5 = data_p5["timesteps"][15]
print(f"   Regime B (p=0.5): sigma_noisy={snap_p5['noisy']['std_dev']:.4f}, sigma_classical={snap_p5['classical']['std_dev']:.4f}, TV(noisy, cl)={snap_p5['total_variation_distance']:.4f}")

# Regime C: p = 1.0 (Classical limit)
res_p1 = client.post("/api/quantum-walk/decoherence", json={"max_steps": 15, "noise_strength": 1.0})
assert res_p1.status_code == 200
data_p1 = res_p1.json()
snap_p1 = data_p1["timesteps"][15]
print(f"   Regime C (p=1.0): sigma_noisy={snap_p1['noisy']['std_dev']:.4f}, sigma_classical={snap_p1['classical']['std_dev']:.4f}, TV(noisy, cl)={snap_p1['total_variation_distance']:.2e}")
assert abs(snap_p1['noisy']['std_dev'] - snap_p1['classical']['std_dev']) < 1e-10

# 5. Coordinate continuity check up to 40 steps
res_p40 = client.post("/api/quantum-walk/decoherence", json={"max_steps": 40, "noise_strength": 0.5})
assert res_p40.status_code == 200
data_p40 = res_p40.json()
snap_p40 = data_p40["timesteps"][40]
coords = [pt["x"] for pt in snap_p40["noisy"]["distribution"]]
print(f"\n5. 40-step lattice range check: Total coordinates = {len(coords)}, min x = {min(coords)}, max x = {max(coords)}")
assert min(coords) == -40 and max(coords) == 40 and len(coords) == 81

print("\nALL BACKEND & INTEGRATION CHECKS PASSED SUCCESSFULLY!")
print("=" * 80)
