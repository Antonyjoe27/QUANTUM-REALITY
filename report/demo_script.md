# QUANTUM REALITY — LIVE DEMONSTRATION SCRIPT
## Step-by-Step Interactive Demonstration Protocol for the Quantum Walk Workbench

**Project Title**: QUANTUM REALITY — Decoherence Study of a Quantum Walk  
**Target Audience**: Academic Reviewers, IA Examiners, and Conference Attendees  
**Document**: `report/demo_script.md`  
**Execution Environment**: Windows 11, PowerShell, Node.js, Python 3.11  

---

## 1. System Requirements & Startup Procedure

Open two separate PowerShell terminal windows at workspace root: `D:\VISHAL ANNAN`.

### Terminal 1: Launch Backend API Server
```powershell
# Navigate to workspace root
cd "D:\VISHAL ANNAN"

# Start FastAPI server on port 8000 using the project virtual environment
backend\.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
*Expected Console Output*:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

### Terminal 2: Launch Frontend Development Server
```powershell
# Navigate to frontend directory
cd "D:\VISHAL ANNAN\frontend"

# Launch Vite dev server on port 5173
npm run dev
```
*Expected Console Output*:
```
  VITE v8.3.4  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Browser Access
Open Google Chrome or Mozilla Firefox and navigate to:
```
http://localhost:5173/
```
Verify:
1. Workbench 3D scene renders with the Blender laboratory table and central track.
2. The UI header displays: **QUANTUM REALITY: Decoherence Study of a Quantum Walk**.
3. The right-hand Inspector Panel is populated with Local Position Information, Global Walk Ensemble Statistics, and Scientific Charts.

---

## 2. Interactive Demonstration Walkthrough

### Part A: Regime A — Coherent Quantum Walk ($p = 0.00$)
1. **Configure Parameters**:
   - In the right-hand **Experiment Controls** panel, click the preset button **"Regime A (p=0.0)"**.
   - Ensure the Timesteps slider is set to **40**.
   - Click **"Run Simulation"**.
2. **Observe 3D Probability Bars**:
   - Notice the central lattice track in the 3D scene.
   - The bars on the outer wings at $x \approx \pm 28$ are tall (highlighted in champagne gold), while the center near $x = 0$ is depressed.
   - Zero-probability sites (parity-forbidden nodes where $x \not\equiv t \pmod 2$) show flat base pins with zero bar height ($h = 0.00$), strictly reflecting physical reality.
3. **Inspect Timestep Dynamics**:
   - In the bottom docked scrubber, click the **Play** button to watch time evolve from $t = 0$ to $t = 40$.
   - Pause at $t = 40$.
4. **Verbal Explanation to Examiner**:
   > *"Notice how the quantum walker expands ballistically. Rather than diffusing randomly from the origin, quantum superposition and constructive interference create two dominant outward-moving wavefronts near $x \approx \pm t/\sqrt{2}$. Destructive interference hollows out the origin. At $t = 40$, the standard deviation is $\sigma = 21.66$, more than three times greater than the classical bound of $\sqrt{40} \approx 6.32$."*

---

### Part B: Regime B — Intermediate Dephasing ($p = 0.50$)
1. **Configure Parameters**:
   - Click the preset button **"Regime B (p=0.5)"** (or drag the Noise Strength slider to $0.50$).
   - Click **"Run Simulation"**.
2. **Observe Distribution Shift**:
   - Look at the live SVG chart in the Inspector Panel.
   - The two sharp outer interference peaks have significantly reduced in height, and the central depression has filled in.
   - In the 3D viewport, probability is visibly redistributed toward the center.
3. **Inspect Ensemble Metrics**:
   - Look at the **Global Walk Ensemble Statistics** card:
     - Noisy Standard Deviation: **$\sigma \approx 10.30$**.
     - Classical Reference: **$\sigma_{\text{classical}} = 6.32$**.
     - Total Variation Distance to Classical: **$TV \approx 0.1907$**.
4. **Verbal Explanation to Examiner**:
   > *"At $p = 0.50$, the phase damping Kraus channel dampens the off-diagonal coin coherences by $\sqrt{1 - 0.5} \approx 0.707$ at each step. This partial decoherence progressively destroys path interference, suppressing ballistic propagation and bringing the standard deviation down from 21.66 to 10.30."*

---

### Part C: Regime C — Complete Dephasing / Classical Walk ($p = 1.00$)
1. **Configure Parameters**:
   - Click the preset button **"Regime C (p=1.0)"** (or drag the Noise Strength slider to $1.00$).
   - Click **"Run Simulation"**.
2. **Observe Complete Classical Convergence**:
   - In the SVG chart, the gold noisy curve and the grey dashed classical reference curve overlap identically.
   - The distribution is completely unimodal, peaking at $x = 0$ and tapering symmetrically.
3. **Verify Quantitative Benchmark**:
   - Point to the metrics displayed in the Inspector Panel:
     - Noisy Standard Deviation: **$\sigma_{\text{noisy}} = 6.3246$** (matches $\sqrt{40} = 6.324555$).
     - Classical Standard Deviation: **$\sigma_{\text{classical}} = 6.3246$**.
     - Total Variation Distance: **$TV(P_{\text{noisy}}, P_{\text{classical}}) = 0.0000$**.
     - Mean Position: **$\mu = 0.0000$**.
     - Probability Sum: **$\sum P(x) = 1.00000$**.
4. **Verbal Explanation to Examiner**:
   > *"At $p = 1.00$, off-diagonal coherences are multiplied by $\sqrt{1 - 1} = 0$, completely eliminating all quantum phase memory. The Hadamard coin acts as an unbiased 50/50 classical random coin. As predicted mathematically, the standard deviation matches $\sqrt{t} = \sqrt{40} \approx 6.3246$ exactly, and the Total Variation Distance between the decohered walk and the classical binomial reference is identically zero."*

---

### Part D: Interactive Lattice Site Inspection
1. **Hover / Click on a 3D Site**:
   - In the 3D scene, hover your mouse over coordinate $x = +2$.
   - A floating badge appears showing coordinate and probability.
   - Click on the bar at $x = +2$.
2. **Examine Local Position Information Card**:
   - Physical Coordinate: **$x = +2$**.
   - Position-Register Index: **$66$** ($64 + 2$).
   - Parity Status: **Parity-Allowed** ($2 \equiv 40 \pmod 2$).
   - Local probabilities: $P_{\text{noisy}}$, $P_{\text{ideal}}$, $P_{\text{classical}}$, and absolute difference.
3. **Examine Parity-Forbidden Site**:
   - Click on coordinate $x = +1$.
   - Parity Status: **Parity-Forbidden** ($1 \not\equiv 40 \pmod 2$).
   - Probability: **$0.00000$** ($h = 0$).

---

### Part E: Experiment Data Export
1. **Export JSON**:
   - In the Experiment Controls panel, click **"Export JSON"**.
   - The browser downloads `quantum_walk_p100_t40.json` containing complete metadata, timesteps, and probabilities.
2. **Export CSV**:
   - Click **"Export CSV"**.
   - The browser downloads `quantum_walk_p100_t40.csv` containing tidy rows of `(step, x, p_noisy, p_ideal, p_classical, mean_noisy, std_noisy, std_classical, tv_classical, tv_ideal)` for external statistical analysis.

---

## 3. Fallback Procedure (Fail-Safe Resilience)

If any unforeseen technical issue occurs during a live presentation:

### Scenario 1: Backend Server is Offline
- **Symptom**: The frontend displays a warning badge: *"Simulation backend unavailable (showing demo mode)"*.
- **Recovery Action**:
  1. Switch to PowerShell Terminal 1.
  2. Run the verified standalone verification script:
     ```powershell
     backend\.venv\Scripts\python backend\verify_t40.py
     ```
  3. This executes the FastAPI app directly via in-memory `TestClient` and prints all verified numerical results to stdout.

### Scenario 2: WebGL or Browser Hardware Acceleration Fails
- **Symptom**: Browser shows black canvas or WebGL crash error.
- **Recovery Action**:
  1. Open the high-resolution publication figures generated in `report/figures/`:
     - `report/figures/fig1_spatial_distributions_t40.png`
     - `report/figures/fig2_std_dev_vs_timestep.png`
     - `report/figures/fig3_std_dev_vs_noise_param.png`
     - `report/figures/fig4_tv_distance_vs_noise_param.png`
     - `report/figures/fig5_p100_vs_classical_residual.png`
  2. Open the verified summary data in `report/evidence/summary_t40.csv`.
  3. Walk the examiner through the slide deck `report/Quantum_Reality_IA_Presentation.pptx`.

### Scenario 3: Complete Offline Execution Test
To prove that the entire simulation suite is 100% genuine and reproducible without external web dependencies:
```powershell
backend\.venv\Scripts\python -m pytest backend/tests/ -v
```
All 123 unit and physical validation tests execute and pass in under 15 seconds.
